// Page template library (shared between books and magazines)
// Phase 3.3: Auto-Layout Engine

export interface LayoutTemplate {
  id: string;
  name: string;
  slots: number;
  grid: string;
  hasCaption?: boolean;
  hasTitle?: boolean;
}

export const PAGE_TEMPLATES: Record<string, LayoutTemplate> = {
  full_bleed: {
    id: 'full_bleed',
    name: 'Full Bleed',
    slots: 1,
    grid: '1fr / 1fr',
  },
  two_up_vertical: {
    id: 'two_up_vertical',
    name: 'Two Up Vertical',
    slots: 2,
    grid: '1fr 1fr / 1fr',
  },
  two_up_horizontal: {
    id: 'two_up_horizontal',
    name: 'Two Up Horizontal',
    slots: 2,
    grid: '1fr / 1fr 1fr',
  },
  three_up_top_heavy: {
    id: 'three_up_top_heavy',
    name: 'Three Up (Top Heavy)',
    slots: 3,
    grid: '2fr 1fr / 1fr 1fr',
  },
  four_up_grid: {
    id: 'four_up_grid',
    name: 'Four Up Grid',
    slots: 4,
    grid: '1fr 1fr / 1fr 1fr',
  },
  caption_heavy: {
    id: 'caption_heavy',
    name: 'Caption Heavy',
    slots: 1,
    grid: '2fr 1fr / 1fr',
    hasCaption: true,
  },
  text_page: {
    id: 'text_page',
    name: 'Text Page',
    slots: 0,
    grid: '1fr / 1fr',
    hasCaption: true,
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

/**
 * Select the best layout template based on the number of photos and their orientations.
 */
export function selectLayout(
  photoCount: number,
  orientations: ('portrait' | 'landscape')[]
): LayoutTemplateId {
  if (photoCount === 0) return 'text_page';
  if (photoCount === 1) {
    // Portrait photos look better full-bleed; landscape too
    return 'full_bleed';
  }
  if (photoCount === 2) {
    const allLandscape = orientations.every((o) => o === 'landscape');
    return allLandscape ? 'two_up_vertical' : 'two_up_horizontal';
  }
  if (photoCount === 3) return 'three_up_top_heavy';
  return 'four_up_grid';
}

/**
 * Return CSS grid template string for rendering a layout.
 */
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
