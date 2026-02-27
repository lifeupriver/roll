// Magazine auto-design engine
// Powered by the Smart Design System for beautiful, intelligent layouts.

import type { MagazinePage, MagazineTemplate } from '@/types/magazine';
import {
  smartDesignMagazine,
  smartDesignFromFavorites,
  selectBestCoverPhoto,
  type MagazineSection,
  type DesignOptions,
} from '@/lib/design/design-engine';

// Re-export types for backward compatibility
export type { MagazineSection };

interface FavoritePhoto {
  id: string;
  photo_id: string;
  thumbnail_url: string;
  developed_url?: string;
  width: number;
  height: number;
  taken_at?: string;
  caption?: string;
  aesthetic_score?: number;
  face_count?: number;
  scene_classification?: string[];
}

/**
 * Auto-design a magazine from a set of favorite photos.
 * Uses the Smart Design System to produce editorially-paced layouts
 * that respect photo aspect ratios and create beautiful visual rhythm.
 */
export function autoDesignMagazine(
  favorites: FavoritePhoto[],
  _template: MagazineTemplate,
  _dateRange: { start: Date; end: Date }
): MagazinePage[] {
  if (favorites.length === 0) return [];

  return smartDesignFromFavorites(
    favorites.map(f => ({
      photo_id: f.photo_id,
      width: f.width,
      height: f.height,
      taken_at: f.taken_at,
      caption: f.caption,
      aesthetic_score: f.aesthetic_score ?? null,
      face_count: f.face_count ?? null,
      scene_classification: f.scene_classification,
    })),
    { template: _template }
  );
}

/**
 * Auto-design a magazine from selected rolls.
 * Each roll becomes a section with: divider → story → editorially-designed photo pages.
 *
 * The Smart Design System ensures:
 * - Photos are never awkwardly cropped
 * - Visual rhythm alternates between hero images and multi-photo spreads
 * - Generous whitespace for a luxurious editorial feel
 * - No consecutive duplicate layouts
 * - Story pacing builds toward the strongest images
 */
export function autoDesignFromRolls(
  sections: MagazineSection[],
  _template: MagazineTemplate,
  _options: { font?: string }
): MagazinePage[] {
  return smartDesignMagazine(sections, {
    template: _template,
    font: _options.font as DesignOptions['font'],
  });
}

/**
 * Auto-select the best photo for the magazine cover.
 * Prefers landscape photos with high aesthetic scores for maximum cover impact.
 */
export function selectCoverPhoto(favorites: FavoritePhoto[]): string | null {
  if (favorites.length === 0) return null;

  return selectBestCoverPhoto(
    favorites.map(f => ({
      photo_id: f.photo_id,
      width: f.width,
      height: f.height,
      aesthetic_score: f.aesthetic_score ?? null,
      face_count: f.face_count ?? null,
      scene_classification: f.scene_classification,
    }))
  );
}
