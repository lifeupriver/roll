import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify roll ownership
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    // Fetch all photos in this roll with their metadata
    const { data: rollPhotos, error: photosError } = await supabase
      .from('roll_photos')
      .select('photos(date_taken, scene_classification, latitude, longitude)')
      .eq('roll_id', id)
      .order('position', { ascending: true });

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    const photos = (rollPhotos ?? [])
      .map((rp: Record<string, unknown>) => rp.photos as Record<string, unknown> | null)
      .filter((p): p is Record<string, unknown> => Boolean(p));

    // Find the most common scene classification
    const sceneCounts = new Map<string, number>();
    for (const photo of photos) {
      const scenes = photo.scene_classification as string[] | null;
      if (scenes) {
        for (const scene of scenes) {
          sceneCounts.set(scene, (sceneCounts.get(scene) || 0) + 1);
        }
      }
    }

    let dominantScene = '';
    let maxSceneCount = 0;
    for (const [scene, count] of sceneCounts) {
      if (count > maxSceneCount) {
        maxSceneCount = count;
        dominantScene = scene;
      }
    }

    // Extract date range
    const dates = photos
      .map((p: Record<string, unknown> | null) => p?.date_taken as string | null)
      .filter((d): d is string => Boolean(d))
      .map((d: string) => new Date(d))
      .filter((d: Date) => !isNaN(d.getTime()))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    let dateStr = '';
    if (dates.length > 0) {
      const earliest = dates[0];
      const latest = dates[dates.length - 1];

      const sameMonth =
        earliest.getMonth() === latest.getMonth() &&
        earliest.getFullYear() === latest.getFullYear();

      if (sameMonth) {
        dateStr = earliest.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (earliest.getFullYear() === latest.getFullYear()) {
        const startMonth = earliest.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = latest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        dateStr = `${startMonth} – ${endMonth}`;
      } else {
        dateStr = `${earliest.getFullYear()} – ${latest.getFullYear()}`;
      }
    }

    // Build suggestion
    const parts: string[] = [];
    if (dominantScene) {
      parts.push(dominantScene.charAt(0).toUpperCase() + dominantScene.slice(1));
    }
    if (dateStr) {
      parts.push(dateStr);
    }

    const suggestion = parts.join(' · ') || 'My Roll';

    return NextResponse.json({ suggestion });
  } catch (err) {
    captureError(err, { context: 'roll-suggest-name' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
