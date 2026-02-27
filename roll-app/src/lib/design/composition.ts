// Smart Design System — Composition Rules
// Controls whitespace, visual rhythm, spread balance, and story pacing.
// These rules ensure every page feels intentional and every spread is balanced.

import type { AspectRatioClass, Orientation, PhotoMetrics } from './photo-analysis';
import { calculateVisualWeight } from './photo-analysis';

// ─── Page Density ─────────────────────────────────────────────────────────────
// Controls how "full" a page feels. Low density = more whitespace = more luxurious.

export type PageDensity = 'minimal' | 'light' | 'moderate' | 'rich';

export const DENSITY_CONFIG: Record<PageDensity, {
  maxPhotosPerPage: number;
  photoAreaPercent: number;  // Max % of page area occupied by photos
  minMarginPercent: number;  // Min margin around content (% of page dimension)
  gutterPercent: number;     // Space between photos (% of page dimension)
}> = {
  minimal: {
    maxPhotosPerPage: 1,
    photoAreaPercent: 65,
    minMarginPercent: 10,
    gutterPercent: 0,
  },
  light: {
    maxPhotosPerPage: 2,
    photoAreaPercent: 75,
    minMarginPercent: 6,
    gutterPercent: 2,
  },
  moderate: {
    maxPhotosPerPage: 3,
    photoAreaPercent: 85,
    minMarginPercent: 4,
    gutterPercent: 1.5,
  },
  rich: {
    maxPhotosPerPage: 4,
    photoAreaPercent: 92,
    minMarginPercent: 2.5,
    gutterPercent: 1,
  },
};

// ─── Visual Rhythm ────────────────────────────────────────────────────────────
// Ensures the sequence of pages has variation — never too many dense or sparse
// pages in a row. Like music, layouts need tension and release.

export type RhythmBeat = 'hero' | 'pair' | 'grid' | 'breath' | 'text';

/**
 * Rhythm pattern for a beautiful magazine sequence.
 * The pattern repeats, creating a predictable but varied visual flow:
 *   Hero (impact) → Pair (development) → Breath (rest) → Grid (richness) → Pair → Breath
 * This mirrors editorial magazine design where openings are dramatic,
 * followed by supporting content, with deliberate pauses.
 */
export const EDITORIAL_RHYTHM: RhythmBeat[] = [
  'hero',    // Opening: dramatic single image
  'pair',    // Development: two related images
  'breath',  // Rest: caption-heavy or whitespace
  'grid',    // Richness: 3–4 images showing range
  'pair',    // Continue: another pairing
  'breath',  // Rest again
];

/**
 * Given the position in a sequence, return the ideal rhythm beat.
 * This guides the layout engine to create natural visual flow.
 */
export function getRhythmBeat(pageIndex: number, sectionLength: number): RhythmBeat {
  // First page of a section is always a hero
  if (pageIndex === 0) return 'hero';

  // Last page should be a hero or breath (strong ending)
  if (pageIndex === sectionLength - 1) {
    return sectionLength > 3 ? 'hero' : 'breath';
  }

  // Middle pages follow the rhythm pattern
  const rhythmIndex = (pageIndex - 1) % EDITORIAL_RHYTHM.length;
  return EDITORIAL_RHYTHM[rhythmIndex];
}

/**
 * Translate a rhythm beat into a layout density recommendation.
 */
export function rhythmToDensity(beat: RhythmBeat): PageDensity {
  switch (beat) {
    case 'hero': return 'minimal';
    case 'pair': return 'light';
    case 'grid': return 'moderate';
    case 'breath': return 'minimal';
    case 'text': return 'minimal';
  }
}

// ─── Spread Balance ───────────────────────────────────────────────────────────
// In a two-page spread, the visual weight of left and right pages should feel
// balanced. A heavy left page with a light right page feels lopsided.

export interface SpreadBalance {
  leftWeight: number;
  rightWeight: number;
  isBalanced: boolean;
  suggestion: 'balanced' | 'swap' | 'add-whitespace-left' | 'add-whitespace-right';
}

/**
 * Evaluate if a two-page spread feels visually balanced.
 * Weight considers both photo count and individual photo visual weights.
 */
export function evaluateSpreadBalance(
  leftPhotos: PhotoMetrics[],
  rightPhotos: PhotoMetrics[]
): SpreadBalance {
  const leftWeight = leftPhotos.reduce(
    (sum, p) => sum + calculateVisualWeight(p).score, 0
  );
  const rightWeight = rightPhotos.reduce(
    (sum, p) => sum + calculateVisualWeight(p).score, 0
  );

  const diff = Math.abs(leftWeight - rightWeight);
  const total = leftWeight + rightWeight;
  const imbalanceRatio = total > 0 ? diff / total : 0;

  // Allow up to 30% imbalance (some asymmetry is beautiful)
  const isBalanced = imbalanceRatio < 0.3;

  let suggestion: SpreadBalance['suggestion'] = 'balanced';
  if (!isBalanced) {
    if (leftWeight > rightWeight * 1.5) {
      suggestion = 'add-whitespace-left';
    } else if (rightWeight > leftWeight * 1.5) {
      suggestion = 'add-whitespace-right';
    } else {
      suggestion = 'swap';
    }
  }

  return { leftWeight, rightWeight, isBalanced, suggestion };
}

// ─── Story Pacing ─────────────────────────────────────────────────────────────
// For magazines and books, the overall flow should follow a narrative arc.
// Opening: Strong hero image(s) to draw the reader in.
// Rising: Building content, increasing density.
// Climax: Most impactful spread(s) in the middle third.
// Resolution: Gentle wind-down, breathing room, reflection.

export type StoryPhase = 'opening' | 'rising' | 'climax' | 'resolution';

