import { NextResponse } from 'next/server';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface HealthPayload {
  status: 'ok' | 'degraded';
  service: 'nexus-platform';
  database: 'connected' | 'unconfigured' | 'error';
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthPayload>> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'nexus-platform',
        database: 'unconfigured',
        timestamp,
      },
      { status: 200 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('badges')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          service: 'nexus-platform',
          database: 'error',
          timestamp,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        service: 'nexus-platform',
        database: 'connected',
        timestamp,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'nexus-platform',
        database: 'error',
        timestamp,
      },
      { status: 503 }
    );
  }
}
