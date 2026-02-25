export interface Book {
  id: string;
  user_id?: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  photo_ids: string[];
  photo_count: number;
  captions: Record<string, string>; // photo_id -> caption text
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  photoId: string;
  thumbnailUrl: string;
  storageKey: string;
  caption: string;
  width: number;
  height: number;
}

export type BookViewMode = 'read' | 'edit';
export type BookLayout = 'spread' | 'single';
