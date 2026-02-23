import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();

    const [allJobsRes, recentFailedRes, recentCompletedRes] = await Promise.all([
      db.from('processing_jobs').select('type, status, created_at, started_at, completed_at'),

      db.from('processing_jobs')
        .select('id, type, status, error_message, attempts, max_attempts, payload, created_at, started_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(50),

      db.from('processing_jobs')
        .select('id, type, created_at, started_at, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(100),
    ]);

    const statusBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    if (allJobsRes.data) {
      for (const j of allJobsRes.data) {
        statusBreakdown[j.status] = (statusBreakdown[j.status] || 0) + 1;
        typeBreakdown[j.type] = (typeBreakdown[j.type] || 0) + 1;
      }
    }

    // Processing time stats from recent completed jobs
    const processingTimes: number[] = [];
    if (recentCompletedRes.data) {
      for (const j of recentCompletedRes.data) {
        if (j.started_at && j.completed_at) {
          processingTimes.push(new Date(j.completed_at).getTime() - new Date(j.started_at).getTime());
        }
      }
    }
    processingTimes.sort((a, b) => a - b);
    const p50 = processingTimes[Math.floor(processingTimes.length * 0.5)] ?? 0;
    const p95 = processingTimes[Math.floor(processingTimes.length * 0.95)] ?? 0;
    const p99 = processingTimes[Math.floor(processingTimes.length * 0.99)] ?? 0;

    return NextResponse.json({
      total: allJobsRes.data?.length ?? 0,
      statusBreakdown,
      typeBreakdown,
      processingTimeMs: { p50, p95, p99 },
      failedJobs: recentFailedRes.data ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-pipeline' });
    return NextResponse.json({ error: 'Failed to load pipeline' }, { status: 500 });
  }
}
