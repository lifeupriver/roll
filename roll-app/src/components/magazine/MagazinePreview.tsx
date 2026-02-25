'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MagazineSpread } from './MagazineSpread';
import type { MagazinePage } from '@/types/magazine';

interface MagazinePreviewProps {
  pages: MagazinePage[];
  photoUrlMap: Map<string, string>;
  onPageClick?: (pageIndex: number) => void;
}

export function MagazinePreview({ pages, photoUrlMap, onPageClick }: MagazinePreviewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const totalSpreads = Math.ceil(pages.length / 2);

  const leftIndex = spreadIndex * 2;
  const rightIndex = spreadIndex * 2 + 1;
  const leftPage = pages[leftIndex] ?? null;
  const rightPage = pages[rightIndex] ?? null;

  return (
    <div className="flex flex-col gap-[var(--space-element)]">
      {/* Spread viewer */}
      <MagazineSpread
        leftPage={leftPage}
        rightPage={rightPage}
        leftIndex={leftIndex}
        rightIndex={rightIndex}
        photoUrlMap={photoUrlMap}
        onPageClick={onPageClick}
      />

      {/* Navigation */}
      <div className="flex items-center justify-center gap-[var(--space-component)]">
        <button
          type="button"
          onClick={() => setSpreadIndex((prev) => Math.max(0, prev - 1))}
          disabled={spreadIndex === 0}
          className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
          {leftIndex + 1}–{Math.min(rightIndex + 1, pages.length)} of {pages.length}
        </span>
        <button
          type="button"
          onClick={() => setSpreadIndex((prev) => Math.min(totalSpreads - 1, prev + 1))}
          disabled={spreadIndex >= totalSpreads - 1}
          className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: totalSpreads }, (_, i) => {
          const li = i * 2;
          const firstPage = pages[li];
          const firstPhotoUrl = firstPage?.photos[0]
            ? photoUrlMap.get(firstPage.photos[0].id)
            : null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSpreadIndex(i)}
              className={`flex-shrink-0 w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                i === spreadIndex
                  ? 'border-[var(--color-action)]'
                  : 'border-transparent hover:border-[var(--color-border)]'
              }`}
            >
              {firstPhotoUrl ? (
                <img src={firstPhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface-sunken)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
