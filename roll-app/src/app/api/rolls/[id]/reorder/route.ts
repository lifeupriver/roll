import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rollId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify roll ownership
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    const body = await request.json();
    const { photoIds } = body as { photoIds: string[] };

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'photoIds array is required' },
        { status: 400 }
      );
    }

    // Verify all photo IDs belong to this roll
    const { data: existingPhotos, error: fetchError } = await supabase
      .from('roll_photos')
      .select('photo_id')
      .eq('roll_id', rollId);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingPhotoIds = new Set(
      (existingPhotos ?? []).map((p: { photo_id: string }) => p.photo_id)
    );

    for (const photoId of photoIds) {
      if (!existingPhotoIds.has(photoId)) {
        return NextResponse.json(
          { error: `Photo ${photoId} is not in this roll` },
          { status: 400 }
        );
      }
    }

    // Update positions based on the new order
    for (let i = 0; i < photoIds.length; i++) {
      const { error: updateError } = await supabase
        .from('roll_photos')
        .update({ position: i + 1 })
        .eq('roll_id', rollId)
        .eq('photo_id', photoIds[i]);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
