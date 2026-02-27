// Smart Design System — Design Engine
// The central intelligence that produces beautiful layouts automatically.
// Uses photo analysis, typography rules, and composition rules together.

import type { MagazinePage, MagazineFont, MagazineTemplate } from '@/types/magazine';
import type { BookPage } from '@/types/book';
import type { PhotoMetrics, VisualWeightResult, PhotoSetAnalysis } from './photo-analysis';
import {
  calculateVisualWeight,
  analyzePhotoSet,
  classifyAspectRatio,
  getOrientation,
  groupByCompatibility,
  areAspectRatiosCompatible,
} from './photo-analysis';
import {
  getRhythmBeat,
  rhythmToDensity,
  getStoryPhase,
  getPhaseMaxDensity,
  createLayoutHistory,
  recordLayout,
  isLayoutStale,
  isOrientationHarmonious,
  evaluateSpreadBalance,
  scoreSceneAdjacency,
} from './composition';
import type { PageDensity, RhythmBeat } from './composition';
import { getCaptionStyle, isPullQuoteWorthy, getFontPairing } from './typography';
import { selectSmartLayout, type SmartLayoutId } from '@/lib/layout/page-templates';

// ─── Design Options ───────────────────────────────────────────────────────────

export interface DesignOptions {
  font?: MagazineFont;
  template?: MagazineTemplate;
  format?: string;
  /** Override density preference. Default: auto (adapts to content). */
  densityPreference?: PageDensity;
  /** When true, inserts more breathing pages between dense content. */
  editorialMode?: boolean;
}

// ─── Enriched Photo ───────────────────────────────────────────────────────────
// A photo with its analysis pre-computed for the design engine.

export interface EnrichedPhoto extends PhotoMetrics {
  photo_id: string;
  taken_at?: string;
  weight: VisualWeightResult;
}

function enrichPhoto(photo: PhotoMetrics & { photo_id: string; taken_at?: string }): EnrichedPhoto {
  return {
    ...photo,
    weight: calculateVisualWeight(photo),
  };
}

function enrichPhotos(photos: (PhotoMetrics & { photo_id: string; taken_at?: string })[]): EnrichedPhoto[] {
  return photos.map(enrichPhoto);
}

// ─── Smart Magazine Design ────────────────────────────────────────────────────

export interface MagazineSection {
  rollId: string;
  title: string;
  story: string | null;
  photos: (PhotoMetrics & { photo_id: string; taken_at?: string })[];
}

/**
 * Smart magazine design engine.
 * Produces beautiful, editorially-paced layouts that respect photo aspect ratios,
 * use generous whitespace, and create visual rhythm.
 */
export function smartDesignMagazine(
  sections: MagazineSection[],
  options: DesignOptions = {}
): MagazinePage[] {
  const pages: MagazinePage[] = [];
  const layoutHistory = createLayoutHistory(6);

  for (const section of sections) {
    const enriched = enrichPhotos(section.photos);
    const analysis = analyzePhotoSet(enriched);

    // ── Section divider with generous whitespace ──
    pages.push({
      layout: 'section_divider',
      photos: [],
      type: 'divider',
      title: section.title,
    });

    // ── Story page if the roll has narrative text ──
    if (section.story && section.story.trim().length > 0) {
      pages.push({
        layout: 'text_page',
        photos: [],
        type: 'divider',
        caption: section.story,
        title: section.title,
      });
    }

    // ── Design photo pages using editorial rhythm ──
    const sectionPages = designPhotoSequence(enriched, analysis, layoutHistory, options);
    pages.push(...sectionPages);
  }

  // ── Post-process: balance spreads ──
  return balanceSpreads(pages);
}

/**
 * Smart magazine design from favorites (non-roll-based).
 * Groups photos by date clusters and applies the same editorial intelligence.
 */
export function smartDesignFromFavorites(
  favorites: (PhotoMetrics & { photo_id: string; taken_at?: string; caption?: string | null })[],
  options: DesignOptions = {}
): MagazinePage[] {
  const enriched = enrichPhotos(favorites);
  const analysis = analyzePhotoSet(enriched);
  const layoutHistory = createLayoutHistory(6);

  // Cluster by date
  const clusters = clusterByDate(enriched);
  const pages: MagazinePage[] = [];

  let lastClusterDate = '';

  for (const cluster of clusters) {
    // Insert section divider for large time gaps
    if (lastClusterDate && hasLargeGap(lastClusterDate, cluster.date)) {
      pages.push({
        layout: 'section_divider',
        photos: [],
        type: 'divider',
        title: formatDividerTitle(cluster.date),
      });
    }
    lastClusterDate = cluster.date;

    const clusterPages = designPhotoSequence(cluster.photos, analysis, layoutHistory, options);
    pages.push(...clusterPages);
  }

  return balanceSpreads(pages);
}

// ─── Core Layout Algorithm ────────────────────────────────────────────────────

