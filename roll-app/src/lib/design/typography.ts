// Smart Design System — Typography Rules
// Beautiful typography that adapts to context, never competes with imagery.

import type { MagazineFont } from '@/types/magazine';

// ─── Type Scale ───────────────────────────────────────────────────────────────
// A modular type scale based on a 1.25 ratio (Major Third).
// Each step up multiplies by 1.25, giving a harmonious progression.

export const TYPE_SCALE = {
  caption: { size: '0.75rem', lineHeight: 1.5, tracking: '0.01em' },
  small: { size: '0.875rem', lineHeight: 1.55, tracking: '0.005em' },
  body: { size: '1rem', lineHeight: 1.65, tracking: '0' },
  lead: { size: '1.125rem', lineHeight: 1.55, tracking: '-0.005em' },
  subheading: { size: '1.25rem', lineHeight: 1.4, tracking: '-0.01em' },
  heading: { size: '1.5rem', lineHeight: 1.3, tracking: '-0.015em' },
  display: { size: '2rem', lineHeight: 1.2, tracking: '-0.02em' },
  hero: { size: '2.5rem', lineHeight: 1.1, tracking: '-0.025em' },
  title: { size: '3.5rem', lineHeight: 1.05, tracking: '-0.03em' },
} as const;

export type TypeScaleStep = keyof typeof TYPE_SCALE;

// ─── Font Pairing Rules ──────────────────────────────────────────────────────
// Each magazine font choice has specific pairing and styling rules.
// Display fonts handle titles/headings, body fonts handle running text.

export interface FontPairing {
  display: string;
  body: string;
  mono: string;
  captionStyle: 'italic' | 'normal';
  captionWeight: number;
  headingWeight: number;
  titleTransform: 'none' | 'uppercase';
  pageNumberStyle: 'mono' | 'body';
}

export const FONT_PAIRINGS: Record<MagazineFont, FontPairing> = {
  default: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
    captionStyle: 'italic',
    captionWeight: 400,
    headingWeight: 500,
    titleTransform: 'none',
    pageNumberStyle: 'mono',
  },
  garamond: {
    display: 'Cormorant Garamond, serif',
    body: 'Cormorant Garamond, serif',
    mono: 'var(--font-mono)',
    captionStyle: 'italic',
    captionWeight: 400,
    headingWeight: 600,
    titleTransform: 'none',
    pageNumberStyle: 'body',
  },
  futura: {
    display: 'Futura, sans-serif',
    body: 'Futura, sans-serif',
    mono: 'var(--font-mono)',
    captionStyle: 'normal',
    captionWeight: 300,
    headingWeight: 700,
    titleTransform: 'uppercase',
    pageNumberStyle: 'mono',
  },
  courier: {
    display: 'Courier Prime, Courier, monospace',
    body: 'Courier Prime, Courier, monospace',
    mono: 'Courier Prime, Courier, monospace',
    captionStyle: 'normal',
    captionWeight: 400,
    headingWeight: 700,
    titleTransform: 'none',
    pageNumberStyle: 'mono',
  },
  playfair: {
    display: 'Playfair Display, serif',
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
    captionStyle: 'italic',
    captionWeight: 400,
    headingWeight: 700,
    titleTransform: 'none',
    pageNumberStyle: 'body',
  },
  lora: {
    display: 'Lora, serif',
    body: 'Lora, serif',
    mono: 'var(--font-mono)',
    captionStyle: 'italic',
    captionWeight: 400,
    headingWeight: 600,
    titleTransform: 'none',
    pageNumberStyle: 'body',
  },
  jakarta: {
    display: 'Plus Jakarta Sans, sans-serif',
    body: 'Plus Jakarta Sans, sans-serif',
    mono: 'var(--font-mono)',
    captionStyle: 'normal',
    captionWeight: 400,
    headingWeight: 600,
    titleTransform: 'none',
    pageNumberStyle: 'mono',
  },
  baskerville: {
    display: 'Libre Baskerville, Baskerville, serif',
    body: 'Libre Baskerville, Baskerville, serif',
    mono: 'var(--font-mono)',
    captionStyle: 'italic',
    captionWeight: 400,
    headingWeight: 700,
    titleTransform: 'none',
    pageNumberStyle: 'body',
  },
};

