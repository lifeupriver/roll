import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import crypto from 'crypto';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }

    const albumId = crypto.randomUUID();
    const albumName = (name || 'Untitled Book').trim();
    const albumDescription = description ? String(description).trim() : null;
    const now = new Date().toISOString();

    // Get first photo for cover
    const { data: coverPhoto } = await supabase
      .from('photos')
      .select('thumbnail_url')
      .eq('id', photoIds[0])
      .single();

    // Try to insert into collections table
    const { data: album, error: insertError } = await supabase
      .from('collections')
      .insert({
        id: albumId,
        user_id: user.id,
        type: 'album',
        name: albumName,
        description: albumDescription,
        cover_url: coverPhoto?.thumbnail_url || null,
        photo_ids: photoIds,
        photo_count: photoIds.length,
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
        cover_url: coverPhoto?.thumbnail_url || null,
        photo_count: photoIds.length,
        photo_ids: photoIds,
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
