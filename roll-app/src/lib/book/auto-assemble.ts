// Book auto-assembly engine
// Powered by the Smart Design System for beautiful, intelligent layouts.

import type { BookTemplate, TemplateSection } from './templates';
import type { PhotoMetrics } from '@/lib/design/photo-analysis';
import { smartAssembleBookFromSections } from '@/lib/design/design-engine';

interface FavoritePhoto {
  id: string;
  photo_id: string;
  thumbnail_url: string;
  width: number;
  height: number;
  taken_at?: string;
  caption?: string;
  aesthetic_score?: number | null;
  face_count?: number | null;
  scene_classification?: string[];
}

export interface AssembledPage {
  layout: string;
  photoIds: string[];
  caption?: string;
  sectionTitle?: string;
  type: 'photo' | 'divider';
}

/**
 * Filter favorites to a section's date range.
 */
function filterBySection(
  favorites: FavoritePhoto[],
  section: TemplateSection,
  startDate: Date
): FavoritePhoto[] {
  if (section.photoSource === 'all_favorites') {
    return favorites;
  }

  const offset = section.dateOffset?.months ?? 0;
  const sectionStart = new Date(startDate);
  sectionStart.setMonth(sectionStart.getMonth() + offset);

  const sectionEnd = new Date(sectionStart);
  if (section.photoSource === 'month') {
    sectionEnd.setMonth(sectionEnd.getMonth() + 1);
  } else {
    sectionEnd.setMonth(sectionEnd.getMonth() + 3);
  }

  return favorites.filter((f) => {
    if (!f.taken_at) return false;
    const d = new Date(f.taken_at);
    return d >= sectionStart && d < sectionEnd;
  });
}

/**
 * Auto-assemble a book from a template and user's favorites.
 * Uses the Smart Design System to produce editorially-paced layouts
 * within each section, with proper story arc across the entire book.
 *
 * The Smart Design System ensures:
 * - Photos shown at natural aspect ratios (no awkward cropping)
 * - Visual rhythm within each section
 * - Breathing pages between sections
 * - Strong cover-worthy images get full-page treatment
 * - Consistent typography throughout
 */
export function autoAssembleBook(
  favorites: FavoritePhoto[],
  template: BookTemplate,
  dateRange: { start: Date; end: Date }
): AssembledPage[] {
  // Build sections from template
  const sections = template.sections.length > 0
    ? template.sections.map(section => ({
        title: section.title,
        photos: filterBySection(favorites, section, dateRange.start).map(toPhotoMetrics),
      }))
    : [{
        title: 'Photos',
        photos: favorites.map(toPhotoMetrics),
      }];

  // Use the smart engine for assembly
  const result = smartAssembleBookFromSections(
    template.name,
    null, // Cover photo selected separately
    sections
  );

  // Convert to legacy AssembledPage format for backward compatibility
  return result.pages.map(page => {
    if (page.type === 'book-cover' || page.type === 'toc' || page.type === 'back-cover') {
      return {
        layout: 'section_divider',
        photoIds: [],
        sectionTitle: page.title ?? page.type,
        type: 'divider' as const,
      };
    }
    if (page.type === 'magazine-title') {
      return {
        layout: 'section_divider',
        photoIds: [],
        sectionTitle: page.title,
        type: 'divider' as const,
      };
    }
    // magazine-content
    return {
      layout: page.layout ?? 'full_bleed',
      photoIds: (page.photos ?? []).map(p => p.id),
      caption: page.caption,
      type: (page.photos && page.photos.length > 0 ? 'photo' : 'divider') as 'photo' | 'divider',
    };
  });
}

function toPhotoMetrics(f: FavoritePhoto): PhotoMetrics & { photo_id: string; taken_at?: string } {
  return {
    photo_id: f.photo_id,
    width: f.width,
    height: f.height,
    taken_at: f.taken_at,
    caption: f.caption,
    aesthetic_score: f.aesthetic_score ?? null,
    face_count: f.face_count ?? null,
    scene_classification: f.scene_classification,
  };
}
