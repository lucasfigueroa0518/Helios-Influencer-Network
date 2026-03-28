import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

const presignBodySchema = z.object({
  filename: z.string().min(1).max(500),
  contentType: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

    const body = await request.json();
    const parsed = presignBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError('VALIDATION_ERROR', 'Invalid input', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage.from('uploads').createSignedUploadUrl(path);
    if (error) throw error;
    if (!data) {
      return NextResponse.json(apiError('INTERNAL_ERROR', 'Could not create upload URL'), { status: 500 });
    }

    return NextResponse.json(
      apiSuccess({
        ...data,
        contentType: parsed.data.contentType,
      })
    );
  } catch (err) {
    return NextResponse.json(apiError('INTERNAL_ERROR', (err as Error).message), { status: 500 });
  }
}
