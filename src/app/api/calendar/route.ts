import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

const calendarQuerySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  account_id: z.string().uuid().optional(),
});

async function getAccountIdsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase.from('accounts').select('id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((a) => a.id);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    if (raw.account_id === 'all' || raw.account_id === '') delete raw.account_id;
    const parsed = calendarQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid query', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { start, end, account_id } = parsed.data;
    const accountIds = await getAccountIdsForUser(supabase, user.id);
    if (accountIds.length === 0) {
      return NextResponse.json(apiSuccess([]));
    }

    if (account_id && !accountIds.includes(account_id)) {
      return NextResponse.json(apiError('FORBIDDEN', 'Account not accessible'), { status: 403 });
    }

    const filterIds = account_id ? [account_id] : accountIds;

    const [scheduledRes, publishedRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .in('account_id', filterIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('posts')
        .select('*')
        .in('account_id', filterIds)
        .eq('status', 'published')
        .gte('published_at', start)
        .lte('published_at', end)
        .order('published_at', { ascending: true }),
    ]);

    if (scheduledRes.error) throw scheduledRes.error;
    if (publishedRes.error) throw publishedRes.error;

    const byId = new Map<string, (typeof scheduledRes.data)[number]>();
    for (const row of scheduledRes.data ?? []) byId.set(row.id, row);
    for (const row of publishedRes.data ?? []) byId.set(row.id, row);
    const data = Array.from(byId.values());

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
