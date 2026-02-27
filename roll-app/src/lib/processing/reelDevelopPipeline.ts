import { FILM_PROFILE_CONFIGS, type FilmProfileConfig } from './filmProfiles';
import {
  getReelClipKey,
  getAssembledReelKey,
  getReelPosterKey,
  getObject,
  uploadObject,
} from '@/lib/storage/r2';
import { correctVideo } from '@/lib/correction';
import { captureError } from '@/lib/sentry';
import type { AudioMood, ReelClip, ReelOrientation } from '@/types/reel';
import type { FilmProfileId } from '@/types/roll';

// ─── Orientation Constants ───────────────────────────────────────────────────

const ORIENTATION_SPECS: Record<ReelOrientation, { width: number; height: number; scale: string }> = {
  horizontal: { width: 1920, height: 1080, scale: '1920:1080' },
  vertical: { width: 1080, height: 1920, scale: '1080:1920' },
};

/**
 * Build FFmpeg filter string for per-clip processing.
 * In production, FFmpeg would run as a subprocess.
 * For the prototype, we simulate the pipeline and generate the expected output keys.
 */
export function buildClipFilterChain(profile: FilmProfileConfig): string {
  const filters: string[] = [];

  // Stabilization (applied conditionally based on stabilization_score)
  filters.push('vidstabtransform=smoothing=10:crop=black:zoom=1');

  // Exposure bias (brightness/saturation adjustment)
  if (profile.exposureBias.brightness !== 1.0 || profile.exposureBias.saturation !== 1.0) {
    filters.push(
      `eq=brightness=${(profile.exposureBias.brightness - 1).toFixed(2)}:saturation=${profile.exposureBias.saturation.toFixed(2)}`
    );
  }

  // LUT application
  filters.push(`lut3d='luts/${profile.id}.cube'`);

  // Vignette
  if (profile.vignetteIntensity > 0) {
    const angle = Math.PI / (4 * (1 + profile.vignetteIntensity));
    filters.push(`vignette=PI/${(Math.PI / angle).toFixed(1)}`);
  }

  return filters.join(',');
}

/**
 * Build FFmpeg command for assembling multiple clips into a single reel.
 * Returns the command as a string array (for exec).
 */
export function buildAssemblyCommand(
  clipPaths: string[],
  outputPath: string,
  _audioMood: AudioMood,
  orientation: ReelOrientation = 'horizontal',
  clipAudioEnabled?: boolean[],
  clipDurations?: number[]
): string[] {
  const inputs: string[] = [];
  const filterParts: string[] = [];
  const spec = ORIENTATION_SPECS[orientation];

  for (let i = 0; i < clipPaths.length; i++) {
    inputs.push('-i', clipPaths[i]);
  }

  // Per-clip audio: mute clips where audio_enabled is false
  for (let i = 0; i < clipPaths.length; i++) {
    const audioEnabled = clipAudioEnabled?.[i] !== false;
    // Scale + pad each clip to target orientation
    filterParts.push(
      `[${i}:v]scale=${spec.scale}:force_original_aspect_ratio=decrease,pad=${spec.width}:${spec.height}:(ow-iw)/2:(oh-ih)/2[sv${i}]`
    );
    if (audioEnabled) {
      filterParts.push(`[${i}:a]anull[sa${i}]`);
    } else {
      // Generate bounded silent audio for muted clips
      const duration = clipDurations?.[i] ?? 5;
      filterParts.push(`anullsrc=r=48000:cl=stereo:d=${duration}[sa${i}]`);
    }
  }

  if (clipPaths.length === 1) {
    filterParts.push('[sv0]null[vout]');
    filterParts.push('[sa0]anull[aout]');
  } else {
    // Build xfade chain for video
    let prevLabel = 'sv0';
    for (let i = 1; i < clipPaths.length; i++) {
      const outLabel = i === clipPaths.length - 1 ? 'vout' : `v${i}`;
      filterParts.push(
        `[${prevLabel}][sv${i}]xfade=transition=fade:duration=0.5:offset=OFFSET_${i}[${outLabel}]`
      );
      prevLabel = outLabel;
    }

    // Build acrossfade chain for audio
    let prevAudioLabel = 'sa0';
    for (let i = 1; i < clipPaths.length; i++) {
      const outLabel = i === clipPaths.length - 1 ? 'aout' : `a${i}`;
      filterParts.push(`[${prevAudioLabel}][sa${i}]acrossfade=d=0.5[${outLabel}]`);
      prevAudioLabel = outLabel;
    }
  }

  return [
    'ffmpeg',
    ...inputs,
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    '-shortest',
    outputPath,
  ];
}

