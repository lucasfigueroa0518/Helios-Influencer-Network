import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updatePostSchema } from '@/lib/validators/posts';
import { apiSuccess, apiError } from '@/types/api';

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

async function getPostIfAllowed(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  postId: string,
  accountIds: string[]
) {
  const { data, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (error) throw error;
  if (!data || !accountIds.includes(data.account_id)) return null;
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    const post = await getPostIfAllowed(supabase, id, accountIds);
    if (!post) {
      return NextResponse.json(apiError('NOT_FOUND', 'Post not found'), { status: 404 });
    }

    return NextResponse.json(apiSuccess(post));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    const existing = await getPostIfAllowed(supabase, id, accountIds);
    if (!existing) {
      return NextResponse.json(apiError('NOT_FOUND', 'Post not found'), { status: 404 });
    }

    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    const existing = await getPostIfAllowed(supabase, id, accountIds);
    if (!existing) {
      return NextResponse.json(apiError('NOT_FOUND', 'Post not found'), { status: 404 });
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json(apiSuccess({ deleted: true }));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
