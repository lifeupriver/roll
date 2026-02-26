export interface BlogPost {
  id: string;
  user_id: string;
  roll_id: string;
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
  view_count: number;
  created_at: string;
  updated_at: string;
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