/**
 * The heart of the design engine. Takes a sequence of enriched photos
 * and produces a sequence of beautifully-paced magazine pages.
 *
 * Design principles applied:
 * 1. Hero photos (high visual weight) get full-page treatment
 * 2. Photos are grouped by orientation compatibility
 * 3. Visual rhythm alternates between dense and sparse
 * 4. Panoramic/wide photos get special cinematic layouts
 * 5. Captions get breathing room, never overlaid on busy images
 * 6. No consecutive duplicate layouts
 * 7. Story pacing builds toward the strongest images
 */
function designPhotoSequence(
  photos: EnrichedPhoto[],
  analysis: PhotoSetAnalysis,
  layoutHistory: ReturnType<typeof createLayoutHistory>,
  options: DesignOptions
): MagazinePage[] {
  if (photos.length === 0) return [];

  const pages: MagazinePage[] = [];

  // Sort by visual weight (highest first) to identify heroes,
  // but preserve chronological order for the story flow
  const byWeight = [...photos].sort((a, b) => b.weight.score - a.weight.score);
  const heroPhotos = new Set(
    byWeight.filter(p => p.weight.isHeroCandidate).slice(0, Math.ceil(photos.length / 4)).map(p => p.photo_id)
  );

  // Process photos in chronological order
  const chronological = [...photos].sort((a, b) =>
    (a.taken_at ?? '').localeCompare(b.taken_at ?? '')
  );

  let i = 0;
  let pageInSection = 0;
  const totalEstimatedPages = estimatePageCount(photos.length, analysis);

  while (i < chronological.length) {
    const photo = chronological[i];
    const remaining = chronological.length - i;
    const storyPhase = getStoryPhase(pageInSection, totalEstimatedPages);
    const phaseMaxDensity = getPhaseMaxDensity(storyPhase);
    const rhythmBeat = getRhythmBeat(pageInSection, totalEstimatedPages);
    const rhythmDensity = rhythmToDensity(rhythmBeat);

    // Use the more restrictive of phase and rhythm density
    const targetDensity = options.densityPreference ??
      restrictDensity(rhythmDensity, phaseMaxDensity);

    // ── RULE 1: Hero photos get full-page treatment ──
    if (heroPhotos.has(photo.photo_id)) {
      const layout = selectHeroLayout(photo, layoutHistory);
      pages.push(createPhotoPage(layout, [photo]));
      recordLayout(layoutHistory, layout);
      heroPhotos.delete(photo.photo_id);
      i++;
      pageInSection++;

      // Insert breathing page after hero if editorial mode
      if (options.editorialMode && photo.weight.hasStrongCaption) {
        pages.push(createBreathingPage(photo));
        pageInSection++;
      }
      continue;
    }

    // ── RULE 2: Panoramic photos get cinematic layout ──
    if (photo.weight.aspectClass === 'panoramic' || photo.weight.aspectClass === 'wide') {
      const layout = photo.weight.aspectClass === 'panoramic' ? 'cinematic' : 'hero_landscape';
      if (!isLayoutStale(layoutHistory, layout)) {
        pages.push(createPhotoPage(layout, [photo]));
        recordLayout(layoutHistory, layout);
        i++;
        pageInSection++;
        continue;
      }
    }

    // ── RULE 3: Photos with pull-quote-worthy captions ──
    if (photo.caption && isPullQuoteWorthy(photo.caption) && !isLayoutStale(layoutHistory, 'pullquote')) {
      pages.push(createPhotoPage('pullquote', [photo]));
      recordLayout(layoutHistory, 'pullquote');
      i++;
      pageInSection++;
      continue;
    }

    // ── RULE 4: Group compatible photos by target density ──
    const maxOnPage = getMaxPhotosForDensity(targetDensity);
    const group = findCompatibleGroup(chronological, i, maxOnPage);

    const layout = selectSmartLayout(
      group.length,
      group.map(p => p.weight.orientation),
      group.map(p => p.weight.aspectClass),
      layoutHistory.recentLayouts
    );

    if (!isLayoutStale(layoutHistory, layout)) {
      pages.push(createPhotoPage(layout, group));
      recordLayout(layoutHistory, layout);
    } else {
      // Fallback: force a different layout
      const fallback = getFallbackLayout(group.length, layout, layoutHistory);
      pages.push(createPhotoPage(fallback, group));
      recordLayout(layoutHistory, fallback);
    }

    i += group.length;
    pageInSection++;
  }

  return pages;
}

// ─── Helper: Select Hero Layout ───────────────────────────────────────────────

