import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();

    const [
      totalRes,
      filterStatusRes,
      filterReasonRes,
      cameraRes,
      sceneRes,
      aestheticRes,
    ] = await Promise.all([
      db.from('photos').select('id', { count: 'exact', head: true }),

      db.from('photos').select('filter_status'),

      db.from('photos').select('filter_reason').not('filter_reason', 'is', null),

      db.from('photos')
        .select('camera_make, camera_model')
        .not('camera_make', 'is', null)
        .limit(5000),

      db.from('photos')
        .select('scene_classification')
        .not('scene_classification', 'eq', '{}')
        .limit(5000),

      db.from('photos')
        .select('aesthetic_score')
        .not('aesthetic_score', 'is', null)
        .limit(5000),
    ]);

    // Filter status breakdown
    const statusBreakdown: Record<string, number> = {};
    if (filterStatusRes.data) {
      for (const p of filterStatusRes.data) {
        statusBreakdown[p.filter_status] = (statusBreakdown[p.filter_status] || 0) + 1;
      }
    }

    // Filter reason breakdown
    const reasonBreakdown: Record<string, number> = {};
    if (filterReasonRes.data) {
      for (const p of filterReasonRes.data) {
        if (p.filter_reason) {
          reasonBreakdown[p.filter_reason] = (reasonBreakdown[p.filter_reason] || 0) + 1;
        }
      }
    }

    // Camera breakdown
    const cameraBreakdown: Record<string, number> = {};
    if (cameraRes.data) {
      for (const p of cameraRes.data) {
        const key = [p.camera_make, p.camera_model].filter(Boolean).join(' ') || 'Unknown';
        cameraBreakdown[key] = (cameraBreakdown[key] || 0) + 1;
      }
    }

    // Scene breakdown
    const sceneBreakdown: Record<string, number> = {};
    if (sceneRes.data) {
      for (const p of sceneRes.data) {
        const labels = p.scene_classification as string[] | null;
        if (labels) {
          for (const label of labels) {
            sceneBreakdown[label] = (sceneBreakdown[label] || 0) + 1;
          }
        }
      }
    }

    // Aesthetic score distribution (buckets of 0.1)
    const aestheticBuckets: Record<string, number> = {};
    let aestheticSum = 0;
    let aestheticCount = 0;
    if (aestheticRes.data) {
      for (const p of aestheticRes.data) {
        if (p.aesthetic_score !== null) {
          const bucket = (Math.floor(p.aesthetic_score * 10) / 10).toFixed(1);
          aestheticBuckets[bucket] = (aestheticBuckets[bucket] || 0) + 1;
          aestheticSum += p.aesthetic_score;
          aestheticCount++;
        }
      }
    }

    return NextResponse.json({
      total: totalRes.count ?? 0,
      filterStatus: statusBreakdown,
      filterReasons: reasonBreakdown,
      cameras: Object.entries(cameraBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15),
      scenes: Object.entries(sceneBreakdown)
        .sort(([, a], [, b]) => b - a),
      aestheticDistribution: aestheticBuckets,
      avgAestheticScore: aestheticCount > 0 ? aestheticSum / aestheticCount : 0,
    });
  } catch (err) {
    captureError(err, { context: 'admin-photos' });
    return NextResponse.json({ error: 'Failed to load photo analytics' }, { status: 500 });
  }
}
