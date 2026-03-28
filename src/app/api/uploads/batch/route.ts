import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

const fileItemSchema = z.object({
  media_type: z.enum(['image', 'video', 'carousel', 'reel']),
  media_urls: z.array(z.string()).min(1),
  media_hash: z.string().optional().nullable(),
});

const batchBodySchema = z.object({
  account_id: z.string().uuid(),
  files: z.array(fileItemSchema).min(1),
});

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = batchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const accountIds = await getAccountIdsForUser(supabase, user.id);
    if (!accountIds.includes(parsed.data.account_id)) {
      return NextResponse.json(apiError('FORBIDDEN', 'Account not accessible'), { status: 403 });
    }

    const { account_id, files } = parsed.data;
    const total = files.length;

    const { data: batch, error: batchErr } = await supabase
      .from('upload_batches')
      .insert({
        account_id,
        uploaded_by: user.id,
        total_files: total,
        processed_files: 0,
        failed_files: 0,
        error_log: [],
      })
      .select()
      .single();
    if (batchErr) throw batchErr;

    const rows = files.map((f) => ({
      account_id,
      upload_batch_id: batch.id,
      media_type: f.media_type,
      media_urls: f.media_urls,
      media_hash: f.media_hash ?? null,
      caption: '',
      hashtags: [] as string[],
      detected_topics: [] as string[],
      status: 'draft' as const,
    }));

    const { data: posts, error: postsErr } = await supabase.from('posts').insert(rows).select();
    if (postsErr) throw postsErr;

    return NextResponse.json(apiSuccess({ batch, posts: posts ?? [] }), { status: 201 });
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
