import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

const rescheduleBodySchema = z.object({
  post_id: z.string().uuid(),
  new_scheduled_at: z.string().datetime(),
});

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = rescheduleBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { post_id, new_scheduled_at } = parsed.data;
    const accountIds = await getAccountIdsForUser(supabase, user.id);

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id, account_id')
      .eq('id', post_id)
      .maybeSingle();
    if (postErr) throw postErr;
    if (!post || !accountIds.includes(post.account_id)) {
      return NextResponse.json(apiError('NOT_FOUND', 'Post not found'), { status: 404 });
    }

    const { data: updated, error: updPostErr } = await supabase
      .from('posts')
      .update({ scheduled_at: new_scheduled_at })
      .eq('id', post_id)
      .select()
      .single();
    if (updPostErr) throw updPostErr;

    const { error: schedErr } = await supabase
      .from('scheduled_posts')
      .update({ scheduled_at: new_scheduled_at })
      .eq('post_id', post_id);
    if (schedErr) throw schedErr;

    return NextResponse.json(apiSuccess(updated));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
