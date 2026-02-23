import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/search?q=&scene=&camera=&from=&to=&faces=&limit=50
 *
 * Advanced photo search with multiple filter dimensions:
 * - q: text query (matches filename, camera make/model)
 * - scene: scene classification tag
 * - camera: camera make/model substring
 * - from/to: date range (ISO strings)
 * - faces: "yes" | "no" | "group" (>2 faces)
 * - has_location: "true" to filter only geotagged photos
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const scene = url.searchParams.get('scene')?.trim() || '';
    const camera = url.searchParams.get('camera')?.trim() || '';
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const faces = url.searchParams.get('faces') || '';
    const hasLocation = url.searchParams.get('has_location') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

    let query = supabase
      .from('photos')
      .select('id, thumbnail_url, filename, date_taken, latitude, longitude, camera_make, camera_model, face_count, scene_classification, aesthetic_score, created_at')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .order('date_taken', { ascending: false, nullsFirst: false })
      .limit(limit);

    // Text query — search in filename
    if (q) {
      query = query.ilike('filename', `%${q}%`);
    }

    // Scene filter
    if (scene) {
      query = query.contains('scene_classification', [scene]);
    }

    // Camera filter
    if (camera) {
      // Search in both make and model combined via an OR
      query = query.or(`camera_make.ilike.%${camera}%,camera_model.ilike.%${camera}%`);
    }

    // Date range
    if (from) {
      query = query.gte('date_taken', from);
    }
    if (to) {
      query = query.lte('date_taken', to);
    }

    // Face filter
    if (faces === 'yes') {
      query = query.gt('face_count', 0);
    } else if (faces === 'no') {
      query = query.eq('face_count', 0);
    } else if (faces === 'group') {
      query = query.gt('face_count', 2);
    }

    // Location filter
    if (hasLocation) {
      query = query.not('latitude', 'is', null).not('longitude', 'is', null);
    }

    const { data: photos, error: searchError } = await query;

    if (searchError) {
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    // Also get available filter options for the UI
    const { data: allPhotos } = await supabase
      .from('photos')
      .select('scene_classification, camera_make, camera_model')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible');

    const scenes = new Set<string>();
    const cameras = new Set<string>();

    for (const p of allPhotos ?? []) {
      if (p.scene_classification && Array.isArray(p.scene_classification)) {
        for (const s of p.scene_classification) scenes.add(s);
      }
      if (p.camera_make || p.camera_model) {
        cameras.add([p.camera_make, p.camera_model].filter(Boolean).join(' '));
      }
    }

    return NextResponse.json({
      data: {
        photos: photos ?? [],
        filters: {
          scenes: Array.from(scenes).sort(),
          cameras: Array.from(cameras).sort(),
        },
        total: photos?.length ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
