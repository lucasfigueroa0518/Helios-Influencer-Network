import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const status = searchParams.get('response_status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const perPage = parseInt(searchParams.get('per_page') ?? '20');
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('direct_messages')
      .select('*, accounts!inner(user_id, display_name, instagram_username)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (accountId) query = query.eq('account_id', accountId);
    if (status) query = query.eq('response_status', status as 'unread' | 'ai_drafted' | 'approved' | 'sent' | 'ignored' | 'spam');

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return NextResponse.json(apiSuccess(data, {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    }));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
