import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json, UpdateTables } from '@/lib/supabase/types';
import { updateClientSchema } from '@/lib/validators/clients';
import { apiSuccess, apiError } from '@/types/api';

export async function GET(
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

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(apiError('NOT_FOUND', 'Client not found'), { status: 404 });
    }

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { campaign_goals, ...rest } = parsed.data;
    const payload: UpdateTables<'clients'> = {
      ...rest,
      ...(campaign_goals !== undefined ? { campaign_goals: campaign_goals as Json } : {}),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(apiError('NOT_FOUND', 'Client not found'), { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function DELETE(
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

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(apiError('NOT_FOUND', 'Client not found'), { status: 404 });
    }

    const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json(apiSuccess({ deleted: true }));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
