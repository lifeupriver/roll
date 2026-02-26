// Magazine auto-design engine
// Phase 3.1: Rule-based layout system

import type { MagazinePage, MagazineTemplate } from '@/types/magazine';
import { selectLayout } from '@/lib/layout/page-templates';

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
}

interface TemporalCluster {
  date: string;
  photos: FavoritePhoto[];
}

/**
 * Group photos into temporal clusters (same day = same cluster).
 * If gap between clusters > 7 days, a divider is inserted.
 */
function clusterByDate(photos: FavoritePhoto[]): TemporalCluster[] {
  const sorted = [...photos].sort((a, b) => {
    const dateA = a.taken_at || '';
    const dateB = b.taken_at || '';
    return dateA.localeCompare(dateB);
  });

  const clusters: TemporalCluster[] = [];
  let currentDate = '';
  let currentCluster: FavoritePhoto[] = [];

  for (const photo of sorted) {
    const day = (photo.taken_at || '').slice(0, 10); // YYYY-MM-DD
    if (day !== currentDate) {
      if (currentCluster.length > 0) {
        clusters.push({ date: currentDate, photos: currentCluster });
      }
      currentDate = day;
      currentCluster = [photo];
    } else {
      currentCluster.push(photo);
    }
  }

  if (currentCluster.length > 0) {
    clusters.push({ date: currentDate, photos: currentCluster });
  }

  return clusters;
}

function getOrientation(photo: FavoritePhoto): 'portrait' | 'landscape' {
  return photo.height > photo.width ? 'portrait' : 'landscape';
}

/**
 * Score a photo for layout priority.
 * Higher score = more prominent placement (full bleed, cover candidate).
 */
function scorePhoto(photo: FavoritePhoto): number {
  let score = 0;
  score += (photo.aesthetic_score ?? 50) / 10; // 0-10 from aesthetic
  score += (photo.face_count ?? 0) * 2; // Faces add interest
  if (getOrientation(photo) === 'portrait') score += 1; // Portraits look great full-page
  return score;
}

/**
 * Check if there's a significant time gap between two cluster dates (> 7 days).
 */
function hasLargeGap(dateA: string, dateB: string): boolean {
  if (!dateA || !dateB) return false;
  const diff = Math.abs(new Date(dateB).getTime() - new Date(dateA).getTime());
  return diff > 7 * 24 * 60 * 60 * 1000;
}

/**
 * Format a date string for display as a section divider title.
 */
