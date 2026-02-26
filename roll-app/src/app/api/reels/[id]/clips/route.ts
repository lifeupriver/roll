import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, addReelClipSchema } from '@/lib/validation';
import type { ReelClip } from '@/types/reel';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reelId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify reel ownership and status
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('*')
      .eq('id', reelId)
      .eq('user_id', user.id)
      .single();

    if (reelError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.status !== 'building') {
      return NextResponse.json(
        { error: 'Clips can only be added to reels in building status' },
        { status: 400 }
      );
    }

    const parsed = await parseBody(request, addReelClipSchema);
    if (parsed.error) return parsed.error;
    const { photoId, trimStartMs, trimEndMs } = parsed.data;

    // Verify the photo exists, belongs to user, and is a video
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, media_type, duration_ms, filter_status')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (photo.media_type !== 'video') {
      return NextResponse.json(
        { error: 'Only video clips can be added to reels' },
        { status: 400 }
      );
    }

    if (photo.filter_status !== 'visible') {
      return NextResponse.json({ error: 'Video must be visible (not filtered)' }, { status: 400 });
    }

    // Check for duplicate clip in reel
    const { data: existingClip } = await supabase
      .from('reel_clips')
      .select('id')
      .eq('reel_id', reelId)
      .eq('photo_id', photoId)
      .limit(1);

    if (existingClip && existingClip.length > 0) {
      return NextResponse.json({ error: 'Clip already in reel' }, { status: 409 });
    }

    // Determine position (next available)
    const { count } = await supabase
      .from('reel_clips')
      .select('*', { count: 'exact', head: true })
      .eq('reel_id', reelId);

    const position = (count ?? 0) + 1;
    const effectiveEnd = trimEndMs ?? photo.duration_ms;
    const trimmedDuration = effectiveEnd - trimStartMs;

    // Check if adding this clip would exceed target duration
    const newDuration = reel.current_duration_ms + trimmedDuration;

    const { data: clipData, error: insertError } = await supabase
      .from('reel_clips')
      .insert({
        reel_id: reelId,
        photo_id: photoId,
        position,
        trim_start_ms: trimStartMs,
        trim_end_ms: trimEndMs || null,
        trimmed_duration_ms: trimmedDuration,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update reel counters
    const newClipCount = position;
    let newStatus = reel.status;

    // Auto-close reel when target duration is reached or exceeded
    if (newDuration >= reel.target_duration_ms) {
      newStatus = 'ready';
    }

    const { error: updateError } = await supabase
      .from('reels')
      .update({
        clip_count: newClipCount,
        current_duration_ms: newDuration,
        status: newStatus,
      })
      .eq('id', reelId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: clipData as ReelClip,
        reelStatus: newStatus,
        currentDurationMs: newDuration,
      },
      { status: 201 }
    );
  } catch (err) {
    captureError(err, { context: 'reel-add-clip' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reelId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const photoId = body.photoId;
    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 });
    }

    // Verify reel ownership
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('*')
      .eq('id', reelId)
      .eq('user_id', user.id)
      .single();

    if (reelError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    // Get the clip to remove (to know its duration)
    const { data: clip } = await supabase
      .from('reel_clips')
      .select('trimmed_duration_ms')
      .eq('reel_id', reelId)
      .eq('photo_id', photoId)
      .single();

    if (!clip) {
      return NextResponse.json({ error: 'Clip not in reel' }, { status: 404 });
    }

    // Delete the clip
    const { error: deleteError } = await supabase
      .from('reel_clips')
      .delete()
      .eq('reel_id', reelId)
      .eq('photo_id', photoId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Resequence remaining clips
    const { data: remainingClips } = await supabase
      .from('reel_clips')
      .select('id')
      .eq('reel_id', reelId)
      .order('position', { ascending: true });

    if (remainingClips) {
      for (let i = 0; i < remainingClips.length; i++) {
        await supabase
          .from('reel_clips')
          .update({ position: i + 1 })
          .eq('id', remainingClips[i].id);
      }
    }

    // Update reel counters
    const newClipCount = remainingClips?.length ?? 0;
    const newDuration = Math.max(0, reel.current_duration_ms - clip.trimmed_duration_ms);
    let newStatus = reel.status;
    if (reel.status === 'ready' && newDuration < reel.target_duration_ms) {
      newStatus = 'building';
    }

    await supabase
      .from('reels')
      .update({
        clip_count: newClipCount,
        current_duration_ms: newDuration,
        status: newStatus,
      })
      .eq('id', reelId);

    return NextResponse.json({
      success: true,
      reelStatus: newStatus,
      currentDurationMs: newDuration,
    });
  } catch (err) {
    captureError(err, { context: 'reel-remove-clip' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
