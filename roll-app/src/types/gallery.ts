export interface PublicGallerySettings {
  logo_url?: string;
  accent_color?: string;
  contact_info?: string;
  watermark?: boolean;
}

export interface PublicGallery {
  slug: string;
  roll_id: string;
  title: string;
  description: string | null;
  photo_count: number;
  settings: PublicGallerySettings;
  business_name: string | null;
  business_logo_url: string | null;
  photos: PublicGalleryPhoto[];
}

export interface PublicGalleryPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption?: string;
}
