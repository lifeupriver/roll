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
}

export type FilterStatus = 'pending' | 'visible' | 'filtered_auto' | 'hidden_manual';

export type FilterReason = 'blur' | 'screenshot' | 'duplicate' | 'exposure' | 'document' | null;

export type ContentMode = 'all' | 'people' | 'landscapes';

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
