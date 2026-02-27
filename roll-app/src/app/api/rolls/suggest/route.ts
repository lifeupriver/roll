import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/rolls/suggest?limit=36
 *
 * Returns a ranked list of photo IDs suggested for the next roll.
 * Uses a scoring algorithm based on:
 * - Aesthetic score (primary signal)
 * - Face count (people photos get a boost)
 * - Scene diversity (prefer variety)
 * - Recency (slight bias toward recent photos)
 * - Not already in a developed roll
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '36', 10), 36);

    // Get photo IDs already in a developed/processing roll
    const { data: usedPhotos } = await supabase
      .from('roll_photos')
      .select('photo_id, rolls!inner(status)')
      .in('rolls.status', ['developed', 'processing']);

    const usedIds = new Set((usedPhotos ?? []).map((rp: { photo_id: string }) => rp.photo_id));

    // Fetch all visible photos with metadata
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, aesthetic_score, face_count, scene_classification, date_taken, created_at')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .order('created_at', { ascending: false })
      .limit(500);

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ data: { photoIds: [], scores: {} } });
    }

    // Filter out already-used photos
    const candidates = photos.filter((p) => !usedIds.has(p.id));

    // Score each photo
    const now = Date.now();
    const scored = candidates.map((photo) => {
      let score = 0;

      // Aesthetic score (0-1) — strongest signal (weight: 40%)
      score += (photo.aesthetic_score ?? 0.5) * 0.4;

      // Face bonus — people photos are more interesting (weight: 15%)
      if (photo.face_count > 0) {
        score += Math.min(photo.face_count / 3, 1) * 0.15;
      }

      // Recency bonus — slight preference for recent photos (weight: 10%)
      const photoDate = new Date(photo.date_taken || photo.created_at).getTime();
      const ageMs = now - photoDate;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - ageDays / 365); // Decay over 1 year
      score += recencyFactor * 0.1;

      // Base variety score (weight: 5%) — will be adjusted below
      score += 0.05;

      return { id: photo.id, score, scene: photo.scene_classification ?? [] };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply diversity: penalize consecutive similar scenes
    const selected: typeof scored = [];
    const sceneUsage: Record<string, number> = {};

    for (const candidate of scored) {
      if (selected.length >= limit) break;

      // Diversity penalty
      let diversityPenalty = 0;
      for (const scene of candidate.scene) {
        if (sceneUsage[scene]) {
          diversityPenalty += sceneUsage[scene] * 0.02;
        }
      }

      const adjustedScore = candidate.score - diversityPenalty;
      selected.push({ ...candidate, score: adjustedScore });

      for (const scene of candidate.scene) {
        sceneUsage[scene] = (sceneUsage[scene] || 0) + 1;
      }
    }

    // Re-sort selected by adjusted score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected.sort((a: any, b: any) => b.score - a.score);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photoIds = selected.map((s: any) => s.id);
    const scores: Record<string, number> = {};
    for (const s of selected) {
      scores[s.id] = Math.round(s.score * 100) / 100;
    }

    return NextResponse.json({ data: { photoIds, scores } });
  } catch (err) {
    captureError(err, { context: 'rolls-suggest' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
