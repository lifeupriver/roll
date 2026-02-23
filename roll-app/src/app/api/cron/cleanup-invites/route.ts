import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/cron/cleanup-invites — Delete expired circle invites.
 *
 * Intended to be called by Vercel Cron (daily at midnight UTC).
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
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

    // Delete unconsumed invites that have expired
    const { data, error } = await supabase
      .from('circle_invites')
      .delete()
      .is('consumed_at', null)
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw error;
    }

    const deletedCount = data?.length ?? 0;

    return NextResponse.json({
      success: true,
      deletedInvites: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    captureError(err, { context: 'cron-cleanup-invites' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
