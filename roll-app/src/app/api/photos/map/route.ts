import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export interface MapPhoto {
  id: string;
  thumbnailUrl: string;
  latitude: number;
  longitude: number;
  dateTaken: string | null;
}

/**
 * GET /api/photos/map
 *
 * Returns all geotagged photos for map visualization.
 * Only includes photos with valid latitude/longitude coordinates.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, thumbnail_url, latitude, longitude, date_taken')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('date_taken', { ascending: false, nullsFirst: false })
      .limit(1000);

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    const mapPhotos: MapPhoto[] = (photos ?? []).map((p) => ({
      id: p.id,
      thumbnailUrl: p.thumbnail_url,
      latitude: p.latitude!,
      longitude: p.longitude!,
      dateTaken: p.date_taken,
    }));

    return NextResponse.json({ data: mapPhotos });
  } catch (err) {
    captureError(err, { context: 'photos-map' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
