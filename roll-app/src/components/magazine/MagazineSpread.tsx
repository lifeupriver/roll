'use client';

import Image from 'next/image';
import type { MagazinePage } from '@/types/magazine';
import { getGridCSS, getLayoutConfig } from '@/lib/layout/page-templates';

interface MagazineSpreadProps {
  leftPage: MagazinePage | null;
  rightPage: MagazinePage | null;
  leftIndex: number;
  rightIndex: number;
  photoUrlMap: Map<string, string>;
  /** Optional: photo dimensions for aspect-ratio-aware rendering. */
  photoDimensionsMap?: Map<string, { width: number; height: number }>;
  onPageClick?: (pageIndex: number) => void;
}

export function MagazineSpread({
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  photoUrlMap,
  photoDimensionsMap,
  onPageClick,
}: MagazineSpreadProps) {
  return (
    <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)]">
      <SpreadPage
        page={leftPage}
        pageIndex={leftIndex}
        photoUrlMap={photoUrlMap}
        photoDimensionsMap={photoDimensionsMap}
        onClick={onPageClick ? () => onPageClick(leftIndex) : undefined}
      />
      <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />
      <SpreadPage
        page={rightPage}
        pageIndex={rightIndex}
        photoUrlMap={photoUrlMap}
        photoDimensionsMap={photoDimensionsMap}
        onClick={onPageClick ? () => onPageClick(rightIndex) : undefined}
      />
    </div>
  );
}

function SpreadPage({
  page,
  pageIndex,
  photoUrlMap,
  photoDimensionsMap,
  onClick,
}: {
  page: MagazinePage | null;
  pageIndex: number;
  photoUrlMap: Map<string, string>;
  photoDimensionsMap?: Map<string, { width: number; height: number }>;
  onClick?: () => void;
}) {
  if (!page) {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center" />
    );
  }

  // Section divider page — clean, centered typography
  if (page.type === 'divider' || page.layout === 'section_divider') {
    return (
      <div
        className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-[var(--space-element)] cursor-pointer"
        onClick={onClick}
      >
        <span className="font-[family-name:var(--font-display)] text-[length:var(--text-heading)] text-[var(--color-ink)] font-medium tracking-tight">
          {page.title}
        </span>
        {page.caption && (
          <span className="text-[length:var(--text-small)] text-[var(--color-ink-secondary)] max-w-[70%] text-center leading-relaxed">
            {page.caption}
          </span>
        )}
      </div>
    );
  }

  // Story / text page — generous margins, beautiful typography
  if (page.layout === 'text_page' || page.layout === 'story_page') {
    return (
      <div
        className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center cursor-pointer"
        style={{ padding: '15% 12%' }}
        onClick={onClick}
      >
        {page.title && (
          <span className="font-[family-name:var(--font-display)] text-[length:var(--text-subheading)] text-[var(--color-ink)] font-medium tracking-tight mb-[var(--space-component)] text-center">
            {page.title}
          </span>
        )}
        {page.caption && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] leading-[1.65] text-center">
            {page.caption}
          </p>
        )}
      </div>
    );
  }

  // Pull quote layout — photo on left, quote on right
  if (page.layout === 'pullquote') {
    const photo = page.photos[0];
    const url = photo ? photoUrlMap.get(photo.id) : undefined;
    const dims = photo && photoDimensionsMap ? photoDimensionsMap.get(photo.id) : undefined;

    return (
      <div
        className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {/* Photo half */}
        <div className="flex-1 flex items-center justify-center p-[8%]">
          {url ? (
            <Image
              src={url}
              alt=""
              width={dims?.width || 400}
              height={dims?.height || 600}
              className="max-w-full max-h-full object-contain"
              style={dims ? { aspectRatio: `${dims.width}/${dims.height}` } : undefined}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-surface-sunken)]" />
          )}
        </div>
        {/* Caption half */}
        <div className="flex-1 flex items-center justify-center p-[8%]">
          {page.caption && (
            <blockquote className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] text-[var(--color-ink)] leading-relaxed italic text-center">
              {page.caption}
            </blockquote>
          )}
        </div>
        <PageNumber index={pageIndex} />
      </div>
    );
  }

  // Photo page with smart grid layout
  const layoutConfig = getLayoutConfig(page.layout);
  const gridCSS = getGridCSS(page.layout);
  const useContain = layoutConfig.preserveAspectRatio !== false;
  const objectFit = layoutConfig.objectFit ?? (useContain ? 'contain' : 'cover');
  const innerPadding = layoutConfig.innerPadding;

  return (
    <div
      className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="w-full h-full grid"
        style={{
          gridTemplateRows: gridCSS.gridTemplateRows,
          gridTemplateColumns: gridCSS.gridTemplateColumns,
          gap: useContain ? '2px' : '1px',
          padding: innerPadding ?? (useContain ? '2%' : '0'),
        }}
      >
        {page.photos.map((photo, i) => {
          const url = photoUrlMap.get(photo.id);
          const dims = photoDimensionsMap?.get(photo.id);

          return (
            <div
              key={`${photo.id}-${i}`}
              className="overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: useContain ? 'var(--color-surface-raised)' : 'var(--color-surface-sunken)',
              }}
            >
              {url ? (
                <Image
                  src={url}
                  alt=""
                  width={dims?.width || 400}
                  height={dims?.height || 600}
                  className={`${objectFit === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}`}
                  style={dims && objectFit === 'contain'
                    ? { aspectRatio: `${dims.width}/${dims.height}` }
                    : undefined
                  }
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-surface-sunken)]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Caption — only for caption-heavy layouts, positioned elegantly */}
      {page.caption && page.layout === 'caption_heavy' && (
        <div className="absolute bottom-0 inset-x-0 p-[5%_8%] bg-gradient-to-t from-[var(--color-surface-raised)] via-[var(--color-surface-raised)]/95 to-transparent">
          <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-secondary)] text-[length:var(--text-caption)] leading-relaxed italic text-center">
            {page.caption}
          </p>
        </div>
      )}

      <PageNumber index={pageIndex} />
    </div>
  );
}

function PageNumber({ index }: { index: number }) {
  return (
    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] opacity-60 px-2 py-0.5">
      {index + 1}
    </span>
  );
}
