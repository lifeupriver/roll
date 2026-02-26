import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export interface Memory {
  id: string;
  photoId: string;
  thumbnailUrl: string;
  dateTaken: string;
  yearsAgo: number;
  label: string;
}

/**
 * GET /api/memories
 *
 * Returns photos taken on this day in previous years ("On This Day" feature).
 * Looks for photos taken within ±1 day of the current month/day in any prior year.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const day = now.getDate();

    // Fetch all photos with dates to check for "on this day" matches
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, thumbnail_url, date_taken')
      .eq('user_id', user.id)
      .eq('filter_status', 'visible')
      .not('date_taken', 'is', null)
      .order('date_taken', { ascending: false });

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const memories: Memory[] = [];

    for (const photo of photos) {
      if (!photo.date_taken) continue;
      const photoDate = new Date(photo.date_taken);
      const photoYear = photoDate.getFullYear();

      // Skip photos from the current year
      if (photoYear >= currentYear) continue;

      // Check if the month/day matches (±1 day tolerance)
      const photoMonth = photoDate.getMonth();
      const photoDay = photoDate.getDate();

      const dayDiff = Math.abs(
        (month * 31 + day) - (photoMonth * 31 + photoDay)
      );

      if (dayDiff <= 1 || dayDiff >= 364) {
        const yearsAgo = currentYear - photoYear;
        memories.push({
          id: `memory-${photo.id}`,
          photoId: photo.id,
          thumbnailUrl: photo.thumbnail_url,
          dateTaken: photo.date_taken,
          yearsAgo,
          label: yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`,
        });
      }
    }

    // Sort by years ago (most recent first), then by date
    memories.sort((a, b) => a.yearsAgo - b.yearsAgo);

    return NextResponse.json({ data: memories });
  } catch (err) {
    captureError(err, { context: 'memories' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
