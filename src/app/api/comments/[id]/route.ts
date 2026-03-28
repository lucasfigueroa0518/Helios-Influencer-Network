import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';
import { z } from 'zod';

const patchSchema = z.object({
  response_status: z.enum(['unread', 'ai_drafted', 'approved', 'sent', 'ignored', 'spam']).optional(),
  ai_response_draft: z.string().nullable().optional(),
  kind: z.enum(['comment', 'dm']).optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()), { status: 400 });
    }

    const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id);
    const ids = (accounts ?? []).map((a) => a.id);
    if (!ids.length) return NextResponse.json(apiError('NOT_FOUND', 'Not found'), { status: 404 });

    const kind = parsed.data.kind ?? 'comment';
    const table = kind === 'dm' ? 'direct_messages' : 'comments';
    const updates: Record<string, unknown> = {};
    if (parsed.data.response_status !== undefined) updates.response_status = parsed.data.response_status;
    if (parsed.data.ai_response_draft !== undefined) updates.ai_response_draft = parsed.data.ai_response_draft;

    const { data: row, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .in('account_id', ids)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!row) return NextResponse.json(apiError('NOT_FOUND', 'Not found'), { status: 404 });
    return NextResponse.json(apiSuccess(row));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
