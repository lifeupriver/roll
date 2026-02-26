import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, updateReelClipSchema } from '@/lib/validation';
import type { ReelClip } from '@/types/reel';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: reelId, clipId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (reel.status !== 'building' && reel.status !== 'ready') {
      return NextResponse.json(
        { error: 'Clips can only be edited on reels in building or ready status' },
        { status: 400 }
      );
    }

    const parsed = await parseBody(request, updateReelClipSchema);
    if (parsed.error) return parsed.error;
    const { trimStartMs, trimEndMs, position, transitionType } = parsed.data;

    // Get current clip
    const { data: clip, error: clipError } = await supabase
      .from('reel_clips')
      .select('*, photos(duration_ms)')
      .eq('id', clipId)
      .eq('reel_id', reelId)
      .single();

    if (clipError || !clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    let durationDelta = 0;

    if (trimStartMs !== undefined || trimEndMs !== undefined) {
      const newStart = trimStartMs ?? clip.trim_start_ms;
      const newEnd = trimEndMs === null ? null : (trimEndMs ?? clip.trim_end_ms);
      const videoDuration = (clip as Record<string, unknown>).photos
        ? ((clip as Record<string, unknown>).photos as Record<string, number>).duration_ms
        : clip.trimmed_duration_ms + clip.trim_start_ms;
      const effectiveEnd = newEnd ?? videoDuration;
      const newTrimmedDuration = effectiveEnd - newStart;

      durationDelta = newTrimmedDuration - clip.trimmed_duration_ms;
      updateData.trim_start_ms = newStart;
      updateData.trim_end_ms = newEnd;
      updateData.trimmed_duration_ms = newTrimmedDuration;
    }

    if (position !== undefined) updateData.position = position;
    if (transitionType !== undefined) updateData.transition_type = transitionType;

    const { data: updated, error: updateError } = await supabase
      .from('reel_clips')
      .update(updateData)
      .eq('id', clipId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update reel duration if trim changed
    if (durationDelta !== 0) {
      const newDuration = reel.current_duration_ms + durationDelta;
      let newStatus = reel.status;
      if (newDuration >= reel.target_duration_ms && reel.status === 'building') {
        newStatus = 'ready';
      } else if (newDuration < reel.target_duration_ms && reel.status === 'ready') {
        newStatus = 'building';
      }

      await supabase
        .from('reels')
        .update({ current_duration_ms: newDuration, status: newStatus })
        .eq('id', reelId);
    }

    return NextResponse.json({ data: updated as ReelClip });
  } catch (err) {
    captureError(err, { context: 'reel-clip-update' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
