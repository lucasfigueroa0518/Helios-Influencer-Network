import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { data, error } = await supabase
      .from('topic_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(apiSuccess(data ?? []));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
