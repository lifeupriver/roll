import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/photos/clusters
 * Groups visible photos into temporal/location clusters.
 * Returns clusters sorted by recency.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch visible photos with date_taken, ordered chronologically
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, thumbnail_url, date_taken, latitude, longitude, aesthetic_score, face_count, scene_classification')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .not('date_taken', 'is', null)
      .order('date_taken', { ascending: false })
      .limit(500);

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ data: { clusters: [] } });
    }

    // Group photos into temporal clusters (within 4 hours = same moment)
    const CLUSTER_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours
    function findCover(cluster: typeof photos) {
      let best = cluster[0];
      for (let i = 1; i < cluster.length; i++) {
        if ((cluster[i].aesthetic_score ?? 0) > (best.aesthetic_score ?? 0)) {
          best = cluster[i];
        }
      }
      return best;
    }
    const clusters: Array<{
      id: string;
      cover_photo: typeof photos[0];
      date_range: string;
      count: number;
      location?: string;
    }> = [];

    let currentCluster: typeof photos = [];
    let clusterStart: Date | null = null;

    for (const photo of photos) {
      const photoDate = new Date(photo.date_taken!);

      if (clusterStart && Math.abs(photoDate.getTime() - clusterStart.getTime()) > CLUSTER_GAP_MS) {
        // Close current cluster
        if (currentCluster.length >= 3) {
          const start = new Date(currentCluster[currentCluster.length - 1].date_taken!);
          const end = new Date(currentCluster[0].date_taken!);
          const cover = findCover(currentCluster);

          clusters.push({
            id: `cluster-${cover.id}`,
            cover_photo: cover,
            date_range: formatDateRange(start, end),
            count: currentCluster.length,
          });
        }
        currentCluster = [];
      }

      currentCluster.push(photo);
      clusterStart = photoDate;
    }

    // Close last cluster
    if (currentCluster.length >= 3) {
      const start = new Date(currentCluster[currentCluster.length - 1].date_taken!);
      const end = new Date(currentCluster[0].date_taken!);
      const cover = findCover(currentCluster);

      clusters.push({
        id: `cluster-${cover.id}`,
        cover_photo: cover,
        date_range: formatDateRange(start, end),
        count: currentCluster.length,
      });
    }

    return NextResponse.json({ data: { clusters: clusters.slice(0, 20) } });
  } catch (err) {
    captureError(err, { context: 'photo-clusters' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', opts);

  if (startStr === endStr) return startStr;

  // Same month — show "Oct 12–14"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}`;
  }

  // Different months — show "Oct 12 – Nov 3"
  return `${startStr} – ${endStr}`;
}
