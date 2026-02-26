// Page template library (shared between books and magazines)
// Smart Design System: Aspect-ratio-aware layouts that never crop photos.

import type { AspectRatioClass, Orientation } from '@/lib/design/photo-analysis';

export interface LayoutTemplate {
  id: string;
  name: string;
  slots: number;
  grid: string;
  hasCaption?: boolean;
  hasTitle?: boolean;
  /**
   * When true, photos in this layout should use object-contain (no crop)
   * with intentional background/whitespace around them.
   */
  preserveAspectRatio?: boolean;
  /**
   * CSS object-fit to use for photos in this layout.
   * 'contain' = no crop, shows full photo with letterboxing.
   * 'cover' = fills the slot, may crop edges.
   * Default: 'contain' (the smart design system default — no cropping).
   */
  objectFit?: 'contain' | 'cover';
  /**
   * Recommended photo orientations for this layout.
   * Helps the engine pick the right layout for the right photos.
   */
  bestFor?: Orientation[];
  /**
   * Padding inside the photo area (CSS padding string).
   * Used to create intentional whitespace around photos.
   */
  innerPadding?: string;
}

// ─── Layout Templates ─────────────────────────────────────────────────────────
// Each template is designed for specific photo orientations and counts.
// The smart design engine picks the best template for each page.

export const PAGE_TEMPLATES: Record<string, LayoutTemplate> = {
  // ── Single-photo layouts ──────────────────────────────────────────────────

  full_bleed: {
    id: 'full_bleed',
    name: 'Full Bleed',
    slots: 1,
    grid: '1fr / 1fr',
    objectFit: 'cover',
    bestFor: ['landscape', 'square'],
  },

  hero_portrait: {
    id: 'hero_portrait',
    name: 'Hero Portrait',
    slots: 1,
    grid: '1fr / 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '8% 15%',
    bestFor: ['portrait'],
  },

  hero_landscape: {
    id: 'hero_landscape',
    name: 'Hero Landscape',
    slots: 1,
    grid: '1fr / 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '12% 5%',
    bestFor: ['landscape'],
  },

  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    slots: 1,
    grid: '1fr / 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '20% 3%',
    bestFor: ['landscape'],
  },

  caption_heavy: {
    id: 'caption_heavy',
    name: 'Caption Spread',
    slots: 1,
    grid: '3fr 2fr / 1fr',
    hasCaption: true,
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '5% 8%',
    bestFor: ['portrait', 'landscape', 'square'],
  },

  pullquote: {
    id: 'pullquote',
    name: 'Pull Quote',
    slots: 1,
    grid: '1fr / 1fr 1fr',
    hasCaption: true,
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '8%',
    bestFor: ['portrait', 'square'],
  },

  // ── Two-photo layouts ─────────────────────────────────────────────────────

  two_up_vertical: {
    id: 'two_up_vertical',
    name: 'Two Up Stacked',
    slots: 2,
    grid: '1fr 1fr / 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '3%',
    bestFor: ['landscape'],
  },

  two_up_horizontal: {
    id: 'two_up_horizontal',
    name: 'Two Up Side by Side',
    slots: 2,
    grid: '1fr / 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '5% 3%',
    bestFor: ['portrait'],
  },

  duo_matched: {
    id: 'duo_matched',
    name: 'Duo Matched',
    slots: 2,
    grid: '1fr / 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '8% 4%',
    bestFor: ['portrait', 'square'],
  },

  asymmetric_pair: {
    id: 'asymmetric_pair',
    name: 'Asymmetric Pair',
    slots: 2,
    grid: '1fr / 2fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '5%',
    bestFor: ['landscape', 'square'],
  },

  // ── Three-photo layouts ───────────────────────────────────────────────────

  three_up_top_heavy: {
    id: 'three_up_top_heavy',
    name: 'Feature + Two',
    slots: 3,
    grid: '3fr 2fr / 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '3%',
    bestFor: ['landscape', 'square'],
  },

  triptych: {
    id: 'triptych',
    name: 'Triptych',
    slots: 3,
    grid: '1fr / 1fr 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '8% 2%',
    bestFor: ['portrait'],
  },

  // ── Four-photo layouts ────────────────────────────────────────────────────

  four_up_grid: {
    id: 'four_up_grid',
    name: 'Grid',
    slots: 4,
    grid: '1fr 1fr / 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '3%',
    bestFor: ['square', 'landscape', 'portrait'],
  },

  gallery_strip: {
    id: 'gallery_strip',
    name: 'Gallery Strip',
    slots: 4,
    grid: '1fr / 1fr 1fr 1fr 1fr',
    preserveAspectRatio: true,
    objectFit: 'contain',
    innerPadding: '15% 2%',
    bestFor: ['portrait', 'square'],
  },

  // ── Text/divider layouts ──────────────────────────────────────────────────

  text_page: {
    id: 'text_page',
    name: 'Text Page',
    slots: 0,
    grid: '1fr / 1fr',
    hasCaption: true,
  },

  story_page: {
    id: 'story_page',
    name: 'Story Page',
    slots: 0,
    grid: '1fr / 1fr',
    hasCaption: true,
    hasTitle: true,
  },

  section_divider: {
    id: 'section_divider',
    name: 'Section Divider',
    slots: 0,
    grid: '1fr / 1fr',
    hasTitle: true,
  },
};

