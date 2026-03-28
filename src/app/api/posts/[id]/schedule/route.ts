import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { schedulePostSchema } from '@/lib/validators/posts';
import { apiSuccess, apiError } from '@/types/api';

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = schedulePostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id, account_id')
      .eq('id', postId)
      .maybeSingle();
    if (postErr) throw postErr;
    if (!post || !accountIds.includes(post.account_id)) {
      return NextResponse.json(apiError('NOT_FOUND', 'Post not found'), { status: 404 });
    }

    const { scheduled_at, priority } = parsed.data;

    const { data: updated, error: updErr } = await supabase
      .from('posts')
      .update({ scheduled_at, status: 'scheduled' })
      .eq('id', postId)
      .select()
      .single();
    if (updErr) throw updErr;

    const { data: existingRow } = await supabase
      .from('scheduled_posts')
      .select('id')
      .eq('post_id', postId)
      .maybeSingle();

    if (existingRow) {
      const { error: schedErr } = await supabase
        .from('scheduled_posts')
        .update({ scheduled_at, priority })
        .eq('id', existingRow.id);
      if (schedErr) throw schedErr;
    } else {
      const { error: insErr } = await supabase.from('scheduled_posts').insert({
        post_id: postId,
        account_id: post.account_id,
        scheduled_at,
        priority,
      });
      if (insErr) throw insErr;
    }

    return NextResponse.json(apiSuccess(updated));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
