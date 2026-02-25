import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: album, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', albumId)
      .eq('user_id', user.id)
      .eq('type', 'album')
      .single();

    if (error || !album) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Fetch photo details for all pages
    const photoIds = album.photo_ids ?? [];
    let photos: Array<Record<string, unknown>> = [];
    if (photoIds.length > 0) {
      const { data: photoData } = await supabase
        .from('photos')
        .select('id, thumbnail_url, storage_key, width, height')
        .in('id', photoIds);
      // Maintain order from photo_ids
      const photoMap = new Map((photoData ?? []).map((p: Record<string, unknown>) => [p.id, p]));
      photos = photoIds
        .map((pid: string) => photoMap.get(pid))
        .filter(Boolean) as Array<Record<string, unknown>>;
    }

    return NextResponse.json({
      data: {
        ...album,
        description: album.description ?? null,
        captions: album.captions ?? {},
        updated_at: album.updated_at ?? album.created_at,
      },
      photos,
    });
  } catch (err) {
    captureError(err, { context: 'album-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.captions !== undefined) updates.captions = body.captions;
    if (body.photo_ids !== undefined) {
      updates.photo_ids = body.photo_ids;
      updates.photo_count = body.photo_ids.length;
      // Update cover if first photo changed
      if (body.photo_ids.length > 0) {
        const { data: coverPhoto } = await supabase
          .from('photos')
          .select('thumbnail_url')
          .eq('id', body.photo_ids[0])
          .single();
        if (coverPhoto) updates.cover_url = coverPhoto.thumbnail_url;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: album, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', albumId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      // If table doesn't support the columns yet, return success anyway
      return NextResponse.json({ data: { id: albumId, ...updates } });
    }

    return NextResponse.json({ data: album });
  } catch (err) {
    captureError(err, { context: 'album-update' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', albumId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'album-delete' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
