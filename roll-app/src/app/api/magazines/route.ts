import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { autoDesignMagazine, selectCoverPhoto } from '@/lib/magazine/auto-design';
import { getDefaultDateRange } from '@/lib/magazine/templates';
import { calculateMagazinePrice } from '@/lib/prodigi/magazine';
import { buildAssetUrl } from '@/lib/prodigi';
import type { MagazineTemplate, MagazineFormat } from '@/types/magazine';

// GET /api/magazines — list user's magazines
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: magazines, error } = await supabase
      .from('magazines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: magazines ?? [] });
  } catch (err) {
    captureError(err, { context: 'magazines-list' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/magazines — create magazine + auto-design
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      template = 'monthly' as MagazineTemplate,
      format = '6x9' as MagazineFormat,
      dateRangeStart,
      dateRangeEnd,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Calculate date range
    const defaultRange = getDefaultDateRange(template);
    const start = dateRangeStart ? new Date(dateRangeStart) : defaultRange.start;
    const end = dateRangeEnd ? new Date(dateRangeEnd) : defaultRange.end;

    // Fetch user's favorites within date range
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select(
        'id, photo_id, photos(id, thumbnail_url, storage_key, width, height, date_taken, aesthetic_score, face_count)'
      )
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (favError) {
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    // Also fetch captions from roll_photos for these photos
    const photoIds = (favorites ?? []).map((f: Record<string, unknown>) => f.photo_id);
    const { data: rollPhotos } = await supabase
      .from('roll_photos')
      .select('photo_id, caption')
      .in('photo_id', photoIds.length > 0 ? photoIds : ['__none__']);

    const captionMap = new Map<string, string>();
    (rollPhotos ?? []).forEach((rp: { photo_id: string; caption?: string }) => {
      if (rp.caption) captionMap.set(rp.photo_id, rp.caption);
    });

    // Prepare photos for auto-design
    const designPhotos = (favorites ?? []).map((f: Record<string, unknown>) => {
      const photo = f.photos as Record<string, unknown> | null;
      return {
        id: f.id as string,
        photo_id: f.photo_id as string,
        thumbnail_url: (photo?.thumbnail_url as string) || '',
        developed_url: photo?.storage_key ? buildAssetUrl(photo.storage_key as string) : '',
        width: (photo?.width as number) || 0,
        height: (photo?.height as number) || 0,
        taken_at: (photo?.date_taken as string) || undefined,
        aesthetic_score: (photo?.aesthetic_score as number) || undefined,
        face_count: (photo?.face_count as number) || undefined,
        caption: captionMap.get(f.photo_id as string) || undefined,
      };
    });

    // Auto-design the magazine
    const pages = autoDesignMagazine(designPhotos, template, { start, end });
    const coverId = selectCoverPhoto(designPhotos);
    const priceCents = calculateMagazinePrice(format, pages.length);

    // Create magazine record
    const { data: magazine, error: createError } = await supabase
      .from('magazines')
      .insert({
        user_id: user.id,
        title,
        template,
        format,
        date_range_start: start.toISOString().slice(0, 10),
        date_range_end: end.toISOString().slice(0, 10),
        cover_photo_id: coverId,
        pages: JSON.stringify(pages),
        page_count: pages.length,
        price_cents: priceCents,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ data: magazine }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'magazines-create' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