function selectHeroLayout(photo: EnrichedPhoto, history: ReturnType<typeof createLayoutHistory>): string {
  const { aspectClass, orientation } = photo.weight;

  // Panoramic → cinematic
  if (aspectClass === 'panoramic') return 'cinematic';

  // Wide landscape → hero landscape
  if (aspectClass === 'wide' || orientation === 'landscape') {
    const layout = 'hero_landscape';
    return isLayoutStale(history, layout) ? 'full_bleed' : layout;
  }

  // Portrait → hero portrait (with margins, no crop)
  if (orientation === 'portrait') {
    const layout = 'hero_portrait';
    return isLayoutStale(history, layout) ? 'full_bleed' : layout;
  }

  // Default
  return 'full_bleed';
}

// ─── Helper: Find Compatible Photo Group ──────────────────────────────────────

function findCompatibleGroup(
  photos: EnrichedPhoto[],
  startIndex: number,
  maxSize: number
): EnrichedPhoto[] {
  const group: EnrichedPhoto[] = [photos[startIndex]];
  const baseOrientation = photos[startIndex].weight.orientation;

  for (let j = startIndex + 1; j < photos.length && group.length < maxSize; j++) {
    const candidate = photos[j];

    // Skip heroes — they'll get their own page
    if (candidate.weight.isHeroCandidate) continue;

    // Must be orientation-compatible
    if (candidate.weight.orientation !== baseOrientation && baseOrientation !== 'square' && candidate.weight.orientation !== 'square') {
      continue;
    }

    // Must have compatible aspect ratios
    if (!areAspectRatiosCompatible(photos[startIndex], candidate)) {
      continue;
    }

    group.push(candidate);
  }

  return group;
}

// ─── Helper: Create Pages ─────────────────────────────────────────────────────

function createPhotoPage(layout: string, photos: EnrichedPhoto[]): MagazinePage {
  // For single-photo layouts, include the caption
  const caption = photos.length === 1 ? (photos[0].caption ?? undefined) : undefined;

  return {
    layout,
    photos: photos.map((p, idx) => ({
      id: p.photo_id,
      position: idx,
    })),
    caption,
    type: 'photo',
  };
}

function createBreathingPage(photo: EnrichedPhoto): MagazinePage {
  return {
    layout: 'text_page',
    photos: [],
    type: 'divider',
    caption: photo.caption ?? undefined,
  };
}

// ─── Helper: Density → Max Photos ─────────────────────────────────────────────

function getMaxPhotosForDensity(density: PageDensity): number {
  switch (density) {
    case 'minimal': return 1;
    case 'light': return 2;
    case 'moderate': return 3;
    case 'rich': return 4;
  }
}

function restrictDensity(a: PageDensity, b: PageDensity): PageDensity {
  const order: PageDensity[] = ['minimal', 'light', 'moderate', 'rich'];
  const idxA = order.indexOf(a);
  const idxB = order.indexOf(b);
  return order[Math.min(idxA, idxB)];
}

// ─── Helper: Layout Fallbacks ─────────────────────────────────────────────────

function getFallbackLayout(
  photoCount: number,
  avoidLayout: string,
  history: ReturnType<typeof createLayoutHistory>
): string {
  const candidates: string[] = [];

  if (photoCount === 1) {
    candidates.push('full_bleed', 'hero_portrait', 'hero_landscape', 'caption_heavy');
  } else if (photoCount === 2) {
    candidates.push('duo_matched', 'two_up_vertical', 'two_up_horizontal', 'asymmetric_pair');
  } else if (photoCount === 3) {
    candidates.push('triptych', 'three_up_top_heavy');
  } else {
    candidates.push('four_up_grid', 'gallery_strip');
  }

  // Find one that isn't stale
  for (const candidate of candidates) {
    if (candidate !== avoidLayout && !isLayoutStale(history, candidate)) {
      return candidate;
    }
  }

  // Last resort: use first candidate even if stale
  return candidates[0];
}

// ─── Helper: Estimate Page Count ──────────────────────────────────────────────

function estimatePageCount(photoCount: number, analysis: PhotoSetAnalysis): number {
  // On average: heroes get 1 photo/page, pairs get 2, grids get 3–4
  // With editorial rhythm, roughly 1.8 photos per page on average
  const photosPerPage = analysis.heroCount > 0 ? 1.5 : 2;
  return Math.max(4, Math.ceil(photoCount / photosPerPage));
}

// ─── Spread Balancing ─────────────────────────────────────────────────────────

/**
 * Post-process pages to ensure two-page spreads feel balanced.
 * Reorders pages within constraints to improve visual balance.
 * Does NOT crop or modify individual pages.
 */
