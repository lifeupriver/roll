import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PhotoTag } from '@/types/people';

// GET — list tags for a photo
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify photo ownership
    const { data: photo } = await supabase
      .from('photos')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const { data: tags, error } = await supabase
      .from('photo_tags')
      .select('*, person:people(*)')
      .eq('photo_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: (tags ?? []) as PhotoTag[] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — add a tag to a photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify photo ownership
    const { data: photo } = await supabase
      .from('photos')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const body = await request.json();
    const { personId, x, y, width, height } = body as {
      personId: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 });
    }

    // Validate bounding box (0-1 range)
    if ([x, y, width, height].some((v) => typeof v !== 'number' || v < 0 || v > 1)) {
      return NextResponse.json({ error: 'Bounding box values must be between 0 and 1' }, { status: 400 });
    }

    const { data: tag, error: insertError } = await supabase
      .from('photo_tags')
      .insert({
        photo_id: id,
        person_id: personId,
        x,
        y,
        width,
        height,
      })
      .select('*, person:people(*)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment person photo_count
    await supabase.rpc('increment_person_photo_count', { p_person_id: personId });

    return NextResponse.json({ data: tag as PhotoTag }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove a tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tagId } = body as { tagId: string };

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
    }

    // Get the tag to decrement count
    const { data: tag } = await supabase
      .from('photo_tags')
      .select('person_id')
      .eq('id', tagId)
      .eq('photo_id', id)
      .single();

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('photo_tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Decrement person photo_count
    await supabase.rpc('decrement_person_photo_count', { p_person_id: tag.person_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