/**
 * Determine what story phase a page belongs to, based on its position
 * within the total page count.
 */
export function getStoryPhase(pageIndex: number, totalPages: number): StoryPhase {
  if (totalPages <= 4) return 'climax'; // Short story: everything matters

  const position = pageIndex / totalPages;
  if (position < 0.15) return 'opening';
  if (position < 0.45) return 'rising';
  if (position < 0.75) return 'climax';
  return 'resolution';
}

/**
 * Get the recommended maximum density for a story phase.
 * Opening and resolution are sparser; climax is richer.
 */
export function getPhaseMaxDensity(phase: StoryPhase): PageDensity {
  switch (phase) {
    case 'opening': return 'light';
    case 'rising': return 'moderate';
    case 'climax': return 'rich';
    case 'resolution': return 'light';
  }
}

// ─── Layout Diversity ─────────────────────────────────────────────────────────
// Prevent repetitive layouts. Track what's been used recently and suggest alternatives.

export interface LayoutHistory {
  recentLayouts: string[];
  maxHistory: number;
}

export function createLayoutHistory(maxHistory: number = 4): LayoutHistory {
  return { recentLayouts: [], maxHistory };
}

/**
 * Record a layout choice and return whether it would be repetitive.
 */
export function recordLayout(history: LayoutHistory, layout: string): boolean {
  const isRepetitive = history.recentLayouts.length > 0 &&
    history.recentLayouts[history.recentLayouts.length - 1] === layout;

  history.recentLayouts.push(layout);
  if (history.recentLayouts.length > history.maxHistory) {
    history.recentLayouts.shift();
  }

  return isRepetitive;
}

/**
 * Check if a layout has been used too recently (within last N pages).
 */
export function isLayoutStale(history: LayoutHistory, layout: string): boolean {
  // Same layout as immediately previous page → stale
  if (history.recentLayouts.length > 0 &&
    history.recentLayouts[history.recentLayouts.length - 1] === layout) {
    return true;
  }
  // Same layout used 2+ times in recent history → stale
  const recentCount = history.recentLayouts.filter(l => l === layout).length;
  return recentCount >= 2;
}

// ─── Orientation Harmony ──────────────────────────────────────────────────────
// Rules for mixing orientations within a single page.

/**
 * Determine if a mix of orientations works on a single page.
 * Mixing portrait and landscape on the same page creates awkward gaps.
 * Only square photos are universal mixers.
 */
export function isOrientationHarmonious(
  orientations: Orientation[]
): boolean {
  if (orientations.length <= 1) return true;

  const hasPortrait = orientations.includes('portrait');
  const hasLandscape = orientations.includes('landscape');

  // Mixing portrait and landscape is dissonant
  return !(hasPortrait && hasLandscape);
}

// ─── Whitespace Budget ────────────────────────────────────────────────────────
// Allocate whitespace across a spread based on content needs.

export interface WhitespaceBudget {
  topMarginPercent: number;
  bottomMarginPercent: number;
  sideMarginPercent: number;
  captionAreaPercent: number;
  totalWhitespacePercent: number;
}

/**
 * Calculate ideal whitespace distribution for a page.
 * More whitespace = more luxurious, editorial feel.
 * Hero images get generous margins; dense grids get minimal margins.
 */
export function calculateWhitespaceBudget(
  density: PageDensity,
  hasCaption: boolean,
  aspectClass: AspectRatioClass
): WhitespaceBudget {
  const config = DENSITY_CONFIG[density];
  const whitePercent = 100 - config.photoAreaPercent;

  // Panoramic photos need more vertical whitespace
  const isPanoramic = aspectClass === 'panoramic' || aspectClass === 'wide';

  let topMargin = whitePercent * 0.3;
  let bottomMargin = whitePercent * 0.3;
  let sideMargin = config.minMarginPercent;
  let captionArea = 0;

  if (hasCaption) {
    captionArea = whitePercent * 0.25;
    bottomMargin = whitePercent * 0.15;
  }

  if (isPanoramic) {
    // Center panoramic images vertically with generous top/bottom
    topMargin = whitePercent * 0.35;
    bottomMargin = whitePercent * 0.35;
    sideMargin = config.minMarginPercent * 0.5; // Panoramics extend wider
  }

  return {
    topMarginPercent: Math.max(topMargin, config.minMarginPercent),
    bottomMarginPercent: Math.max(bottomMargin, config.minMarginPercent),
    sideMarginPercent: Math.max(sideMargin, config.minMarginPercent),
    captionAreaPercent: captionArea,
    totalWhitespacePercent: whitePercent,
  };
}

// ─── Color Adjacency ──────────────────────────────────────────────────────────
// Simple rules for placing photos next to each other based on scene classification.
// Photos with similar moods/scenes pair better than contrasting ones.

const SCENE_COMPATIBILITY: Record<string, string[]> = {
  landscape: ['sky', 'landscape', 'warm'],
  sky: ['landscape', 'sky'],
  warm: ['warm', 'indoor', 'landscape'],
  indoor: ['indoor', 'warm'],
};

/**
 * Score how well two photos pair visually based on their scene classifications.
 * Returns 0–1 where 1 is perfect pairing.
 */
export function scoreSceneAdjacency(
  scenesA: string[],
  scenesB: string[]
): number {
  if (scenesA.length === 0 || scenesB.length === 0) return 0.5; // Neutral

  let matches = 0;
  for (const scene of scenesA) {
    const compatible = SCENE_COMPATIBILITY[scene] ?? [];
    for (const other of scenesB) {
      if (compatible.includes(other) || scene === other) {
        matches++;
      }
    }
  }

  return Math.min(1, matches / Math.max(scenesA.length, scenesB.length));
}
