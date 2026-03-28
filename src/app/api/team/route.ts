import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'creator', 'viewer']),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { data: rows, error } = await supabase
      .from('team_members')
      .select('*')
      .or(`team_owner_id.eq.${user.id},user_id.eq.${user.id}`)
      .order('invited_at', { ascending: false });

    if (error) throw error;

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } =
      userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', userIds)
        : { data: [] as { id: string; full_name: string; avatar_url: string | null; role: string }[] };

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const members = (rows ?? []).map((row) => ({
      ...row,
      profile: profileById.get(row.user_id) ?? null,
    }));

    return NextResponse.json(apiSuccess(members));
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
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()), { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        apiError('INTERNAL_ERROR', 'Team invites require SUPABASE_SERVICE_ROLE_KEY to be configured'),
        { status: 503 }
      );
    }

    const admin = createServiceRoleClient();
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
        : undefined,
    });

    if (inviteErr) {
      return NextResponse.json(apiError('VALIDATION_ERROR', inviteErr.message), { status: 400 });
    }

    if (!invited.user?.id) {
      return NextResponse.json(apiError('INTERNAL_ERROR', 'Invite did not return a user id'), { status: 500 });
    }

    const { data: row, error: insertErr } = await supabase
      .from('team_members')
      .insert({
        team_owner_id: user.id,
        user_id: invited.user.id,
        role: parsed.data.role,
        invited_email: parsed.data.email,
        invite_status: 'pending',
        permissions: {},
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json(apiSuccess(row), { status: 201 });
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
