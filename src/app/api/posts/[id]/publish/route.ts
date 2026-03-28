import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

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

    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'publishing' })
      .eq('id', postId)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
