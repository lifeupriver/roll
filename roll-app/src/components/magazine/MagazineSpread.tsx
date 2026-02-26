'use client';

import type { MagazinePage } from '@/types/magazine';
import { getGridCSS } from '@/lib/layout/page-templates';

interface MagazineSpreadProps {
  leftPage: MagazinePage | null;
  rightPage: MagazinePage | null;
  leftIndex: number;
  rightIndex: number;
  photoUrlMap: Map<string, string>;
  onPageClick?: (pageIndex: number) => void;
}

export function MagazineSpread({
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  photoUrlMap,
  onPageClick,
}: MagazineSpreadProps) {
  return (
    <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)]">
      <SpreadPage
        page={leftPage}
        pageIndex={leftIndex}
        photoUrlMap={photoUrlMap}
        onClick={onPageClick ? () => onPageClick(leftIndex) : undefined}
      />
      <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />
      <SpreadPage
        page={rightPage}
        pageIndex={rightIndex}
        photoUrlMap={photoUrlMap}
        onClick={onPageClick ? () => onPageClick(rightIndex) : undefined}
      />
    </div>
  );
}

function SpreadPage({
  page,
  pageIndex,
  photoUrlMap,
  onClick,
}: {
  page: MagazinePage | null;
  pageIndex: number;
  photoUrlMap: Map<string, string>;
  onClick?: () => void;
}) {
  if (!page) {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center" />
    );
  }

  // Section divider page
  if (page.type === 'divider' || page.layout === 'section_divider') {
    return (
      <div
        className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-2 cursor-pointer"
        onClick={onClick}
      >
        <span className="font-[family-name:var(--font-display)] text-[length:var(--text-heading)] text-[var(--color-ink)] font-medium">
          {page.title}
        </span>
        {page.caption && (
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] max-w-[80%] text-center">
            {page.caption}
          </span>
        )}
      </div>
    );
  }

  // Photo page with grid layout
  const gridCSS = getGridCSS(page.layout);

  return (
    <div
      className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="w-full h-full grid gap-0.5"
        style={{
          gridTemplateRows: gridCSS.gridTemplateRows,
          gridTemplateColumns: gridCSS.gridTemplateColumns,
        }}
      >
        {page.photos.map((photo, i) => {
          const url = photoUrlMap.get(photo.id);
          return (
            <div key={`${photo.id}-${i}`} className="overflow-hidden">
              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface-sunken)]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Caption overlay */}
      {page.caption && page.layout === 'caption_heavy' && (
        <div className="absolute bottom-0 inset-x-0 p-2 bg-black/40">
          <p className="text-white text-[length:var(--text-caption)] line-clamp-2">
            {page.caption}
          </p>
        </div>
      )}

      {/* Page number */}
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
        {pageIndex + 1}
      </span>
    </div>
  );
}
