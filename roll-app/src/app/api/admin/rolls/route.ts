import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    // Status breakdown
    const { data: allRolls } = await db.from('rolls').select('status, film_profile, photo_count, processing_started_at, processing_completed_at');

    const statusBreakdown: Record<string, number> = {};
    const filmProfileBreakdown: Record<string, number> = {};
    const photoCountDist: number[] = [];
    let totalProcessingMs = 0;
    let processedCount = 0;
    let errorCount = 0;

    if (allRolls) {
      for (const r of allRolls) {
        statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        if (r.film_profile) {
          filmProfileBreakdown[r.film_profile] = (filmProfileBreakdown[r.film_profile] || 0) + 1;
        }
        photoCountDist.push(r.photo_count);
        if (r.status === 'error') errorCount++;
        if (r.processing_started_at && r.processing_completed_at) {
          totalProcessingMs += new Date(r.processing_completed_at).getTime() - new Date(r.processing_started_at).getTime();
          processedCount++;
        }
      }
    }

    // Recent rolls list (filterable)
    let query = db.from('rolls')
      .select('id, name, status, film_profile, photo_count, user_id, created_at, updated_at, processing_error')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: recentRolls } = await query;

    return NextResponse.json({
      total: allRolls?.length ?? 0,
      statusBreakdown,
      filmProfileBreakdown: Object.entries(filmProfileBreakdown).sort(([, a], [, b]) => b - a),
      avgProcessingTimeMins: processedCount > 0 ? (totalProcessingMs / processedCount) / 60000 : 0,
      errorRate: allRolls?.length ? ((errorCount / allRolls.length) * 100) : 0,
      avgPhotosPerRoll: photoCountDist.length > 0 ? photoCountDist.reduce((a, b) => a + b, 0) / photoCountDist.length : 0,
      rolls: recentRolls ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-rolls' });
    return NextResponse.json({ error: 'Failed to load roll analytics' }, { status: 500 });
  }
}
