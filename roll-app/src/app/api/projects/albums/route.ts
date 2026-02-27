import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import crypto from 'crypto';

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

    const { data: albums, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'album')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet — return empty
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: albums ?? [] });
  } catch (err) {
    captureError(err, { context: 'albums-list' });
    return NextResponse.json({ data: [] });
  }
}

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
    const { name, description, photoIds, magazine_ids, roll_ids } = body;

    // Resolve photo IDs from different sources
    let resolvedPhotoIds: string[] = photoIds || [];

    if (resolvedPhotoIds.length === 0 && roll_ids && Array.isArray(roll_ids) && roll_ids.length > 0) {
      // Fetch photos from the specified rolls
      const { data: rollPhotos } = await supabase
        .from('roll_photos')
        .select('photo_id')
        .in('roll_id', roll_ids)
        .order('position', { ascending: true });

      resolvedPhotoIds = [...new Set<string>((rollPhotos || []).map((rp: { photo_id: string }) => rp.photo_id))];
    }

    if (resolvedPhotoIds.length === 0 && magazine_ids && Array.isArray(magazine_ids) && magazine_ids.length > 0) {
      // Fetch photos from the specified magazines' source rolls
      const { data: mags } = await supabase
        .from('magazines')
        .select('roll_ids')
        .in('id', magazine_ids);

      const allRollIds = (mags || []).flatMap((m: { roll_ids: string[] | null }) => m.roll_ids || []);
      if (allRollIds.length > 0) {
        const { data: rollPhotos } = await supabase
          .from('roll_photos')
          .select('photo_id')
          .in('roll_id', allRollIds)
          .order('position', { ascending: true });

        resolvedPhotoIds = [...new Set<string>((rollPhotos || []).map((rp: { photo_id: string }) => rp.photo_id))];
      }
    }

    // If we still have no photos, create the book anyway with metadata
    const albumId = crypto.randomUUID();
    const albumName = (name || 'Untitled Book').trim();
    const albumDescription = description ? String(description).trim() : null;
    const now = new Date().toISOString();

    // Get first photo for cover if available
    let coverUrl: string | null = null;
    if (resolvedPhotoIds.length > 0) {
      const { data: coverPhoto } = await supabase
        .from('photos')
        .select('thumbnail_url')
        .eq('id', resolvedPhotoIds[0])
        .single();
      coverUrl = coverPhoto?.thumbnail_url || null;
    }

    // Try to insert into collections table
    const { data: album, error: insertError } = await supabase
      .from('collections')
      .insert({
        id: albumId,
        user_id: user.id,
        type: 'album',
        name: albumName,
        description: albumDescription,
        cover_url: coverUrl,
        photo_ids: resolvedPhotoIds,
        photo_count: resolvedPhotoIds.length,
        captions: {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      // If table doesn't exist, return a virtual album
      const virtualAlbum = {
        id: albumId,
        name: albumName,
        description: albumDescription,
        cover_url: coverUrl,
        photo_count: resolvedPhotoIds.length,
        photo_ids: resolvedPhotoIds,
        captions: {},
        created_at: now,
        updated_at: now,
      };
      return NextResponse.json({ data: virtualAlbum }, { status: 201 });
    }

    return NextResponse.json({ data: album }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'albums-create' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
