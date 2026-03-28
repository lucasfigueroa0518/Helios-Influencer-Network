import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json(apiSuccess({ user, profile }));
  } catch {
    return NextResponse.json(apiError('INTERNAL_ERROR', 'Session check failed'), { status: 500 });
  }
}
