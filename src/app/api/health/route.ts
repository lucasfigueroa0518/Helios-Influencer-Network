import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

async function checkSupabase(): Promise<{ healthy: boolean; latency_ms: number }> {
  const start = Date.now();
  try {
    const supabase = createServiceRoleClient();
    await supabase.from('profiles').select('id').limit(1);
    return { healthy: true, latency_ms: Date.now() - start };
  } catch {
    return { healthy: false, latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const dbCheck = await checkSupabase();

  const checks = {
    database: dbCheck,
  };

  const healthy = Object.values(checks).every((c) => c.healthy);

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
