import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { RollPhoto } from '@/types/roll';

export async function POST(
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

    // Verify roll ownership and status
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    if (roll.status !== 'building') {
      return NextResponse.json(
        { error: 'Photos can only be added to rolls with "building" status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { photoId } = body as { photoId: string };

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    }

    // Count current photos in the roll
    const { count, error: countError } = await supabase
      .from('roll_photos')
      .select('*', { count: 'exact', head: true })
      .eq('roll_id', rollId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const currentCount = count ?? 0;

    if (currentCount >= 36) {
      return NextResponse.json(
        { error: 'Roll has reached the maximum of 36 photos' },
        { status: 400 }
      );
    }

    // Calculate next position
    const nextPosition = currentCount + 1;

    // Insert the roll photo
    const { data: rollPhoto, error: insertError } = await supabase
      .from('roll_photos')
      .insert({
        roll_id: rollId,
        photo_id: photoId,
        position: nextPosition,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // If count reaches 36, update roll status to 'ready'
    const newCount = currentCount + 1;
    let rollStatus = roll.status as string;

    if (newCount >= 36) {
      const { error: updateError } = await supabase
        .from('rolls')
        .update({ status: 'ready' })
        .eq('id', rollId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      rollStatus = 'ready';
    }

    return NextResponse.json(
      { data: rollPhoto as RollPhoto, rollStatus },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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
    const { photoId } = body as { photoId: string };

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    }

    // Get the photo being removed to know its position
    const { data: removedPhoto, error: findError } = await supabase
      .from('roll_photos')
      .select('*')
      .eq('roll_id', rollId)
      .eq('photo_id', photoId)
      .single();

    if (findError || !removedPhoto) {
      return NextResponse.json({ error: 'Photo not found in roll' }, { status: 404 });
    }

    // Delete the roll photo
    const { error: deleteError } = await supabase
      .from('roll_photos')
      .delete()
      .eq('roll_id', rollId)
      .eq('photo_id', photoId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Reorder remaining positions: decrement positions for photos after the removed one
    const { data: remainingPhotos, error: fetchError } = await supabase
      .from('roll_photos')
      .select('id, position')
      .eq('roll_id', rollId)
      .gt('position', removedPhoto.position)
      .order('position', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (remainingPhotos && remainingPhotos.length > 0) {
      for (const photo of remainingPhotos) {
        await supabase
          .from('roll_photos')
          .update({ position: photo.position - 1 })
          .eq('id', photo.id);
      }
    }

    // If roll was 'ready' and now has < 36 photos, set back to 'building'
    if (roll.status === 'ready') {
      const { count } = await supabase
        .from('roll_photos')
        .select('*', { count: 'exact', head: true })
        .eq('roll_id', rollId);

      if ((count ?? 0) < 36) {
        await supabase
          .from('rolls')
          .update({ status: 'building' })
          .eq('id', rollId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
