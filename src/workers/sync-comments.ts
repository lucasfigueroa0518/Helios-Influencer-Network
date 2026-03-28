import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit';

const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';

export async function syncComments(_job: Job) {
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

    const { data: posts } = await supabase
      .from('posts')
      .select('id, instagram_post_id')
      .eq('account_id', account.id)
      .eq('status', 'published')
      .not('instagram_post_id', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20);

    if (!posts?.length) continue;

    for (const post of posts) {
      if (!post.instagram_post_id) continue;

      try {
        const res = await fetch(
          `${GRAPH_API_BASE}/${post.instagram_post_id}/comments?fields=id,text,username,timestamp&access_token=${token}`
        );
        if (!res.ok) continue;

        const data = await res.json();
        const comments = data.data ?? [];

        for (const comment of comments) {
          const existing = await supabase
            .from('comments')
            .select('id')
            .eq('instagram_comment_id', comment.id)
            .single();

          if (existing.data) continue;

          await supabase.from('comments').insert({
            post_id: post.id,
            account_id: account.id,
            instagram_comment_id: comment.id,
            author_username: comment.username ?? 'unknown',
            body: comment.text ?? '',
            response_status: 'unread',
          });
        }
      } catch {
        // Skip individual post errors
      }
    }
  }
}
