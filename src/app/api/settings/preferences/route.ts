import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

const preferencesPatchSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  notify_new_comments: z.boolean().optional(),
  notify_new_dms: z.boolean().optional(),
  notify_post_published: z.boolean().optional(),
  notify_post_failed: z.boolean().optional(),
  notify_topic_suggestion: z.boolean().optional(),
  notify_team_activity: z.boolean().optional(),
  default_calendar_view: z.enum(['month', 'week']).optional(),
  sidebar_collapsed: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = preferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(parsed.data)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(apiSuccess(data));
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(apiSuccess(data));
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