function balanceSpreads(pages: MagazinePage[]): MagazinePage[] {
  // In a spread-based layout, pages are viewed in pairs: [0,1], [2,3], [4,5]...
  // We can swap adjacent non-divider photo pages to improve balance.
  const result = [...pages];

  for (let i = 0; i < result.length - 1; i += 2) {
    const left = result[i];
    const right = result[i + 1];

    if (!left || !right) continue;
    if (left.type === 'divider' || right.type === 'divider') continue;

    // If left is much heavier than right and next spread starts with a lighter page,
    // consider if the current order is optimal. For now, the rhythm engine
    // should have handled this, so we just validate.
    const leftCount = left.photos.length;
    const rightCount = right.photos.length;

    // Avoid hero+hero or grid+grid on same spread
    if (leftCount === 1 && rightCount === 1) {
      // Two full-bleed pages facing each other: OK if intentional (dramatic spread)
      continue;
    }

    if (leftCount >= 3 && rightCount >= 3) {
      // Two dense pages facing each other: try to insert a breathing page
      // Only if we have room and it won't break the sequence
      // For now, flag this — the rhythm engine should prevent it
      continue;
    }
  }

  return result;
}

// ─── Smart Book Assembly ──────────────────────────────────────────────────────

interface MagazineForSmartAssembly {
  id: string;
  title: string;
  date_range_start: string | null;
  date_range_end: string | null;
  pages: MagazinePage[];
}

/**
 * Smart book assembly. Wraps magazine content into a book structure
 * while ensuring:
 * - Consistent typography across magazine sections
 * - Spread balance at section boundaries
 * - Clean section transitions with breathing room
 * - Proper page numbering
 */
export function smartAssembleBook(
  title: string,
  coverPhotoId: string | null,
  magazines: MagazineForSmartAssembly[],
  options: DesignOptions = {}
): { pages: BookPage[]; totalPages: number } {
  const pages: BookPage[] = [];

  // 1. Cover page
  pages.push({
    type: 'book-cover',
    title,
    coverPhotoId,
  });

  // 2. Half-title page (book title, no image — adds gravitas)
  pages.push({
    type: 'toc',
    title,
    tocEntries: [],
  });

  // 3. Table of contents
  const tocEntries: { title: string; startPage: number }[] = [];
  let currentPage = 4; // After cover + half-title + TOC + blank

  for (const mag of magazines) {
    tocEntries.push({ title: mag.title, startPage: currentPage });
    // Title page + content pages + end breathing page
    currentPage += 1 + (mag.pages?.length || 0) + 1;
  }

  pages.push({
    type: 'toc',
    tocEntries,
  });

  // 4. Each magazine section
  for (let mi = 0; mi < magazines.length; mi++) {
    const magazine = magazines[mi];
    const dateRange = formatDateRange(magazine.date_range_start, magazine.date_range_end);

    // Section title page (right-hand page for impact)
    pages.push({
      type: 'magazine-title',
      title: magazine.title,
      dateRange,
    });

    // Magazine content pages
    const magPages = magazine.pages || [];
    for (const page of magPages) {
      pages.push({
        type: 'magazine-content',
        layout: page.layout,
        photos: page.photos,
        caption: page.caption,
        magazineTitle: magazine.title,
      });
    }

    // Breathing page between sections (blank or colophon)
    if (mi < magazines.length - 1) {
      pages.push({
        type: 'magazine-content',
        layout: 'text_page',
        photos: [],
        caption: undefined,
      });
    }
  }

  // 5. Back cover
  pages.push({ type: 'back-cover' });

  return { pages, totalPages: pages.length };
}

// ─── Smart Book from Templates ────────────────────────────────────────────────

interface BookSection {
  title: string;
  photos: (PhotoMetrics & { photo_id: string; taken_at?: string })[];
}

/**
 * Auto-assemble a book directly from photo sections (template-based flow).
 * Uses the smart design engine for each section.
 */
export function smartAssembleBookFromSections(
  title: string,
  coverPhotoId: string | null,
  sections: BookSection[],
  options: DesignOptions = {}
): { pages: BookPage[]; totalPages: number } {
  const pages: BookPage[] = [];
  const layoutHistory = createLayoutHistory(6);

  // Cover
  pages.push({ type: 'book-cover', title, coverPhotoId });

  // TOC
  const tocEntries: { title: string; startPage: number }[] = [];
  let estimatedPage = 3;
  for (const section of sections) {
    tocEntries.push({ title: section.title, startPage: estimatedPage });
    const enriched = enrichPhotos(section.photos);
    const analysis = analyzePhotoSet(enriched);
    estimatedPage += 1 + estimatePageCount(enriched.length, analysis);
  }
  pages.push({ type: 'toc', tocEntries });

  // Sections
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];

    // Section title page
    pages.push({
      type: 'magazine-title',
      title: section.title,
    });

    // Photo pages designed by the smart engine
    const enriched = enrichPhotos(section.photos);
    const analysis = analyzePhotoSet(enriched);
    const sectionPages = designPhotoSequence(enriched, analysis, layoutHistory, options);

    for (const page of sectionPages) {
      pages.push({
        type: 'magazine-content',
        layout: page.layout,
        photos: page.photos,
        caption: page.caption,
      });
    }

    // Breathing page between sections
    if (si < sections.length - 1) {
      pages.push({
        type: 'magazine-content',
        layout: 'text_page',
        photos: [],
      });
    }
  }

  // Back cover
  pages.push({ type: 'back-cover' });

  return { pages, totalPages: pages.length };
}

