import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';
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

    const { data: suggestion, error: sugErr } = await supabase
      .from('topic_suggestions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (sugErr) throw sugErr;
    if (!suggestion || suggestion.status !== 'pending') {
      return NextResponse.json(apiError('NOT_FOUND', 'Suggestion not found'), { status: 404 });
    }

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: suggestion.topic,
        topic_keywords: suggestion.suggested_keywords ?? [],
        hashtag_tracking: [],
        campaign_goals: {} as Json,
        auto_suggested: true,
      })
      .select()
      .single();

    if (clientErr) throw clientErr;

    const { data: updated, error: updErr } = await supabase
      .from('topic_suggestions')
      .update({ status: 'accepted', client_id: client.id })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw updErr;

    return NextResponse.json(apiSuccess({ suggestion: updated, client }));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