export function getFontPairing(font: MagazineFont): FontPairing {
  return FONT_PAIRINGS[font] ?? FONT_PAIRINGS.default;
}

// ─── Caption Formatting ──────────────────────────────────────────────────────
// Rules for how captions should be styled based on context.

export type CaptionPlacement =
  | 'below'           // Below the photo, left-aligned
  | 'below-centered'  // Below the photo, centered (for single hero images)
  | 'overlay-bottom'  // Overlaid on the bottom of the photo
  | 'sidebar'         // In a sidebar next to the photo
  | 'none';           // No caption displayed

export interface CaptionStyle {
  placement: CaptionPlacement;
  maxLines: number;
  showAutomaticCaptions: boolean;
}

/**
 * Determine caption placement based on layout context.
 * Hero/full-bleed images: centered below or overlaid.
 * Multi-photo layouts: compact below.
 * Caption-heavy layouts: sidebar with room to breathe.
 */
export function getCaptionStyle(
  layout: string,
  captionLength: number,
  photosOnPage: number
): CaptionStyle {
  // No caption text → no caption
  if (captionLength === 0) {
    return { placement: 'none', maxLines: 0, showAutomaticCaptions: false };
  }

  // Caption-heavy or pullquote layouts: sidebar with generous space
  if (layout === 'caption_heavy' || layout === 'pullquote') {
    return { placement: 'sidebar', maxLines: 12, showAutomaticCaptions: true };
  }

  // Full-bleed hero images: centered below for editorial feel
  if (layout === 'full_bleed' || layout === 'hero_portrait' || layout === 'hero_landscape' || layout === 'cinematic') {
    return { placement: 'below-centered', maxLines: 3, showAutomaticCaptions: true };
  }

  // Multi-photo pages: compact below, don't steal focus
  if (photosOnPage >= 3) {
    return { placement: 'none', maxLines: 0, showAutomaticCaptions: false };
  }

  // Default: below the photo
  return { placement: 'below', maxLines: 2, showAutomaticCaptions: true };
}

// ─── Text Sizing for Print ───────────────────────────────────────────────────
// Ensures text is legible at different magazine/book formats.

export interface PrintTextSizing {
  captionPt: number;
  bodyPt: number;
  headingPt: number;
  titlePt: number;
  pageNumberPt: number;
}

export function getPrintTextSizing(format: string): PrintTextSizing {
  if (format === '10x10') {
    return { captionPt: 8, bodyPt: 10, headingPt: 16, titlePt: 28, pageNumberPt: 7 };
  }
  if (format === '8x10') {
    return { captionPt: 7.5, bodyPt: 9.5, headingPt: 14, titlePt: 24, pageNumberPt: 6.5 };
  }
  // 6x9 (default magazine)
  return { captionPt: 7, bodyPt: 9, headingPt: 13, titlePt: 22, pageNumberPt: 6 };
}

// ─── Pull Quote Detection ────────────────────────────────────────────────────
// Identify captions that are strong enough to be displayed as pull quotes.

export function isPullQuoteWorthy(caption: string): boolean {
  if (!caption) return false;
  const trimmed = caption.trim();
  // Pull-quote worthy: 40–200 characters, not a sentence fragment
  return trimmed.length >= 40 && trimmed.length <= 200;
}

// ─── Typographic Spacing ─────────────────────────────────────────────────────
// Spacing rules that ensure consistent, professional layouts.

export const SPACING = {
  // Minimum margin between photo and caption (% of page height)
  captionGap: 2.5,
  // Minimum margin from page edge to content (% of page width)
  pageMargin: {
    print: 5,      // Print needs bleed margins
    screen: 3,     // Screen can be tighter
  },
  // Space between photos in multi-photo layouts (% of page width)
  photoGutter: {
    tight: 1,      // Minimal gap for intentional grid look
    normal: 2,     // Standard breathing room
    loose: 4,      // Editorial, generous spacing
  },
  // Space between sections in books/magazines
  sectionBreak: 8, // % of page height
} as const;
