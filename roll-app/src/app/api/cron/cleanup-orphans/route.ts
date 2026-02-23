import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/cron/cleanup-orphans — Remove orphaned photo records.
 *
 * Finds photos stuck in 'pending' filter_status for >24 hours
 * (upload started but never completed processing) and marks them
 * for cleanup. Does NOT delete from R2 — that requires a separate
 * reconciliation step.
 *
 * Intended to be called by Vercel Cron (daily at 3 AM UTC).
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

    // Photos stuck in 'pending' for more than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: orphaned, error } = await supabase
      .from('photos')
      .update({
        filter_status: 'filtered_auto',
        filter_reason: 'document', // reuse existing enum — closest to "processing failed"
      })
      .eq('filter_status', 'pending')
      .lt('created_at', oneDayAgo)
      .select('id');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orphanedPhotosMarked: orphaned?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    captureError(err, { context: 'cron-cleanup-orphans' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
