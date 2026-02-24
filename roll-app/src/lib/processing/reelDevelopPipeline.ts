import { FILM_PROFILE_CONFIGS, type FilmProfileConfig } from './filmProfiles';
import { getReelClipKey, getAssembledReelKey, getReelPosterKey } from '@/lib/storage/r2';
import type { AudioMood, ReelClip } from '@/types/reel';
import type { FilmProfileId } from '@/types/roll';

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
      `eq=brightness=${(profile.exposureBias.brightness - 1).toFixed(2)}:saturation=${profile.exposureBias.saturation.toFixed(2)}`,
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
): string[] {
  const inputs: string[] = [];
  const filterParts: string[] = [];

  for (let i = 0; i < clipPaths.length; i++) {
    inputs.push('-i', clipPaths[i]);
  }

  if (clipPaths.length === 1) {
    // Single clip, no transitions needed
    filterParts.push('[0:v]copy[vout]');
    filterParts.push('[0:a]anull[aout]');
  } else {
    // Build xfade chain for video
    let prevLabel = '0:v';
    for (let i = 1; i < clipPaths.length; i++) {
      const outLabel = i === clipPaths.length - 1 ? 'vout' : `v${i}`;
      filterParts.push(
        `[${prevLabel}][${i}:v]xfade=transition=fade:duration=0.5:offset=OFFSET_${i}[${outLabel}]`,
      );
      prevLabel = outLabel;
    }

    // Build acrossfade chain for audio
    let prevAudioLabel = '0:a';
    for (let i = 1; i < clipPaths.length; i++) {
      const outLabel = i === clipPaths.length - 1 ? 'aout' : `a${i}`;
      filterParts.push(
        `[${prevAudioLabel}][${i}:a]acrossfade=d=0.5[${outLabel}]`,
      );
      prevAudioLabel = outLabel;
    }
  }

  return [
    'ffmpeg',
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    outputPath,
  ];
}

/**
 * Simulate the reel development pipeline.
 * In production, this would:
 * 1. Trim each clip to in/out points
 * 2. Stabilize if needed
 * 3. Sample 3 frames for eyeQ color correction
 * 4. Apply eyeQ-derived correction + LUT + grain + vignette via FFmpeg
 * 5. Assemble all clips with crossfade transitions
 * 6. Apply audio mood (mix/replace audio)
 * 7. Encode final reel
 *
 * For the prototype, we simulate the pipeline by generating expected storage keys.
 */
export interface DevelopReelResult {
  assembledKey: string;
  posterKey: string;
  clipKeys: Array<{ clipId: string; processedKey: string; correctionApplied: boolean }>;
  assembledDurationMs: number;
}

export async function developReel(params: {
  userId: string;
  reelId: string;
  clips: ReelClip[];
  filmProfileId: FilmProfileId;
  audioMood: AudioMood;
  onClipProcessed?: (clipIndex: number, totalClips: number) => Promise<void>;
}): Promise<DevelopReelResult> {
  const { userId, reelId, clips, filmProfileId, onClipProcessed } = params;

  const profile = FILM_PROFILE_CONFIGS[filmProfileId];
  if (!profile) throw new Error(`Invalid film profile: ${filmProfileId}`);

  const clipKeys: DevelopReelResult['clipKeys'] = [];
  let assembledDurationMs = 0;

  // Process each clip
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const processedKey = getReelClipKey(userId, reelId, clip.position, filmProfileId);

    // In production: FFmpeg would process the clip here
    // For prototype, we simulate by generating the key
    clipKeys.push({
      clipId: clip.id,
      processedKey,
      correctionApplied: true, // Simulate eyeQ success
    });

    assembledDurationMs += clip.trimmed_duration_ms;

    // Notify progress
    if (onClipProcessed) {
      await onClipProcessed(i + 1, clips.length);
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 150));
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
  };
}
