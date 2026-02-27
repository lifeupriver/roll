// ─── Essay Templates ─────────────────────────────────────────────────────────

export type EssayTemplate =
  | 'documentary'
  | 'travel'
  | 'portrait'
  | 'editorial'
  | 'minimal'
  | 'narrative';

export type EssayFont = 'default' | 'garamond' | 'futura' | 'playfair' | 'lora' | 'jakarta';

export interface BlogPost {
  id: string;
  user_id: string;
  roll_id: string;
  /** Additional roll IDs to include in this blog post. */
  roll_ids: string[];
  /** Reel IDs to embed as inline video in this blog post. */
  reel_ids: string[];
  title: string;
  slug: string;
  excerpt: string | null;
  story: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  cover_photo_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  allow_print_orders: boolean;
  allow_magazine_orders: boolean;
  allow_book_orders: boolean;
  /** Essay design template. */
  essay_template?: EssayTemplate | null;
  /** Typography choice for the essay. */
  essay_font?: EssayFont | null;
  /** Serialized design blocks (JSON) for the essay layout. */
  essay_blocks?: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** A media item (photo or video clip) for blog rendering. */
export interface BlogMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  caption: string | null;
  aesthetic_score: number | null;
  face_count: number | null;
  scene_classification: string[];
  /** Video duration in ms (null for photos). */
  duration_ms: number | null;
  /** Source: which roll or reel this came from. */
  source_id: string;
  source_type: 'roll' | 'reel';
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // Joined fields
  author_name?: string;
  author_avatar?: string;
}

export interface EmailSubscriber {
  id: string;
  author_id: string;
  email: string;
  confirmed: boolean;
  created_at: string;
}

export interface BlogSettings {
  blog_slug: string | null;
  blog_name: string | null;
  blog_description: string | null;
  blog_enabled: boolean;
}
