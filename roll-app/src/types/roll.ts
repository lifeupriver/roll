export type RollStatus = 'building' | 'ready' | 'processing' | 'developed' | 'error';

export type FilmProfileId = 'warmth' | 'golden' | 'vivid' | 'classic' | 'gentle' | 'modern';

export interface Roll {
  id: string;
  user_id: string;
  name: string | null;
  status: RollStatus;
  film_profile: FilmProfileId | null;
  photo_count: number;
  max_photos: number;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_error: string | null;
  photos_processed: number;
  correction_skipped_count: number;
  created_at: string;
  updated_at: string;
}

export interface RollPhoto {
  id: string;
  roll_id: string;
  photo_id: string;
  position: number;
  processed_storage_key: string | null;
  correction_applied: boolean;
  created_at: string;
}

export interface FilmProfile {
  id: FilmProfileId;
  name: string;
  type: 'color' | 'bw';
  description: string;
  cssFilterClass: string;
  stockColor: string;
  tier: 'free' | 'plus';
}

export const FILM_PROFILES: FilmProfile[] = [
  {
    id: 'warmth',
    name: 'Warmth',
    type: 'color',
    description: 'Warm peach tones, soft highlights',
    cssFilterClass: 'preview-warmth',
    stockColor: 'var(--color-stock-warmth)',
    tier: 'free',
  },
  {
    id: 'golden',
    name: 'Golden',
    type: 'color',
    description: 'Kodak amber, golden hour glow',
    cssFilterClass: 'preview-golden',
    stockColor: 'var(--color-stock-golden)',
    tier: 'plus',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    type: 'color',
    description: 'Rich saturated life, Fuji greens',
    cssFilterClass: 'preview-vivid',
    stockColor: 'var(--color-stock-vivid)',
    tier: 'plus',
  },
  {
    id: 'classic',
    name: 'Classic',
    type: 'bw',
    description: 'Silver gelatin, high contrast B&W',
    cssFilterClass: 'preview-classic',
    stockColor: 'var(--color-stock-classic)',
    tier: 'plus',
  },
  {
    id: 'gentle',
    name: 'Gentle',
    type: 'bw',
    description: 'Soft platinum print, lifted shadows',
    cssFilterClass: 'preview-gentle',
    stockColor: 'var(--color-stock-gentle)',
    tier: 'plus',
  },
  {
    id: 'modern',
    name: 'Modern',
    type: 'bw',
    description: 'High contrast darkroom print',
    cssFilterClass: 'preview-modern',
    stockColor: 'var(--color-stock-modern)',
    tier: 'plus',
  },
];
