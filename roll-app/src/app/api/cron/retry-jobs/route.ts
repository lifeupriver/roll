import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/cron/retry-jobs — Retry failed processing jobs that haven't exceeded max attempts.
 *
 * Intended to be called by Vercel Cron (every 5 minutes).
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    // Find failed jobs that haven't exceeded max_attempts
    const { data: failedJobs, error: fetchError } = await supabase
      .from('processing_jobs')
      .select('id, attempts, max_attempts')
      .eq('status', 'failed')
      .lt('attempts', 3) // Default max_attempts
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    let retriedCount = 0;

    for (const job of failedJobs ?? []) {
      const maxAttempts = job.max_attempts ?? 3;
      if (job.attempts >= maxAttempts) continue;

      const { error: updateError } = await supabase
        .from('processing_jobs')
        .update({
          status: 'pending',
          error_message: null,
          attempts: job.attempts + 1,
          started_at: null,
          completed_at: null,
        })
        .eq('id', job.id)
        .eq('status', 'failed'); // Atomic: only retry if still failed

      if (!updateError) {
        retriedCount++;
      }
    }

    // Also clean up stale "running" jobs (stuck for >15 minutes)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: staleJobs, error: staleError } = await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: 'Job timed out (stuck in running state for >15 minutes)',
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'running')
      .lt('started_at', fifteenMinAgo)
      .select('id');

    if (staleError) {
      captureError(staleError, { context: 'cron-retry-jobs-stale-cleanup' });
    }

    return NextResponse.json({
      success: true,
      retriedJobs: retriedCount,
      staleJobsReset: staleJobs?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    captureError(err, { context: 'cron-retry-jobs' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