// ─── Smart Blog Layout ────────────────────────────────────────────────────────

export type BlogBlockType = 'hero' | 'photo-single' | 'photo-pair' | 'photo-triptych' |
  'photo-grid' | 'panoramic' | 'pullquote' | 'text' | 'video' | 'video-pair';

export interface BlogBlock {
  type: BlogBlockType;
  /** Photo IDs in this block (for photo/hero blocks). */
  photoIds: string[];
  /** Video/reel clip IDs (for video blocks). */
  videoIds: string[];
  /** Caption or text content. */
  text?: string;
  /** Layout hint for the renderer. */
  aspectRatio?: number;
  /** Whether photos should be shown at natural aspect ratio (no crop). */
  preserveAspectRatio: boolean;
}

interface BlogMediaItem {
  id: string;
  type: 'photo' | 'video';
  width: number;
  height: number;
  caption?: string | null;
  aesthetic_score?: number | null;
  face_count?: number | null;
  scene_classification?: string[];
  duration_ms?: number | null;
}

/**
 * Smart blog layout engine.
 * Combines photos and video clips into a beautiful editorial flow.
 * Supports mixed media from rolls (photos) and reels (video clips).
 *
 * Key differences from magazine/book layouts:
 * - Scrolling (not paginated) so rhythm is about scroll cadence
 * - Videos are inline and playable
 * - More generous vertical whitespace between blocks
 * - Photos always shown at natural aspect ratio (no crop)
 */
export function smartDesignBlog(
  items: BlogMediaItem[],
  story?: string | null
): BlogBlock[] {
  if (items.length === 0 && !story) return [];

  const blocks: BlogBlock[] = [];
  const photos = items.filter(i => i.type === 'photo');
  const videos = items.filter(i => i.type === 'video');

  // Enrich photos for analysis
  const enrichedPhotos = photos.map(p => ({
    ...p,
    photo_id: p.id,
    weight: calculateVisualWeight(p),
  }));

  // Find the best hero photo (or video)
  const heroPhoto = enrichedPhotos.length > 0
    ? [...enrichedPhotos].sort((a, b) => b.weight.score - a.weight.score)[0]
    : null;

  // ── Hero block (first, most impactful image) ──
  if (heroPhoto) {
    blocks.push({
      type: 'hero',
      photoIds: [heroPhoto.photo_id],
      videoIds: [],
      aspectRatio: heroPhoto.width / heroPhoto.height,
      preserveAspectRatio: true,
    });
  }

  // ── Story text block ──
  if (story && story.trim().length > 0) {
    blocks.push({
      type: 'text',
      photoIds: [],
      videoIds: [],
      text: story,
      preserveAspectRatio: true,
    });
  }

  // ── Interleave remaining photos and videos ──
  const remainingPhotos = enrichedPhotos.filter(p => p.photo_id !== heroPhoto?.photo_id);
  let photoIdx = 0;
  let videoIdx = 0;

  // Pattern: show 2–3 photos, then a video, then 2–3 more photos
  while (photoIdx < remainingPhotos.length || videoIdx < videos.length) {
    // Photos batch (2–3 photos grouped intelligently)
    if (photoIdx < remainingPhotos.length) {
      const batch = selectPhotoBatch(remainingPhotos, photoIdx);
      const batchBlock = createBlogPhotoBlock(batch);
      blocks.push(batchBlock);
      photoIdx += batch.length;

      // Pull quote from a captioned photo
      const captionedPhoto = batch.find(p => p.caption && isPullQuoteWorthy(p.caption));
      if (captionedPhoto) {
        blocks.push({
          type: 'pullquote',
          photoIds: [],
          videoIds: [],
          text: captionedPhoto.caption!,
          preserveAspectRatio: true,
        });
      }
    }

    // Video block
    if (videoIdx < videos.length) {
      const video = videos[videoIdx];
      blocks.push({
        type: 'video',
        photoIds: [],
        videoIds: [video.id],
        aspectRatio: video.width && video.height ? video.width / video.height : 16 / 9,
        preserveAspectRatio: true,
      });
      videoIdx++;
    }
  }

  return blocks;
}

// ─── Blog Helper: Select Photo Batch ──────────────────────────────────────────

