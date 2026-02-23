import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, photoTagCreateSchema, photoTagDeleteSchema } from '@/lib/validation';
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
    captureError(err, { context: 'photo-tags' });
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

    const parsed = await parseBody(request, photoTagCreateSchema);
    if (parsed.error) return parsed.error;
    const { personId, x, y, width, height } = parsed.data;

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
    captureError(err, { context: 'photo-tags' });
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

    const parsed = await parseBody(request, photoTagDeleteSchema);
    if (parsed.error) return parsed.error;
    const { tagId } = parsed.data;

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
    captureError(err, { context: 'photo-tags' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
