import type { FilmProfileId } from './roll';

export type ReelStatus = 'building' | 'ready' | 'processing' | 'developed' | 'error' | 'archived';

export type ReelSize = 'short' | 'standard' | 'feature';

export type AudioMood = 'original' | 'quiet_film' | 'silent_film' | 'ambient';

export type TransitionType = 'crossfade' | 'cut' | 'dip_to_black';

export const REEL_SIZE_CONFIG: Record<
  ReelSize,
  { label: string; maxDurationMs: number; tier: 'free' | 'plus' }
> = {
  short: { label: 'Short Reel', maxDurationMs: 60_000, tier: 'free' },
  standard: { label: 'Standard Reel', maxDurationMs: 180_000, tier: 'plus' },
  feature: { label: 'Feature Reel', maxDurationMs: 300_000, tier: 'plus' },
};

export const AUDIO_MOODS: Array<{
  id: AudioMood;
  label: string;
  description: string;
  tier: 'free' | 'plus';
}> = [
  {
    id: 'original',
    label: 'Original',
    description: 'Keep all original audio, normalized across clips',
    tier: 'free',
  },
  {
    id: 'quiet_film',
    label: 'Quiet Film',
    description: 'Lower original audio, add gentle score underneath',
    tier: 'plus',
  },
  {
    id: 'silent_film',
    label: 'Silent Film',
    description: 'Remove original audio, gentle piano/strings score',
    tier: 'plus',
  },
  {
    id: 'ambient',
    label: 'Ambient',
    description: 'Keep original audio, add subtle ambient texture',
    tier: 'plus',
  },
];

export const MIN_REEL_CLIPS = 3;
export const MIN_REEL_DURATION_MS = 15_000; // 15 seconds

export interface Reel {
  id: string;
  user_id: string;
  name: string | null;
  status: ReelStatus;
  film_profile: FilmProfileId | null;
  audio_mood: AudioMood;
  reel_size: ReelSize;
  target_duration_ms: number;
  current_duration_ms: number;
  clip_count: number;
  default_clip_length_s: number | null;
  ambient_audio: boolean;
  transcribe_audio: boolean;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_error: string | null;
  clips_processed: number;
  correction_skipped_count: number;
  assembled_storage_key: string | null;
  poster_storage_key: string | null;
  assembled_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReelClip {
  id: string;
  reel_id: string;
  photo_id: string; // References the video record in photos table
  position: number;
  trim_start_ms: number;
  trim_end_ms: number | null;
  trimmed_duration_ms: number;
  processed_storage_key: string | null;
  correction_applied: boolean;
  transition_type: TransitionType;
  created_at: string;
}

export interface FavoriteReel {
  id: string;
  user_id: string;
  reel_id: string;
  created_at: string;
}