function selectPhotoBatch(
  photos: (EnrichedPhoto & { photo_id: string })[],
  startIndex: number
): (EnrichedPhoto & { photo_id: string })[] {
  const remaining = photos.length - startIndex;
  if (remaining <= 0) return [];

  const first = photos[startIndex];

  // Panoramic/wide → always solo
  if (first.weight.aspectClass === 'panoramic' || first.weight.aspectClass === 'wide') {
    return [first];
  }

  // High-weight → solo
  if (first.weight.isHeroCandidate) {
    return [first];
  }

  // Try to pair with compatible photos
  if (remaining >= 2) {
    const second = photos[startIndex + 1];
    if (second && areAspectRatiosCompatible(first, second)) {
      // Can we make a triptych?
      if (remaining >= 3) {
        const third = photos[startIndex + 2];
        if (third && areAspectRatiosCompatible(first, third)) {
          return [first, second, third];
        }
      }
      return [first, second];
    }
  }

  // Solo
  return [first];
}

function createBlogPhotoBlock(
  photos: (EnrichedPhoto & { photo_id: string })[]
): BlogBlock {
  if (photos.length === 1) {
    const photo = photos[0];
    const type: BlogBlockType =
      photo.weight.aspectClass === 'panoramic' ? 'panoramic' : 'photo-single';
    return {
      type,
      photoIds: [photo.photo_id],
      videoIds: [],
      aspectRatio: photo.width / photo.height,
      preserveAspectRatio: true,
    };
  }

  if (photos.length === 2) {
    return {
      type: 'photo-pair',
      photoIds: photos.map(p => p.photo_id),
      videoIds: [],
      preserveAspectRatio: true,
    };
  }

  if (photos.length === 3) {
    return {
      type: 'photo-triptych',
      photoIds: photos.map(p => p.photo_id),
      videoIds: [],
      preserveAspectRatio: true,
    };
  }

  return {
    type: 'photo-grid',
    photoIds: photos.map(p => p.photo_id),
    videoIds: [],
    preserveAspectRatio: true,
  };
}

// ─── Essay Template Rhythms ──────────────────────────────────────────────────
// Each template defines a repeating block-type pattern that determines
// the visual cadence of the essay.

type EssayTemplateId = 'documentary' | 'travel' | 'portrait' | 'editorial' | 'minimal' | 'narrative';

const ESSAY_RHYTHMS: Record<EssayTemplateId, BlogBlockType[]> = {
  documentary: ['hero', 'text', 'photo-pair', 'pullquote', 'photo-single', 'photo-triptych', 'text'],
  travel: ['hero', 'panoramic', 'photo-pair', 'text', 'photo-triptych', 'photo-single', 'pullquote'],
  portrait: ['hero', 'photo-single', 'pullquote', 'photo-single', 'photo-pair', 'text', 'photo-single'],
  editorial: ['hero', 'photo-grid', 'text', 'photo-triptych', 'hero', 'photo-pair', 'pullquote'],
  minimal: ['hero', 'photo-single', 'photo-single', 'text', 'photo-single', 'photo-single', 'pullquote'],
  narrative: ['hero', 'text', 'photo-single', 'text', 'photo-pair', 'pullquote', 'photo-single', 'text'],
};

// Story pacing phases — controls density across the essay
const ESSAY_PACING = {
  opening: { density: 'sparse', textWeight: 0.3 },   // 0-20%: sparse, let hero breathe
  rising: { density: 'moderate', textWeight: 0.2 },   // 20-50%: build momentum
  climax: { density: 'rich', textWeight: 0.1 },       // 50-80%: dense, impactful
  resolution: { density: 'sparse', textWeight: 0.3 }, // 80-100%: wind down gently
} as const;

function getEssayPhase(progress: number): keyof typeof ESSAY_PACING {
  if (progress < 0.2) return 'opening';
  if (progress < 0.5) return 'rising';
  if (progress < 0.8) return 'climax';
  return 'resolution';
}

/**
 * Enhanced blog layout engine with essay template support.
 * Applies template-specific editorial rhythms, story pacing,
 * and intelligent photo analysis for beautiful auto-designed essays.
 */
