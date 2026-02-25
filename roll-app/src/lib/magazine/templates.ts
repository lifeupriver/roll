// Magazine template definitions
// Phase 3.1

import type { MagazineTemplate } from '@/types/magazine';

export interface MagazineTemplateConfig {
  id: MagazineTemplate;
  name: string;
  description: string;
  defaultDateRangeMonths: number;
  suggestedPageCount: number;
  icon: string;
}

export const MAGAZINE_TEMPLATES: MagazineTemplateConfig[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Your best moments from this month, auto-curated from favorites',
    defaultDateRangeMonths: 1,
    suggestedPageCount: 24,
    icon: 'Calendar',
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    description: 'Three months of memories in one beautiful magazine',
    defaultDateRangeMonths: 3,
    suggestedPageCount: 36,
    icon: 'Layers',
  },
  {
    id: 'annual',
    name: 'Annual',
    description: 'Your year in review — every season, every milestone',
    defaultDateRangeMonths: 12,
    suggestedPageCount: 48,
    icon: 'Star',
  },
  {
    id: 'baby_first_year',
    name: "Baby's First Year",
    description: '12 monthly sections documenting your baby\'s first year',
    defaultDateRangeMonths: 12,
    suggestedPageCount: 48,
    icon: 'Heart',
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'A single trip or vacation captured in print',
    defaultDateRangeMonths: 1,
    suggestedPageCount: 24,
    icon: 'MapPin',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch and build your own magazine',
    defaultDateRangeMonths: 0,
    suggestedPageCount: 24,
    icon: 'Palette',
  },
];

export function getTemplateConfig(templateId: MagazineTemplate): MagazineTemplateConfig {
  return MAGAZINE_TEMPLATES.find((t) => t.id === templateId) ?? MAGAZINE_TEMPLATES[0];
}

/**
 * Calculate default date range from a template.
 */
export function getDefaultDateRange(
  templateId: MagazineTemplate
): { start: Date; end: Date } {
  const config = getTemplateConfig(templateId);
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - config.defaultDateRangeMonths);
  return { start, end };
}
