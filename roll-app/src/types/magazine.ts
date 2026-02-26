export type MagazineStatus = 'draft' | 'review' | 'ordered' | 'shipped' | 'delivered';
export type MagazineTemplate =
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'highlights'
  | 'vacation'
  | 'custom';
export type MagazineFormat = '6x9' | '8x10';

export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  preferredOrientation: 'portrait' | 'landscape' | 'any';
}

export interface PageTemplate {
  id: string;
  name: string;
  slots: PhotoSlot[];
  captionPosition?: 'below' | 'overlay' | 'none';
}

export interface MagazinePagePhoto {
  id: string;
  position: number;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface MagazinePage {
  layout: string;
  photos: MagazinePagePhoto[];
  caption?: string;
  type?: 'photo' | 'divider' | 'cover';
  title?: string;
}

export interface Magazine {
  id: string;
  user_id: string;
  title: string;
  status: MagazineStatus;
  template: MagazineTemplate;
  cover_photo_id: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  page_count: number;
  format: MagazineFormat;
  pages: MagazinePage[];
  prodigi_order_id: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface MagazineSubscription {
  id: string;
  user_id: string;
  frequency: 'monthly' | 'quarterly';
  format: MagazineFormat;
  template: MagazineTemplate;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  stripe_subscription_id: string | null;
  status: 'active' | 'paused' | 'cancelled';
  next_issue_date: string | null;
  created_at: string;
  updated_at: string;
}

export type MagazineViewMode = 'read' | 'edit';
