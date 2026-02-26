import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { autoDesignMagazine, autoDesignFromRolls, selectCoverPhoto } from '@/lib/magazine/auto-design';
import { getDefaultDateRange } from '@/lib/magazine/templates';
import { calculateMagazinePrice } from '@/lib/prodigi/magazine';
import { buildAssetUrl } from '@/lib/prodigi';
import type { MagazineTemplate, MagazineFormat, MagazineFont } from '@/types/magazine';

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
      font = 'default' as MagazineFont,
      rollIds,
      dateRangeStart,
      dateRangeEnd,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // ── Roll-based flow (new) ──
    if (rollIds && Array.isArray(rollIds) && rollIds.length > 0) {
      if (rollIds.length > 4) {
        return NextResponse.json({ error: 'Maximum 4 rolls per magazine' }, { status: 400 });
      }

      // Fetch rolls with photos
      const sections = [];
      for (const rollId of rollIds) {
        const { data: roll } = await supabase
          .from('rolls')
          .select('id, title, theme_name, story')
          .eq('id', rollId)
          .eq('user_id', user.id)
          .single();

        if (!roll) continue;

        const { data: photos } = await supabase
          .from('roll_photos')
          .select(`
            photo_id, position, caption,
            photos(id, thumbnail_url, storage_key, width, height, date_taken, aesthetic_score, face_count)
          `)
          .eq('roll_id', rollId)
          .order('position', { ascending: true });

        const designPhotos = (photos || []).map((rp: Record<string, unknown>) => {
          const photo = rp.photos as Record<string, unknown> | null;
          return {
            id: rp.photo_id as string,
            photo_id: rp.photo_id as string,
            thumbnail_url: (photo?.thumbnail_url as string) || '',
            developed_url: photo?.storage_key ? buildAssetUrl(photo.storage_key as string) : '',
            width: (photo?.width as number) || 0,
            height: (photo?.height as number) || 0,
            taken_at: (photo?.date_taken as string) || undefined,
            aesthetic_score: (photo?.aesthetic_score as number) || undefined,
            face_count: (photo?.face_count as number) || undefined,
            caption: (rp.caption as string) || undefined,
          };
        });

        sections.push({
          rollId: roll.id as string,
          title: (roll.theme_name as string) || (roll.title as string) || 'Untitled',
          story: roll.story as string | null,
          photos: designPhotos,
        });
      }

      if (sections.length === 0) {
        return NextResponse.json({ error: 'No valid rolls found' }, { status: 400 });
      }

      const allPhotos = sections.flatMap((s) => s.photos);
      const pages = autoDesignFromRolls(sections, template, { font });
      const coverId = selectCoverPhoto(allPhotos);
      const priceCents = calculateMagazinePrice(format, pages.length);

      const { data: magazine, error: createError } = await supabase
        .from('magazines')
        .insert({
          user_id: user.id,
          title,
          template,
          format,
          font,
          roll_ids: rollIds,
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
    }

    // ── Favorites-based flow (legacy) ──
    const defaultRange = getDefaultDateRange(template);
    const start = dateRangeStart ? new Date(dateRangeStart) : defaultRange.start;
    const end = dateRangeEnd ? new Date(dateRangeEnd) : defaultRange.end;

    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select(
        'id, photo_id, photos!inner(id, thumbnail_url, storage_key, width, height, date_taken, aesthetic_score, face_count)'
      )
      .eq('user_id', user.id)
      .gte('photos.date_taken', start.toISOString())
      .lte('photos.date_taken', end.toISOString())
      .order('created_at', { ascending: true });

    if (favError) {
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    const photoIds = (favorites ?? []).map((f: Record<string, unknown>) => f.photo_id);
    const { data: rollPhotos } = await supabase
      .from('roll_photos')
      .select('photo_id, caption')
      .in('photo_id', photoIds.length > 0 ? photoIds : ['__none__']);

    const captionMap = new Map<string, string>();
    (rollPhotos ?? []).forEach((rp: { photo_id: string; caption?: string }) => {
      if (rp.caption) captionMap.set(rp.photo_id, rp.caption);
    });

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

    const pages = autoDesignMagazine(designPhotos, template, { start, end });
    const coverId = selectCoverPhoto(designPhotos);
    const priceCents = calculateMagazinePrice(format, pages.length);

    const { data: magazine, error: createError } = await supabase
      .from('magazines')
      .insert({
        user_id: user.id,
        title,
        template,
        format,
        font,
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
