import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, updateReelSchema } from '@/lib/validation';
import type { Reel, ReelStatus, ReelClip } from '@/types/reel';

const VALID_STATUS_TRANSITIONS: Record<ReelStatus, ReelStatus[]> = {
  building: ['ready'],
  ready: ['processing', 'building'],
  processing: ['developed', 'error'],
  developed: [],
  error: ['processing'],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (reelError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    const { data: clips, error: clipsError } = await supabase
      .from('reel_clips')
      .select('*, photos(*)')
      .eq('reel_id', id)
      .order('position', { ascending: true });

    if (clipsError) {
      return NextResponse.json({ error: clipsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        reel: reel as Reel,
        clips: (clips ?? []) as ReelClip[],
      },
    });
  } catch (err) {
    captureError(err, { context: 'reel-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingReel, error: fetchError } = await supabase
      .from('reels')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    const parsed = await parseBody(request, updateReelSchema);
    if (parsed.error) return parsed.error;
    const { name, status, film_profile, audio_mood } = parsed.data;

    if (status) {
      const currentStatus = existingReel.status as ReelStatus;
      const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status transition from '${currentStatus}' to '${status}'` },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (film_profile !== undefined) updateData.film_profile = film_profile;
    if (audio_mood !== undefined) updateData.audio_mood = audio_mood;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reels')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Reel });
  } catch (err) {
    captureError(err, { context: 'reel-update' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reel, error: fetchError } = await supabase
      .from('reels')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot delete a reel that is currently processing' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('reels')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'reel-delete' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
