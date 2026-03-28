import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

function startOfWeekUtc(d: Date) {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    const weekStart = startOfWeekUtc(new Date());

    const empty = {
      posts_this_week: 0,
      avg_engagement_rate: 0,
      follower_growth_placeholder: null as number | null,
      pending_approvals: 0,
    };

    if (accountIds.length === 0) {
      return NextResponse.json(apiSuccess(empty));
    }

    const [postsWeekRes, engagementRes, pendingCommentsRes, pendingPostsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('account_id', accountIds)
        .gte('created_at', weekStart),
      supabase
        .from('posts')
        .select('engagement_rate')
        .in('account_id', accountIds)
        .eq('status', 'published'),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .in('account_id', accountIds)
        .in('response_status', ['unread', 'ai_drafted']),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('account_id', accountIds)
        .eq('status', 'pending_review'),
    ]);

    if (postsWeekRes.error) throw postsWeekRes.error;
    if (engagementRes.error) throw engagementRes.error;
    if (pendingCommentsRes.error) throw pendingCommentsRes.error;
    if (pendingPostsRes.error) throw pendingPostsRes.error;

    const rates = (engagementRes.data ?? []).map((r) => r.engagement_rate ?? 0);
    const avgEngagement =
      rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    const pendingApprovals =
      (pendingCommentsRes.count ?? 0) + (pendingPostsRes.count ?? 0);

    return NextResponse.json(
      apiSuccess({
        posts_this_week: postsWeekRes.count ?? 0,
        avg_engagement_rate: avgEngagement,
        follower_growth_placeholder: null,
        pending_approvals: pendingApprovals,
      })
    );
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
