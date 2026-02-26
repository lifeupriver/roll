'use client';

import type { BookPage } from '@/types/book';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface BookPreviewProps {
  title: string;
  pages: BookPage[];
  font?: string;
}

export function BookPreview({ title, pages, font = 'default' }: BookPreviewProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const totalSpreads = Math.ceil(pages.length / 2);

  const leftPage = pages[currentSpread * 2];
  const rightPage = pages[currentSpread * 2 + 1];

  const fontFamily = getFontFamily(font);

  return (
    <div>
      {/* Book spread */}
      <div className="flex bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden aspect-[2/1.4] shadow-lg">
        {/* Left page */}
        <div className="flex-1 p-[var(--space-component)] flex items-center justify-center border-r border-[var(--color-border)]">
          {leftPage ? (
            <BookPageRender page={leftPage} fontFamily={fontFamily} bookTitle={title} />
          ) : (
            <div className="text-[var(--color-ink-tertiary)] text-[length:var(--text-caption)]">—</div>
          )}
        </div>
        {/* Right page */}
        <div className="flex-1 p-[var(--space-component)] flex items-center justify-center">
          {rightPage ? (
            <BookPageRender page={rightPage} fontFamily={fontFamily} bookTitle={title} />
          ) : (
            <div className="text-[var(--color-ink-tertiary)] text-[length:var(--text-caption)]">—</div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-[var(--space-element)] mt-[var(--space-element)]">
        <button
          type="button"
          onClick={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
          disabled={currentSpread === 0}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-secondary)] disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {currentSpread + 1} / {totalSpreads}
        </span>
        <button
          type="button"
          onClick={() => setCurrentSpread(Math.min(totalSpreads - 1, currentSpread + 1))}
          disabled={currentSpread >= totalSpreads - 1}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-secondary)] disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function BookPageRender({
  page,
  fontFamily,
  bookTitle,
}: {
  page: BookPage;
  fontFamily: string;
  bookTitle: string;
}) {
  switch (page.type) {
    case 'book-cover':
      return (
        <div className="text-center" style={{ fontFamily }}>
          <h1 className="text-[length:var(--text-heading)] font-medium text-[var(--color-ink)]">
            {page.title || bookTitle}
          </h1>
        </div>
      );
    case 'toc':
      return (
        <div className="w-full" style={{ fontFamily }}>
          <h2 className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] mb-[var(--space-element)]">
            Contents
          </h2>
          <div className="flex flex-col gap-[var(--space-tight)]">
            {(page.tocEntries || []).map((entry: { title: string; startPage: number }, i: number) => (
              <div key={i} className="flex justify-between text-[length:var(--text-caption)]">
                <span className="text-[var(--color-ink)]">{entry.title}</span>
                <span className="text-[var(--color-ink-tertiary)]">{entry.startPage}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'magazine-title':
      return (
        <div className="text-center" style={{ fontFamily }}>
          <h2 className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
            {page.title}
          </h2>
          {page.dateRange && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
              {page.dateRange}
            </p>
          )}
        </div>
      );
    case 'magazine-content':
      return (
        <div className="w-full text-center">
          <div className="bg-[var(--color-border)] rounded-[var(--radius-sharp)] aspect-[4/3] mb-[var(--space-tight)]" />
          {page.caption && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic" style={{ fontFamily }}>
              {page.caption}
            </p>
          )}
        </div>
      );
    case 'back-cover':
      return (
        <div className="text-center">
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Made with Roll
          </p>
        </div>
      );
    default:
      return null;
  }
}

function getFontFamily(font: string): string {
  const map: Record<string, string> = {
    default: '-apple-system, BlinkMacSystemFont, sans-serif',
    garamond: "'EB Garamond', Georgia, serif",
    futura: "'Jost', sans-serif",
    courier: "'Courier Prime', 'Courier New', monospace",
    playfair: "'Playfair Display', Georgia, serif",
    lora: "'Lora', Georgia, serif",
    jakarta: "'Plus Jakarta Sans', sans-serif",
    baskerville: "'Libre Baskerville', Georgia, serif",
  };
  return map[font] || map.default;
}