function formatDividerTitle(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Auto-design a magazine from a set of favorite photos.
 */
export function autoDesignMagazine(
  favorites: FavoritePhoto[],
  _template: MagazineTemplate,
  _dateRange: { start: Date; end: Date }
): MagazinePage[] {
  if (favorites.length === 0) return [];

  const pages: MagazinePage[] = [];
  const clusters = clusterByDate(favorites);
  let lastClusterDate = '';

  // Track used layouts to avoid consecutive duplicates
  let lastLayout = '';

  for (const cluster of clusters) {
    // Insert section divider if date gap > 7 days
    if (lastClusterDate && hasLargeGap(lastClusterDate, cluster.date)) {
      pages.push({
        layout: 'section_divider',
        photos: [],
        type: 'divider',
        title: formatDividerTitle(cluster.date),
      });
    }
    lastClusterDate = cluster.date;

    // Sort photos within cluster by score (highest first)
    const scored = [...cluster.photos].sort((a, b) => scorePhoto(b) - scorePhoto(a));

    let i = 0;
    while (i < scored.length) {
      const remaining = scored.length - i;

      // Best photo in cluster gets a full-bleed page
      if (i === 0 && scored[0] && scorePhoto(scored[0]) > 6) {
        const photo = scored[i];
        pages.push({
          layout: 'full_bleed',
          photos: [{ id: photo.photo_id, position: 0 }],
          caption: photo.caption,
          type: 'photo',
        });
        lastLayout = 'full_bleed';
        i++;
        continue;
      }

      // Determine how many photos to put on this page
      let pageSize: number;
      if (remaining >= 4) {
        pageSize = 4;
      } else if (remaining >= 3) {
        pageSize = 3;
      } else if (remaining >= 2) {
        pageSize = 2;
      } else {
        pageSize = 1;
      }

      const pagePhotos = scored.slice(i, i + pageSize);
      const orientations = pagePhotos.map(getOrientation);
      let layout = selectLayout(pageSize, orientations);

      // Avoid consecutive same layouts
      if (layout === lastLayout && pageSize === 1) {
        layout = 'caption_heavy';
      }

      pages.push({
        layout,
        photos: pagePhotos.map((p, idx) => ({
          id: p.photo_id,
          position: idx,
        })),
        caption: pagePhotos[0]?.caption,
        type: 'photo',
      });

      lastLayout = layout;
      i += pageSize;
    }
  }

  return pages;
}

/**
 * Roll-based magazine section for autoDesignFromRolls.
 */
export interface MagazineSection {
  rollId: string;
  title: string;
  story: string | null;
  photos: FavoritePhoto[];
}

/**
 * Auto-design a magazine from selected rolls (new roll-based flow).
 * Each roll becomes a section with: divider page → story page (if story) → photo pages.
 */
export function autoDesignFromRolls(
  sections: MagazineSection[],
  _template: MagazineTemplate,
  _options: { font?: string }
): MagazinePage[] {
  const pages: MagazinePage[] = [];
  let lastLayout = '';

  for (const section of sections) {
    // Section divider page with roll title
    pages.push({
      layout: 'section_divider',
      photos: [],
      type: 'divider',
      title: section.title,
    });

    // Story page if the roll has a story
    if (section.story) {
      pages.push({
        layout: 'story_page',
        photos: [],
        type: 'divider',
        caption: section.story,
        title: section.title,
      });
    }

    // Photo pages using the existing scoring algorithm
    const scored = [...section.photos].sort((a, b) => scorePhoto(b) - scorePhoto(a));
    let i = 0;

    while (i < scored.length) {
      const remaining = scored.length - i;
      const photo = scored[i];

      // High-scoring photos get full-page treatment
      if (scorePhoto(photo) >= 8 && lastLayout !== 'full_bleed') {
        pages.push({
          layout: 'full_bleed',
          photos: [{ id: photo.photo_id, position: 0 }],
          caption: photo.caption,
          type: 'photo',
        });
        lastLayout = 'full_bleed';
        i++;
        continue;
      }

      // Photos with long captions get caption-spread layout
      if (photo.caption && photo.caption.length > 100 && lastLayout !== 'caption_heavy') {
        pages.push({
          layout: 'caption_heavy',
          photos: [{ id: photo.photo_id, position: 0 }],
          caption: photo.caption,
          type: 'photo',
        });
        lastLayout = 'caption_heavy';
        i++;
        continue;
      }

      // Group remaining photos into pages
      let pageSize: number;
      if (remaining >= 4) {
        pageSize = 4;
      } else if (remaining >= 3) {
        pageSize = 3;
      } else if (remaining >= 2) {
        pageSize = 2;
      } else {
        pageSize = 1;
      }

      const pagePhotos = scored.slice(i, i + pageSize);
      const orientations = pagePhotos.map(getOrientation);
      let layout = selectLayout(pageSize, orientations);

      // Avoid consecutive same layouts
      if (layout === lastLayout) {
        if (pageSize === 1) layout = 'caption_heavy';
        else if (pageSize === 2)
          layout = layout === 'two_up_vertical' ? 'two_up_horizontal' : 'two_up_vertical';
      }

      pages.push({
        layout,
        photos: pagePhotos.map((p, idx) => ({
          id: p.photo_id,
          position: idx,
        })),
        caption: pagePhotos[0]?.caption,
        type: 'photo',
      });

      lastLayout = layout;
      i += pageSize;
    }
  }

  return pages;
}

/**
 * Auto-select the best photo for the magazine cover.
 */
export function selectCoverPhoto(favorites: FavoritePhoto[]): string | null {
  if (favorites.length === 0) return null;
  const sorted = [...favorites].sort((a, b) => scorePhoto(b) - scorePhoto(a));
  return sorted[0].photo_id;
}
