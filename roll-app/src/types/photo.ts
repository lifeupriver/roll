export type MediaType = 'photo' | 'video';

export type DurationCategory = 'flash' | 'moment' | 'scene';

export type AudioClassification = 'speech' | 'music' | 'ambient' | 'silent';

export interface Photo {
  id: string;
  user_id: string;
  storage_key: string;
  thumbnail_url: string;
  lqip_base64: string | null;
  filename: string;
  content_hash: string;
  content_type: string;
  size_bytes: number;
  width: number;
  height: number;
  date_taken: string | null;
  latitude: number | null;
  longitude: number | null;
  camera_make: string | null;
  camera_model: string | null;
  filter_status: FilterStatus;
  filter_reason: FilterReason;
  aesthetic_score: number | null;
  phash: string | null;
  face_count: number;
  scene_classification: string[];
  created_at: string;
  updated_at: string;
  // Video-specific fields (null for photos)
  media_type: MediaType;
  duration_ms: number | null;
  duration_category: DurationCategory | null;
  preview_storage_key: string | null;
  audio_classification: AudioClassification | null;
  stabilization_score: number | null;
}

export type FilterStatus = 'pending' | 'visible' | 'filtered_auto' | 'hidden_manual';

export type FilterReason = 'blur' | 'screenshot' | 'duplicate' | 'exposure' | 'document' | 'accidental' | 'screen_recording' | 'too_shaky' | null;

export type ContentMode = 'all' | 'people' | 'clips';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface FilterResult {
  filter_status: FilterStatus;
  filter_reason: FilterReason;
  aesthetic_score: number;
  face_count: number;
  scene_classification: string[];
  phash: string;
}

// Stack — groups of visually similar photos
export interface PhotoStack {
  id: string;
  topPhoto: Photo;          // Best photo (highest aesthetic score) — chosen for roll
  photos: Photo[];           // All photos in the stack (including topPhoto)
  similarity: number;        // 0–1 how similar the photos are
}

export type StackMode = 'auto' | 'manual' | 'off';

export interface StackSettings {
  mode: StackMode;
  sensitivity: number;       // 0–1, higher = more aggressive grouping
  minStackSize: number;      // Minimum photos to form a stack (default 2)
}
