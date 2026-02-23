import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, reorderRollSchema } from '@/lib/validation';

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

    const parsed = await parseBody(request, reorderRollSchema);
    if (parsed.error) return parsed.error;
    const { photoIds } = parsed.data;

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
    captureError(err, { context: 'roll-reorder' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
