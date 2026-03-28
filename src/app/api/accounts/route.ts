import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAccountSchema } from '@/lib/validators/accounts';
import { apiSuccess, apiError } from '@/types/api';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data), { status: 201 });
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
