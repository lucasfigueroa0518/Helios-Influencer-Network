import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getInstagramAuthUrl } from '@/lib/instagram/auth';
import { apiSuccess, apiError } from '@/types/api';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return NextResponse.json(apiError('NOT_FOUND', 'Account not found'), { status: 404 });
    }

    const authUrl = getInstagramAuthUrl(id);
    return NextResponse.json(apiSuccess({ auth_url: authUrl }));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
