import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: rollId, photoId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the roll belongs to the user
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    const body = await request.json();
    const { caption, source } = body;

    if (typeof caption !== 'string' && caption !== null) {
      return NextResponse.json({ error: 'Caption must be a string or null' }, { status: 400 });
    }

    const validSources = ['manual', 'voice', 'auto_draft', 'auto_accepted'];
    if (source && !validSources.includes(source)) {
      return NextResponse.json({ error: 'Invalid caption source' }, { status: 400 });
    }

    // Update the roll_photo caption
    const { data: updated, error: updateError } = await supabase
      .from('roll_photos')
      .update({
        caption: caption?.trim() || null,
        caption_source: source || 'manual',
        caption_updated_at: new Date().toISOString(),
      })
      .eq('roll_id', rollId)
      .eq('photo_id', photoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    captureError(err, { context: 'roll-photo-caption' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
