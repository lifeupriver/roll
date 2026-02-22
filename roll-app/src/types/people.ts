export interface Person {
  id: string;
  user_id: string;
  name: string;
  avatar_photo_id: string | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface PhotoTag {
  id: string;
  photo_id: string;
  person_id: string;
  /** Bounding box as fraction of image dimensions (0-1) */
  x: number;
  y: number;
  width: number;
  height: number;
  created_at: string;
  // Joined data
  person?: Person;
}
