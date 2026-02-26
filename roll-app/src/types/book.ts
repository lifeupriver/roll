export type BookFormat = '8x10' | '10x10';
export type BookStatus = 'draft' | 'review' | 'ordered' | 'shipped' | 'delivered' | 'published';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  // Legacy fields (photo book)
  name?: string;
  description?: string | null;
  cover_url?: string | null;
  photo_ids?: string[];
  photo_count?: number;
  captions?: Record<string, string>;
  // New fields (magazine-compiled book)
  magazine_ids: string[];
  cover_photo_id: string | null;
  font: string;
  format: BookFormat;
  page_count: number;
  price_cents: number | null;
  status: BookStatus;
  prodigi_order_id: string | null;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  // Legacy fields
  photoId?: string;
  thumbnailUrl?: string;
  storageKey?: string;
  caption?: string;
  width?: number;
  height?: number;
  // New fields (assembled book)
  type?: 'book-cover' | 'toc' | 'magazine-title' | 'magazine-content' | 'back-cover';
  title?: string;
  coverPhotoId?: string | null;
  dateRange?: string;
  layout?: string;
  photos?: { id: string; position: number }[];
  magazineTitle?: string;
  tocEntries?: { title: string; startPage: number }[];
}

export type BookViewMode = 'read' | 'edit';
export type BookLayout = 'spread' | 'single';
