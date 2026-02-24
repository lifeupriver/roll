import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FILM_PROFILE_CONFIGS } from '@/lib/processing/filmProfiles';
import { developReel } from '@/lib/processing/reelDevelopPipeline';
import { isCorrectionEnabled, activeCorrectionProvider } from '@/lib/correction';
import { MIN_REEL_CLIPS } from '@/lib/utils/constants';
import { captureError } from '@/lib/sentry';
import { processLimiter } from '@/lib/rate-limit';
import { parseBody, developReelSchema } from '@/lib/validation';
import type { ReelClip, AudioMood } from '@/types/reel';
import type { FilmProfileId } from '@/types/roll';

export async function POST(request: NextRequest) {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
  let reelId: string | null = null;

  try {
    supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = processLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const parsed = await parseBody(request, developReelSchema);
    if (parsed.error) return parsed.error;

    const { filmProfileId, audioMood } = parsed.data;
    reelId = parsed.data.reelId;

    // Validate film profile
    if (!FILM_PROFILE_CONFIGS[filmProfileId]) {
      return NextResponse.json(
        { error: `Invalid film profile: ${filmProfileId}` },
        { status: 400 }
      );
    }

    // Check user tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.tier === 'free' && filmProfileId !== 'warmth') {
      return NextResponse.json(
        { error: 'Free users can only use the Warmth film profile' },
        { status: 403 }
      );
    }

    if (profile.tier === 'free' && audioMood !== 'original') {
      return NextResponse.json({ error: 'Audio moods require Roll+' }, { status: 403 });
    }

    // Fetch reel
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('*')
      .eq('id', reelId)
      .eq('user_id', user.id)
      .single();

    if (reelError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.status !== 'ready') {
      return NextResponse.json(
        { error: `Reel must be in 'ready' status to develop. Current: '${reel.status}'` },
        { status: 400 }
      );
    }

    if (reel.clip_count < MIN_REEL_CLIPS) {
      return NextResponse.json(
        { error: `Reel must have at least ${MIN_REEL_CLIPS} clips` },
        { status: 400 }
      );
    }

    // Set reel to processing
    const { error: updateError } = await supabase
      .from('reels')
      .update({
        status: 'processing',
        film_profile: filmProfileId,
        audio_mood: audioMood,
        processing_started_at: new Date().toISOString(),
        processing_error: null,
        clips_processed: 0,
      })
      .eq('id', reelId);

    if (updateError) throw new Error(`Failed to update reel status: ${updateError.message}`);

    // Fetch reel clips
    const { data: reelClips, error: clipsError } = await supabase
      .from('reel_clips')
      .select('*')
      .eq('reel_id', reelId)
      .order('position', { ascending: true });

    if (clipsError) throw new Error(`Failed to fetch reel clips: ${clipsError.message}`);
    if (!reelClips || reelClips.length === 0) throw new Error('No clips found in reel');

    // Fetch storage keys for each clip's source video
    const photoIds = reelClips.map((c: { photo_id: string }) => c.photo_id);
    const { data: videoRecords } = await supabase
      .from('photos')
      .select('id, storage_key, content_type')
      .in('id', photoIds);

    const clipStorageKeys: Record<string, { storageKey: string; contentType: string }> = {};
    if (videoRecords) {
      for (const rec of videoRecords) {
        clipStorageKeys[rec.id] = {
          storageKey: rec.storage_key,
          contentType: rec.content_type || 'video/mp4',
        };
      }
    }

    // Run the development pipeline with EyeQ integration
    const result = await developReel({
      userId: user.id,
      reelId,
      clips: reelClips as ReelClip[],
      filmProfileId: filmProfileId as FilmProfileId,
      audioMood: audioMood as AudioMood,
      clipStorageKeys,
      onClipProcessed: async (clipIndex) => {
        await supabase!.from('reels').update({ clips_processed: clipIndex }).eq('id', reelId);
      },
    });

    // Update each clip with processed storage key
    for (const clipKey of result.clipKeys) {
      await supabase
        .from('reel_clips')
        .update({
          processed_storage_key: clipKey.processedKey,
          correction_applied: clipKey.correctionApplied,
        })
        .eq('id', clipKey.clipId);
    }

    // Mark reel as developed
    const { error: completeError } = await supabase
      .from('reels')
      .update({
        status: 'developed',
        processing_completed_at: new Date().toISOString(),
        assembled_storage_key: result.assembledKey,
        poster_storage_key: result.posterKey,
        assembled_duration_ms: result.assembledDurationMs,
        correction_skipped_count: result.correctionSkippedCount,
      })
      .eq('id', reelId);

    if (completeError) throw new Error(`Failed to complete reel: ${completeError.message}`);

    return NextResponse.json({
      data: {
        reelId,
        status: 'developed',
        assembledDurationMs: result.assembledDurationMs,
        correctionProvider: activeCorrectionProvider(),
        correctionEnabled: isCorrectionEnabled(),
        correctionSkippedCount: result.correctionSkippedCount,
      },
    });
  } catch (err) {
    captureError(err, { context: 'process-develop-reel', reelId });
    const message = err instanceof Error ? err.message : 'Internal server error';

    if (supabase && reelId) {
      await supabase
        .from('reels')
        .update({ status: 'error', processing_error: message })
        .eq('id', reelId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
