import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

export async function POST(
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

    const { data: suggestion, error: fetchErr } = await supabase
      .from('topic_suggestions')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!suggestion || suggestion.status !== 'pending') {
      return NextResponse.json(apiError('NOT_FOUND', 'Suggestion not found'), { status: 404 });
    }

    const { data, error } = await supabase
      .from('topic_suggestions')
      .update({ status: 'dismissed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
