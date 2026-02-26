import type { BookPage } from '@/types/book';
import type { MagazinePage } from '@/types/magazine';
import { smartAssembleBook } from '@/lib/design/design-engine';

interface MagazineForAssembly {
  id: string;
  title: string;
  date_range_start: string | null;
  date_range_end: string | null;
  pages: MagazinePage[];
}

interface AssembledBook {
  pages: BookPage[];
  totalPages: number;
}

/**
 * Assemble a book from selected magazines.
 * Uses the Smart Design System to create:
 *   cover → half-title → TOC → magazine sections (with breathing pages) → back cover.
 *
 * The smart engine ensures:
 * - Clean section transitions with intentional whitespace
 * - Consistent typography across magazine sections
 * - Proper page numbering
 * - Spread balance at section boundaries
 */
export function assembleBook(
  title: string,
  coverPhotoId: string | null,
  magazines: MagazineForAssembly[]
): AssembledBook {
  return smartAssembleBook(title, coverPhotoId, magazines);
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}

/**
 * Calculate book price based on format and page count.
 */
export function calculateBookPrice(format: string, pageCount: number): number {
  if (format === '10x10') {
    if (pageCount <= 120) return 4999;
    if (pageCount <= 200) return 5999;
    return 6999;
  }
  // 8x10
  if (pageCount <= 120) return 3999;
  if (pageCount <= 200) return 4999;
  return 5999;
}