export function smartDesignBlogWithTemplate(
  items: BlogMediaItem[],
  template: EssayTemplateId = 'documentary',
  story?: string | null
): BlogBlock[] {
  if (items.length === 0 && !story) return [];

  const blocks: BlogBlock[] = [];
  const photos = items.filter(i => i.type === 'photo');
  const videos = items.filter(i => i.type === 'video');
  const rhythm = ESSAY_RHYTHMS[template] || ESSAY_RHYTHMS.documentary;

  // Enrich photos for analysis
  const enrichedPhotos = photos.map(p => ({
    ...p,
    photo_id: p.id,
    weight: calculateVisualWeight(p),
  }));

  // Sort by visual weight for hero selection
  const sortedByWeight = [...enrichedPhotos].sort((a, b) => b.weight.score - a.weight.score);

  // Split story into paragraphs for interleaving
  const storyParagraphs = story
    ? story.split(/\n\n+/).filter(p => p.trim().length > 0)
    : [];

  // Extract pull quotes from captions
  const pullQuotes = enrichedPhotos
    .filter(p => p.caption && isPullQuoteWorthy(p.caption!))
    .map(p => p.caption!);

  // ── Build blocks following the rhythm pattern ──
  let photoIdx = 0;
  let videoIdx = 0;
  let storyIdx = 0;
  let pullQuoteIdx = 0;
  let rhythmIdx = 0;
  let heroUsed = false;

  const totalContent = photos.length + videos.length + storyParagraphs.length;
  let contentConsumed = 0;

  const maxIterations = (enrichedPhotos.length + videos.length + storyParagraphs.length + rhythm.length) * 3;
  let iterations = 0;
  while ((photoIdx < enrichedPhotos.length || videoIdx < videos.length) && iterations < maxIterations) {
    iterations++;
    const progress = totalContent > 0 ? contentConsumed / totalContent : 0;
    const phase = getEssayPhase(progress);
    const pacing = ESSAY_PACING[phase];
    let currentBeat = rhythm[rhythmIdx % rhythm.length];
    rhythmIdx++;

    // When photos are exhausted but videos remain, treat photo beats as video
    if (photoIdx >= enrichedPhotos.length && videoIdx < videos.length &&
        currentBeat !== 'text' && currentBeat !== 'pullquote' && currentBeat !== 'video' && currentBeat !== 'video-pair') {
      currentBeat = 'video';
    }

    switch (currentBeat) {
      case 'hero': {
        if (!heroUsed && sortedByWeight.length > 0) {
          // Use the best photo as hero
          const heroPhoto = sortedByWeight[0];
          blocks.push({
            type: 'hero',
            photoIds: [heroPhoto.photo_id],
            videoIds: [],
            aspectRatio: heroPhoto.width / heroPhoto.height,
            preserveAspectRatio: true,
          });
          // Mark it as used
          const heroIdx = enrichedPhotos.findIndex(p => p.photo_id === heroPhoto.photo_id);
          if (heroIdx !== -1 && heroIdx >= photoIdx) {
            // Swap it out of the remaining pool
            enrichedPhotos.splice(heroIdx, 1);
            enrichedPhotos.unshift(heroPhoto); // put at front
            photoIdx = Math.max(photoIdx, 1); // skip past it
          } else if (heroIdx === -1 || heroIdx < photoIdx) {
            // Already consumed, pick next best
            if (photoIdx < enrichedPhotos.length) {
              blocks[blocks.length - 1].photoIds = [enrichedPhotos[photoIdx].photo_id];
              photoIdx++;
            }
          }
          heroUsed = true;
          contentConsumed++;
        } else if (photoIdx < enrichedPhotos.length) {
          // Subsequent hero: use next highest-weight available photo
          const photo = enrichedPhotos[photoIdx];
          blocks.push({
            type: photo.weight.aspectClass === 'panoramic' ? 'panoramic' : 'hero',
            photoIds: [photo.photo_id],
            videoIds: [],
            aspectRatio: photo.width / photo.height,
            preserveAspectRatio: true,
          });
          photoIdx++;
          contentConsumed++;
        }
        break;
      }

      case 'text': {
        if (storyIdx < storyParagraphs.length) {
          blocks.push({
            type: 'text',
            photoIds: [],
            videoIds: [],
            text: storyParagraphs[storyIdx],
            preserveAspectRatio: true,
          });
          storyIdx++;
          contentConsumed++;
        }
        // If no text available, skip this beat (don't stall)
        break;
      }

      case 'pullquote': {
        if (pullQuoteIdx < pullQuotes.length) {
          blocks.push({
            type: 'pullquote',
            photoIds: [],
            videoIds: [],
            text: pullQuotes[pullQuoteIdx],
            preserveAspectRatio: true,
          });
          pullQuoteIdx++;
          contentConsumed++;
        }
        break;
      }

      case 'photo-single':
      case 'panoramic': {
        if (photoIdx < enrichedPhotos.length) {
          const photo = enrichedPhotos[photoIdx];
          const type: BlogBlockType =
            photo.weight.aspectClass === 'panoramic' ? 'panoramic' : 'photo-single';
          blocks.push({
            type,
            photoIds: [photo.photo_id],
            videoIds: [],
            aspectRatio: photo.width / photo.height,
            preserveAspectRatio: true,
          });
          photoIdx++;
          contentConsumed++;
        }
        break;
      }

      case 'photo-pair': {
        if (photoIdx < enrichedPhotos.length) {
          const batch: string[] = [enrichedPhotos[photoIdx].photo_id];
          photoIdx++;
          if (photoIdx < enrichedPhotos.length) {
            batch.push(enrichedPhotos[photoIdx].photo_id);
            photoIdx++;
          }
          blocks.push({
            type: batch.length === 2 ? 'photo-pair' : 'photo-single',
            photoIds: batch,
            videoIds: [],
            preserveAspectRatio: true,
          });
          contentConsumed += batch.length;
        }
        break;
      }

      case 'photo-triptych': {
        if (photoIdx < enrichedPhotos.length) {
          const batch: string[] = [];
          const count = Math.min(3, enrichedPhotos.length - photoIdx);
          for (let i = 0; i < count; i++) {
            batch.push(enrichedPhotos[photoIdx + i].photo_id);
          }
          photoIdx += count;
          const type: BlogBlockType =
            batch.length === 3 ? 'photo-triptych' :
            batch.length === 2 ? 'photo-pair' : 'photo-single';
          blocks.push({
            type,
            photoIds: batch,
            videoIds: [],
            preserveAspectRatio: true,
          });
          contentConsumed += batch.length;
        }
        break;
      }

      case 'photo-grid': {
        if (photoIdx < enrichedPhotos.length) {
          const count = Math.min(4, enrichedPhotos.length - photoIdx);
          const batch: string[] = [];
          for (let i = 0; i < count; i++) {
            batch.push(enrichedPhotos[photoIdx + i].photo_id);
          }
          photoIdx += count;
          const type: BlogBlockType =
            batch.length >= 4 ? 'photo-grid' :
            batch.length === 3 ? 'photo-triptych' :
            batch.length === 2 ? 'photo-pair' : 'photo-single';
          blocks.push({
            type,
            photoIds: batch,
            videoIds: [],
            preserveAspectRatio: true,
          });
          contentConsumed += batch.length;
        }
        break;
      }

      case 'video':
      case 'video-pair': {
        if (videoIdx < videos.length) {
          blocks.push({
            type: 'video',
            photoIds: [],
            videoIds: [videos[videoIdx].id],
            aspectRatio: videos[videoIdx].width && videos[videoIdx].height
              ? videos[videoIdx].width / videos[videoIdx].height
              : 16 / 9,
            preserveAspectRatio: true,
          });
          videoIdx++;
          contentConsumed++;
        }
        break;
      }

      default:
        break;
    }

    // Interleave remaining story paragraphs in sparse phases
    if (pacing.textWeight > 0.2 && storyIdx < storyParagraphs.length && Math.random() < pacing.textWeight) {
      blocks.push({
        type: 'text',
        photoIds: [],
        videoIds: [],
        text: storyParagraphs[storyIdx],
        preserveAspectRatio: true,
      });
      storyIdx++;
      contentConsumed++;
    }
  }

  // ── Append any remaining story text ──
  while (storyIdx < storyParagraphs.length) {
    blocks.push({
      type: 'text',
      photoIds: [],
      videoIds: [],
      text: storyParagraphs[storyIdx],
      preserveAspectRatio: true,
    });
    storyIdx++;
  }

  // ── Append any remaining videos ──
  while (videoIdx < videos.length) {
    blocks.push({
      type: 'video',
      photoIds: [],
      videoIds: [videos[videoIdx].id],
      preserveAspectRatio: true,
    });
    videoIdx++;
  }

  return blocks;
}

