import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { getPostInsights } from '@/lib/instagram/api';
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit';

export async function syncMetrics(_job: Job) {
  const supabase = createServiceRoleClient();

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .not('access_token_enc', 'is', null);

  if (!accounts?.length) return;

  for (const account of accounts) {
    if (!account.access_token_enc || !account.token_iv) continue;

    const rl = await checkRateLimit(rateLimiters.instagramRead, account.id);
    if (!rl.success) continue;

    const token = decrypt(account.access_token_enc, account.token_iv);

    const { data: publishedPosts } = await supabase
      .from('posts')
      .select('id, instagram_post_id')
      .eq('account_id', account.id)
      .eq('status', 'published')
      .not('instagram_post_id', 'is', null)
      .order('published_at', { ascending: false })
      .limit(50);

    if (!publishedPosts?.length) continue;

    for (const post of publishedPosts) {
      if (!post.instagram_post_id) continue;

      try {
        const insights = await getPostInsights(token, post.instagram_post_id);

        const engagementRate = insights.reach > 0
          ? (insights.likes + insights.comments + insights.saved + insights.shares) / insights.reach
          : 0;

        await supabase.from('post_metrics_history').insert({
          post_id: post.id,
          likes: insights.likes,
          comments: insights.comments,
          reach: insights.reach,
          impressions: insights.impressions,
          saves: insights.saved,
          shares: insights.shares,
          engagement_rate: Math.round(engagementRate * 10000) / 10000,
        });

        await supabase.from('posts').update({
          likes_count: insights.likes,
          comments_count: insights.comments,
          reach: insights.reach,
          impressions: insights.impressions,
          saves: insights.saved,
          shares: insights.shares,
          engagement_rate: Math.round(engagementRate * 10000) / 10000,
        }).eq('id', post.id);

      } catch {
        // Skip individual post errors, continue syncing
      }
    }
  }
}
