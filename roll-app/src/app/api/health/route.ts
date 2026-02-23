import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/health — Lightweight health check for monitoring.
 *
 * Returns 200 when the app is running and core dependencies are reachable.
 * Used by uptime monitors (e.g. Vercel cron, Betterstack, Pingdom).
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // 1. Environment variables present
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'R2_ACCOUNT_ID',
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.env = {
    ok: missingVars.length === 0,
    ...(missingVars.length > 0 && { error: `Missing: ${missingVars.join(', ')}` }),
  };

  // 2. Supabase connectivity
  const dbStart = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      checks.database = { ok: false, error: 'Supabase credentials not configured' };
    } else {
      const supabase = createClient(url, key);
      const { error } = await supabase.from('profiles').select('id').limit(1);
      checks.database = {
        ok: !error,
        ms: Date.now() - dbStart,
        ...(error && { error: error.message }),
      };
    }
  } catch (err) {
    checks.database = {
      ok: false,
      ms: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // 3. R2 connectivity (check env only — no network call to avoid latency)
  const r2Configured = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
  checks.storage = {
    ok: r2Configured,
    ...(!r2Configured && { error: 'R2 credentials not configured' }),
  };

  // Overall status
  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