/**
 * Reel development pipeline.
 *
 * For each clip:
 * 1. Fetch the original video from R2
 * 2. Send to EyeQ Perfectly Clear for AI color correction (v2 API supports video)
 * 3. Upload the corrected clip to R2
 * 4. Fall back gracefully if EyeQ is unavailable
 *
 * Assembly (FFmpeg trim + transitions + audio mood) would run as a post-step
 * in production. The pipeline produces per-clip corrected files and the
 * expected assembled reel key.
 */
export interface DevelopReelResult {
  assembledKey: string;
  posterKey: string;
  clipKeys: Array<{ clipId: string; processedKey: string; correctionApplied: boolean }>;
  assembledDurationMs: number;
  correctionSkippedCount: number;
}

export async function developReel(params: {
  userId: string;
  reelId: string;
  clips: ReelClip[];
  filmProfileId: FilmProfileId;
  audioMood: AudioMood;
  /** Optional: map from photo_id → storage_key for fetching clip originals. */
  clipStorageKeys?: Record<string, { storageKey: string; contentType: string }>;
  onClipProcessed?: (clipIndex: number, totalClips: number) => Promise<void>;
}): Promise<DevelopReelResult> {
  const { userId, reelId, clips, filmProfileId, clipStorageKeys, onClipProcessed } = params;

  const profile = FILM_PROFILE_CONFIGS[filmProfileId];
  if (!profile) throw new Error(`Invalid film profile: ${filmProfileId}`);

  const clipKeys: DevelopReelResult['clipKeys'] = [];
  let assembledDurationMs = 0;
  let correctionSkippedCount = 0;

  // Process each clip through EyeQ
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const processedKey = getReelClipKey(userId, reelId, clip.position, filmProfileId);
    let correctionApplied = false;

    try {
      const storageInfo = clipStorageKeys?.[clip.photo_id];

      if (storageInfo) {
        const originalBuffer = await getObject(storageInfo.storageKey);
        const contentType = storageInfo.contentType || 'video/mp4';

        // Send to correction provider for AI video correction
        const correctionResult = await correctVideo(originalBuffer, contentType);

        if (correctionResult) {
          await uploadObject(processedKey, correctionResult.correctedBuffer, 'video/mp4');
          correctionApplied = true;
        } else {
          // No provider configured — use original as processed placeholder
          await uploadObject(processedKey, originalBuffer, contentType);
          correctionSkippedCount++;
        }
      } else {
        // No storage key available — skip correction for this clip
        correctionSkippedCount++;
      }
    } catch (correctionError) {
      // Correction failed for this clip — continue without correction
      captureError(correctionError, { context: 'video-correction', clipId: clip.id });
      correctionSkippedCount++;
    }

    clipKeys.push({
      clipId: clip.id,
      processedKey,
      correctionApplied,
    });

    assembledDurationMs += clip.trimmed_duration_ms;

    // Notify progress
    if (onClipProcessed) {
      await onClipProcessed(i + 1, clips.length);
    }
  }

  // Account for crossfade overlap (0.5s per transition)
  const transitionCount = Math.max(0, clips.length - 1);
  assembledDurationMs -= transitionCount * 500;
  assembledDurationMs = Math.max(assembledDurationMs, 0);

  // Generate assembled reel key
  const assembledKey = getAssembledReelKey(userId, reelId, filmProfileId);
  const posterKey = getReelPosterKey(userId, reelId);

  return {
    assembledKey,
    posterKey,
    clipKeys,
    assembledDurationMs,
    correctionSkippedCount,
  };
}
