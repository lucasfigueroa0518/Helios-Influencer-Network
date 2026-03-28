import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { publishSingleImage, publishCarousel, publishReel } from '@/lib/instagram/publish';
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit';

export async function publishScheduledPosts(_job: Job) {
  const supabase = createServiceRoleClient();

  const { data: duePosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .lte('scheduled_at', new Date().toISOString())
    .eq('picked_up', false)
    .order('priority', { ascending: false })
    .limit(10);

  if (!duePosts?.length) return;

  for (const sp of duePosts) {
    const { data: claimed, error: claimErr } = await supabase
      .from('scheduled_posts')
      .update({ picked_up: true, picked_up_at: new Date().toISOString() })
      .eq('id', sp.id)
      .eq('picked_up', false)
      .select()
      .single();

    if (claimErr || !claimed) continue;

    const { data: post } = await supabase.from('posts').select('*').eq('id', sp.post_id).single();
    const { data: account } = await supabase.from('accounts').select('*').eq('id', sp.account_id).single();

    if (!post || !account || !account.access_token_enc || !account.token_iv) continue;

    try {
      const rl = await checkRateLimit(rateLimiters.instagramPublish, account.id);
      if (!rl.success) {
        const newTime = new Date(new Date(sp.scheduled_at).getTime() + 15 * 60 * 1000).toISOString();
        await supabase.from('scheduled_posts').update({ scheduled_at: newTime, picked_up: false }).eq('id', sp.id);
        continue;
      }

      const token = decrypt(account.access_token_enc, account.token_iv);
      await supabase.from('posts').update({ status: 'publishing' }).eq('id', post.id);

      const fullCaption = `${post.caption}\n\n${post.hashtags.map((h: string) => `#${h}`).join(' ')}`.trim();

      let igResult: { id: string; permalink?: string; media_url?: string };

      if (post.media_type === 'carousel') {
        igResult = await publishCarousel(token, account.instagram_user_id!, post.media_urls, fullCaption);
      } else if (post.media_type === 'reel' || post.media_type === 'video') {
        igResult = await publishReel(token, account.instagram_user_id!, post.media_urls[0], fullCaption);
      } else {
        igResult = await publishSingleImage(token, account.instagram_user_id!, post.media_urls[0], fullCaption);
      }

      await supabase.from('posts').update({
        status: 'published',
        instagram_post_id: igResult.id,
        instagram_permalink: igResult.permalink ?? null,
        published_at: new Date().toISOString(),
      }).eq('id', post.id);

      await supabase.from('scheduled_posts').delete().eq('id', sp.id);

    } catch (error) {
      const shouldRetry = post.retry_count < 3;
      await supabase.from('posts').update({
        status: shouldRetry ? 'scheduled' : 'failed',
        failure_reason: (error as Error).message,
        retry_count: post.retry_count + 1,
      }).eq('id', post.id);

      if (shouldRetry) {
        const backoffMs = 15 * 60 * 1000 * (post.retry_count + 1);
        await supabase.from('scheduled_posts').update({
          scheduled_at: new Date(Date.now() + backoffMs).toISOString(),
          picked_up: false,
        }).eq('id', sp.id);
      } else {
        await supabase.from('scheduled_posts').delete().eq('id', sp.id);
      }
    }
  }
}
