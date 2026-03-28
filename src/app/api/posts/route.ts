import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPostSchema } from '@/lib/validators/posts';
import { apiSuccess, apiError } from '@/types/api';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  account_id: z.string().uuid().optional(),
  status: z
    .enum([
      'draft',
      'pending_review',
      'approved',
      'scheduled',
      'publishing',
      'published',
      'failed',
      'archived',
    ])
    .optional(),
  client_id: z.string().uuid().optional(),
  media_type: z.enum(['image', 'video', 'carousel', 'reel']).optional(),
  q: z.string().optional(),
});

function paginationMeta(page: number, perPage: number, count: number | null) {
  const total = count ?? 0;
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  };
}

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
    const parsed = listQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid query', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { page, per_page: perPage, account_id, status, client_id, media_type, q: captionQ } =
      parsed.data;
    const accountIds = await getAccountIdsForUser(supabase, user.id);
    if (accountIds.length === 0) {
      return NextResponse.json(apiSuccess([], paginationMeta(page, perPage, 0)));
    }

    if (account_id && !accountIds.includes(account_id)) {
      return NextResponse.json(apiError('FORBIDDEN', 'Account not accessible'), { status: 403 });
    }

    const filterIds = account_id ? [account_id] : accountIds;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let qb = supabase
      .from('posts')
      .select(
        `
        *,
        accounts(display_name, avatar_url, instagram_username)
      `,
        { count: 'exact' }
      )
      .in('account_id', filterIds)
      .order('updated_at', { ascending: false });

    if (status) qb = qb.eq('status', status);
    if (client_id) qb = qb.eq('client_id', client_id);
    if (media_type) qb = qb.eq('media_type', media_type);
    const search = captionQ?.trim();
    if (search) qb = qb.ilike('caption', `%${search}%`);

    const { data, error, count } = await qb.range(from, to);
    if (error) throw error;

    return NextResponse.json(apiSuccess(data ?? [], paginationMeta(page, perPage, count)));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
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

    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...parsed.data,
        caption: parsed.data.caption ?? '',
        hashtags: parsed.data.hashtags ?? [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
