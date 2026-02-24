import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export interface SmartCollection {
  id: string;
  type: 'trip' | 'people' | 'season' | 'camera';
  title: string;
  subtitle: string | null;
  coverPhotoId: string;
  coverThumbnailUrl: string;
  photoCount: number;
  dateRange: { start: string; end: string } | null;
}

/**
 * GET /api/collections
 *
 * Returns automatically generated smart collections based on photo metadata.
 * Groups by: trips (date+location clusters), people, seasons, cameras.
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
      .select('id, thumbnail_url, date_taken, latitude, longitude, camera_make, camera_model, face_count, scene_classification, created_at')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .order('date_taken', { ascending: true, nullsFirst: false });

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const collections: SmartCollection[] = [];

    // ── Trip detection ────────────────────────────────────────────────
    // Group photos taken within 3 days of each other with similar locations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withDates = photos.filter((p: any) => p.date_taken);
    if (withDates.length > 0) {
      let currentTrip: typeof withDates = [withDates[0]];
      const trips: (typeof withDates)[] = [];

      for (let i = 1; i < withDates.length; i++) {
        const prev = new Date(withDates[i - 1].date_taken!).getTime();
        const curr = new Date(withDates[i].date_taken!).getTime();
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diffDays <= 3) {
          currentTrip.push(withDates[i]);
        } else {
          if (currentTrip.length >= 5) {
            trips.push([...currentTrip]);
          }
          currentTrip = [withDates[i]];
        }
      }
      if (currentTrip.length >= 5) {
        trips.push(currentTrip);
      }

      for (const trip of trips) {
        const start = trip[0].date_taken!;
        const end = trip[trip.length - 1].date_taken!;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let title: string;
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
          title = `${monthNames[startDate.getMonth()]} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
        } else {
          title = `${monthNames[startDate.getMonth()]} ${startDate.getDate()} – ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
        }

        // Pick the best cover photo (highest aesthetic score or most faces)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cover = trip.reduce((best: any, p: any) => (p.face_count > best.face_count ? p : best), trip[0]);

        collections.push({
          id: `trip-${start}`,
          type: 'trip',
          title,
          subtitle: `${trip.length} photos`,
          coverPhotoId: cover.id,
          coverThumbnailUrl: cover.thumbnail_url,
          photoCount: trip.length,
          dateRange: { start, end },
        });
      }
    }

    // ── Season collections ────────────────────────────────────────────
    const seasonMap: Record<string, typeof photos> = {};
    for (const p of withDates) {
      const d = new Date(p.date_taken!);
      const month = d.getMonth();
      const year = d.getFullYear();
      let season: string;
      if (month >= 2 && month <= 4) season = `Spring ${year}`;
      else if (month >= 5 && month <= 7) season = `Summer ${year}`;
      else if (month >= 8 && month <= 10) season = `Fall ${year}`;
      else season = `Winter ${month === 11 ? year : year - 1}–${month === 11 ? year + 1 : year}`;

      if (!seasonMap[season]) seasonMap[season] = [];
      seasonMap[season].push(p);
    }

    for (const [season, seasonPhotos] of Object.entries(seasonMap)) {
      if (seasonPhotos.length < 3) continue;
      const cover = seasonPhotos[Math.floor(seasonPhotos.length / 2)];
      collections.push({
        id: `season-${season.replace(/\s/g, '-').toLowerCase()}`,
        type: 'season',
        title: season,
        subtitle: `${seasonPhotos.length} photos`,
        coverPhotoId: cover.id,
        coverThumbnailUrl: cover.thumbnail_url,
        photoCount: seasonPhotos.length,
        dateRange: {
          start: seasonPhotos[0].date_taken!,
          end: seasonPhotos[seasonPhotos.length - 1].date_taken!,
        },
      });
    }

    // ── People collection ─────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const peoplePhotos = photos.filter((p: any) => p.face_count > 0);
    if (peoplePhotos.length >= 3) {
      const cover = peoplePhotos[0];
      collections.push({
        id: 'people-all',
        type: 'people',
        title: 'People',
        subtitle: `${peoplePhotos.length} photos with faces`,
        coverPhotoId: cover.id,
        coverThumbnailUrl: cover.thumbnail_url,
        photoCount: peoplePhotos.length,
        dateRange: null,
      });
    }

    // ── Camera collections ────────────────────────────────────────────
    const cameraMap: Record<string, typeof photos> = {};
    for (const p of photos) {
      if (p.camera_make || p.camera_model) {
        const key = [p.camera_make, p.camera_model].filter(Boolean).join(' ');
        if (!cameraMap[key]) cameraMap[key] = [];
        cameraMap[key].push(p);
      }
    }

    for (const [camera, cameraPhotos] of Object.entries(cameraMap)) {
      if (cameraPhotos.length < 5) continue;
      const cover = cameraPhotos[Math.floor(cameraPhotos.length / 2)];
      collections.push({
        id: `camera-${camera.replace(/\s/g, '-').toLowerCase()}`,
        type: 'camera',
        title: camera,
        subtitle: `${cameraPhotos.length} photos`,
        coverPhotoId: cover.id,
        coverThumbnailUrl: cover.thumbnail_url,
        photoCount: cameraPhotos.length,
        dateRange: null,
      });
    }

    // Sort: trips first (most recent), then seasons, then people, then cameras
    const typeOrder: Record<string, number> = { trip: 0, season: 1, people: 2, camera: 3 };
    collections.sort((a, b) => {
      if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
      if (a.dateRange && b.dateRange) {
        return new Date(b.dateRange.start).getTime() - new Date(a.dateRange.start).getTime();
      }
      return b.photoCount - a.photoCount;
    });

    return NextResponse.json({ data: collections });
  } catch (err) {
    captureError(err, { context: 'collections' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
