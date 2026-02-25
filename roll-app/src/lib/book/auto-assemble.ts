// Book auto-assembly engine
// Phase 3.2: Uses layout engine shared with magazines

import type { BookTemplate, TemplateSection } from './templates';
import { selectLayout } from '@/lib/layout/page-templates';

interface FavoritePhoto {
  id: string;
  photo_id: string;
  thumbnail_url: string;
  width: number;
  height: number;
  taken_at?: string;
  caption?: string;
}

export interface AssembledPage {
  layout: string;
  photoIds: string[];
  caption?: string;
  sectionTitle?: string;
  type: 'photo' | 'divider';
}

function getOrientation(photo: FavoritePhoto): 'portrait' | 'landscape' {
  return photo.height > photo.width ? 'portrait' : 'landscape';
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
    // date_range: 3-month window (season)
    sectionEnd.setMonth(sectionEnd.getMonth() + 3);
  }

  return favorites.filter((f) => {
    if (!f.taken_at) return false;
    const d = new Date(f.taken_at);
    return d >= sectionStart && d < sectionEnd;
  });
}

/**
 * Lay out a group of photos into pages using the shared layout engine.
 */
function layoutPhotos(photos: FavoritePhoto[]): AssembledPage[] {
  const pages: AssembledPage[] = [];
  const sorted = [...photos].sort((a, b) => {
    return (a.taken_at || '').localeCompare(b.taken_at || '');
  });

  let i = 0;
  while (i < sorted.length) {
    const remaining = sorted.length - i;
    let pageSize: number;
    if (remaining >= 4) {
      pageSize = Math.min(4, remaining);
    } else {
      pageSize = remaining;
    }

    const pagePhotos = sorted.slice(i, i + pageSize);
    const orientations = pagePhotos.map(getOrientation);
    const layout = selectLayout(pageSize, orientations);

    pages.push({
      layout,
      photoIds: pagePhotos.map((p) => p.photo_id),
      caption: pagePhotos[0]?.caption,
      type: 'photo',
    });

    i += pageSize;
  }

  return pages;
}

/**
 * Auto-assemble a book from a template and user's favorites.
 */
export function autoAssembleBook(
  favorites: FavoritePhoto[],
  template: BookTemplate,
  dateRange: { start: Date; end: Date }
): AssembledPage[] {
  if (template.sections.length === 0) {
    // Blank book: just lay out all favorites
    return layoutPhotos(favorites);
  }

  const pages: AssembledPage[] = [];

  for (const section of template.sections) {
    // Add section divider page
    pages.push({
      layout: 'section_divider',
      photoIds: [],
      sectionTitle: section.title,
      type: 'divider',
    });

    // Get photos for this section
    const sectionPhotos = filterBySection(favorites, section, dateRange.start);
    const sectionPages = layoutPhotos(sectionPhotos);
    pages.push(...sectionPages);
  }

  return pages;
}
