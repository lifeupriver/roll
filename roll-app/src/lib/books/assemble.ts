import type { BookPage } from '@/types/book';
import type { MagazinePage } from '@/types/magazine';

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
 * Creates: cover → TOC → magazine sections → back cover.
 */
export function assembleBook(
  title: string,
  coverPhotoId: string | null,
  magazines: MagazineForAssembly[]
): AssembledBook {
  const pages: BookPage[] = [];

  // 1. Cover page
  pages.push({
    type: 'book-cover',
    title,
    coverPhotoId,
  });

  // 2. Table of contents (calculate page numbers)
  const tocEntries: { title: string; startPage: number }[] = [];
  let currentPage = 3; // After cover + TOC

  for (const mag of magazines) {
    tocEntries.push({ title: mag.title, startPage: currentPage });
    currentPage += 1 + (mag.pages?.length || 0); // title page + content pages
  }

  pages.push({
    type: 'toc',
    tocEntries,
  });

  // 3. Each magazine section
  for (const magazine of magazines) {
    const dateRange = formatDateRange(magazine.date_range_start, magazine.date_range_end);

    // Magazine title page
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
  }

  // 4. Back cover
  pages.push({ type: 'back-cover' });

  return { pages, totalPages: pages.length };
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