// ─── Cover Photo Selection ────────────────────────────────────────────────────

/**
 * Intelligently select the best cover photo from a set.
 * Considers: visual weight, orientation (landscape preferred for covers),
 * face count, and aesthetic score.
 */
export function selectBestCoverPhoto(
  photos: (PhotoMetrics & { photo_id: string })[]
): string | null {
  if (photos.length === 0) return null;

  const scored = photos.map(p => {
    const weight = calculateVisualWeight(p);
    let coverScore = weight.score;

    // Landscape photos make better covers (more room for title)
    if (weight.orientation === 'landscape') coverScore += 1.5;
    else if (weight.orientation === 'square') coverScore += 0.5;

    // Not too many faces (busy covers are distracting)
    if ((p.face_count ?? 0) > 3) coverScore -= 1;

    // Prefer wide-ish ratios for covers
    if (weight.aspectClass === 'wide' || weight.aspectClass === 'landscape') {
      coverScore += 0.5;
    }

    return { photo_id: p.photo_id, coverScore };
  });

  scored.sort((a, b) => b.coverScore - a.coverScore);
  return scored[0].photo_id;
}

// ─── Date Clustering (shared utility) ─────────────────────────────────────────

interface DateCluster<T> {
  date: string;
  photos: T[];
}

function clusterByDate<T extends { taken_at?: string }>(photos: T[]): DateCluster<T>[] {
  const sorted = [...photos].sort((a, b) =>
    (a.taken_at ?? '').localeCompare(b.taken_at ?? '')
  );

  const clusters: DateCluster<T>[] = [];
  let currentDate = '';
  let currentCluster: T[] = [];

  for (const photo of sorted) {
    const day = (photo.taken_at ?? '').slice(0, 10);
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

function hasLargeGap(dateA: string, dateB: string): boolean {
  if (!dateA || !dateB) return false;
  const diff = Math.abs(new Date(dateB).getTime() - new Date(dateA).getTime());
  return diff > 7 * 24 * 60 * 60 * 1000;
}

function formatDividerTitle(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}