export type LayoutTemplateId = keyof typeof PAGE_TEMPLATES;

export type SmartLayoutId = LayoutTemplateId;

// ─── Legacy Layout Selector ───────────────────────────────────────────────────
// Preserved for backward compatibility. New code should use selectSmartLayout.

export function selectLayout(
  photoCount: number,
  orientations: ('portrait' | 'landscape')[]
): LayoutTemplateId {
  if (photoCount === 0) return 'text_page';
  if (photoCount === 1) {
    return 'full_bleed';
  }
  if (photoCount === 2) {
    const allLandscape = orientations.every((o) => o === 'landscape');
    return allLandscape ? 'two_up_vertical' : 'two_up_horizontal';
  }
  if (photoCount === 3) return 'three_up_top_heavy';
  return 'four_up_grid';
}

// ─── Smart Layout Selector ────────────────────────────────────────────────────
// Picks the best layout based on photo count, orientations, aspect ratios,
// and what's been used recently (to avoid repetition).

export function selectSmartLayout(
  photoCount: number,
  orientations: Orientation[],
  aspectClasses: AspectRatioClass[],
  recentLayouts: string[]
): SmartLayoutId {
  if (photoCount === 0) return 'text_page';

  const lastLayout = recentLayouts.length > 0 ? recentLayouts[recentLayouts.length - 1] : '';

  // ── Single photo ──
  if (photoCount === 1) {
    const orientation = orientations[0] ?? 'landscape';
    const aspectClass = aspectClasses[0] ?? 'landscape';

    // Panoramic → cinematic (lots of vertical whitespace)
    if (aspectClass === 'panoramic') return 'cinematic';

    // Wide → hero landscape
    if (aspectClass === 'wide') {
      return lastLayout === 'hero_landscape' ? 'full_bleed' : 'hero_landscape';
    }

    // Portrait → hero portrait (centered with margins, no crop)
    if (orientation === 'portrait') {
      return lastLayout === 'hero_portrait' ? 'caption_heavy' : 'hero_portrait';
    }

    // Landscape → alternate between hero_landscape and full_bleed
    if (orientation === 'landscape') {
      return lastLayout === 'hero_landscape' ? 'full_bleed' : 'hero_landscape';
    }

    // Square → full_bleed works great
    return lastLayout === 'full_bleed' ? 'hero_landscape' : 'full_bleed';
  }

  // ── Two photos ──
  if (photoCount === 2) {
    const allPortrait = orientations.every(o => o === 'portrait');
    const allLandscape = orientations.every(o => o === 'landscape');

    if (allPortrait) {
      // Two portraits side-by-side
      const options: SmartLayoutId[] = ['duo_matched', 'two_up_horizontal'];
      return pickFresh(options, lastLayout);
    }

    if (allLandscape) {
      // Two landscapes stacked
      const options: SmartLayoutId[] = ['two_up_vertical', 'asymmetric_pair'];
      return pickFresh(options, lastLayout);
    }

    // Mixed orientations → asymmetric pair (larger one gets more space)
    return lastLayout === 'asymmetric_pair' ? 'two_up_horizontal' : 'asymmetric_pair';
  }

  // ── Three photos ──
  if (photoCount === 3) {
    const allPortrait = orientations.every(o => o === 'portrait');

    if (allPortrait) {
      return lastLayout === 'triptych' ? 'three_up_top_heavy' : 'triptych';
    }

    return lastLayout === 'three_up_top_heavy' ? 'triptych' : 'three_up_top_heavy';
  }

  // ── Four photos ──
  const allPortrait = orientations.every(o => o === 'portrait');
  if (allPortrait) {
    return lastLayout === 'gallery_strip' ? 'four_up_grid' : 'gallery_strip';
  }

  return lastLayout === 'four_up_grid' ? 'gallery_strip' : 'four_up_grid';
}

function pickFresh(options: SmartLayoutId[], avoid: string): SmartLayoutId {
  for (const opt of options) {
    if (opt !== avoid) return opt;
  }
  return options[0];
}

// ─── Grid CSS ─────────────────────────────────────────────────────────────────
// Returns CSS grid properties for rendering a layout template.

export function getGridCSS(templateId: string): {
  gridTemplateRows: string;
  gridTemplateColumns: string;
} {
  const template = PAGE_TEMPLATES[templateId];
  if (!template) {
    return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr' };
  }
  const [rows, cols] = template.grid.split(' / ');
  return {
    gridTemplateRows: rows || '1fr',
    gridTemplateColumns: cols || '1fr',
  };
}

/**
 * Get the full layout configuration for a template.
 * Used by renderers to apply proper styling (padding, object-fit, etc.).
 */
export function getLayoutConfig(templateId: string): LayoutTemplate {
  return PAGE_TEMPLATES[templateId] ?? PAGE_TEMPLATES.full_bleed;
}
