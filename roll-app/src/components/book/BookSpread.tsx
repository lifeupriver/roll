'use client';

import { BookOpen, ChevronUp, ChevronDown, Trash2, Maximize2 } from 'lucide-react';
import { CaptionEditor } from './CaptionEditor';
import type { BookPage } from '@/types/book';
import { getGridCSS, getLayoutConfig } from '@/lib/layout/page-templates';

interface BookSpreadProps {
  leftPage: BookPage | null;
  rightPage: BookPage | null;
  leftIndex: number;
  rightIndex: number;
  totalPages: number;
  editable: boolean;
  onCaptionChange: (photoId: string, caption: string) => void;
  onMovePage?: (pageIndex: number, direction: 'up' | 'down') => void;
  onRemovePage?: (photoId: string) => void;
  onPhotoTap?: (photoId: string) => void;
  flipClass?: string;
}

export function BookSpread({
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  totalPages,
  editable,
  onCaptionChange,
  onMovePage,
  onRemovePage,
  onPhotoTap,
  flipClass,
}: BookSpreadProps) {
  return (
    <div className="flex flex-col gap-[var(--space-element)]">
      {/* Two-page spread */}
      <div
        className={`flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] ${flipClass ?? ''}`}
      >
        {/* Left page */}
        <SpreadPage
          page={leftPage}
          pageIndex={leftIndex}
          totalPages={totalPages}
          editable={editable}
          onCaptionChange={onCaptionChange}
          onMovePage={onMovePage}
          onRemovePage={onRemovePage}
          onPhotoTap={onPhotoTap}
          side="left"
        />

        {/* Spine divider */}
        <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />

        {/* Right page */}
        <SpreadPage
          page={rightPage}
          pageIndex={rightIndex}
          totalPages={totalPages}
          editable={editable}
          onCaptionChange={onCaptionChange}
          onMovePage={onMovePage}
          onRemovePage={onRemovePage}
          onPhotoTap={onPhotoTap}
          side="right"
        />
      </div>

      {/* Captions below the spread */}
      <div className="flex gap-[var(--space-component)]">
        <div className="flex-1 min-w-0">
          {leftPage && (
            <CaptionEditor
              caption={leftPage.caption ?? ''}
              editable={editable}
              onSave={(c) => onCaptionChange(leftPage.photoId ?? '', c)}
              placeholder="Add caption..."
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {rightPage && (
            <CaptionEditor
              caption={rightPage.caption ?? ''}
              editable={editable}
              onSave={(c) => onCaptionChange(rightPage.photoId ?? '', c)}
              placeholder="Add caption..."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SpreadPage({
  page,
  pageIndex,
  totalPages,
  editable,
  onMovePage,
  onRemovePage,
  onPhotoTap,
  side: _side,
}: {
  page: BookPage | null;
  pageIndex: number;
  totalPages: number;
  editable: boolean;
  onCaptionChange: (photoId: string, caption: string) => void;
  onMovePage?: (pageIndex: number, direction: 'up' | 'down') => void;
  onRemovePage?: (photoId: string) => void;
  onPhotoTap?: (photoId: string) => void;
  side: 'left' | 'right';
}) {
  if (!page) {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex flex-col items-center justify-center gap-[var(--space-tight)]">
        {pageIndex < totalPages ? (
          <>
            <BookOpen size={24} className="text-[var(--color-ink-tertiary)]" />
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] italic font-[family-name:var(--font-display)]">
              End of Book
            </span>
          </>
        ) : null}
      </div>
    );
  }

  // ── Special page types (cover, toc, title, back-cover) ──
  if (page.type === 'book-cover') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] overflow-hidden">
        {page.coverPhotoId && page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={page.title ?? 'Cover'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-sunken)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-[8%]">
          <h1 className="font-[family-name:var(--font-display)] font-semibold text-white text-[length:var(--text-display)] leading-tight">
            {page.title}
          </h1>
        </div>
      </div>
    );
  }

  if (page.type === 'toc') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col justify-center" style={{ padding: '12% 10%' }}>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-component)] tracking-tight">
          Contents
        </h2>
        {page.tocEntries && page.tocEntries.length > 0 && (
          <div className="flex flex-col gap-[var(--space-element)]">
            {page.tocEntries.map((entry, i) => (
              <div key={i} className="flex items-baseline gap-[var(--space-tight)]">
                <span className="font-[family-name:var(--font-body)] text-[length:var(--text-small)] text-[var(--color-ink)]">
                  {entry.title}
                </span>
                <span className="flex-1 border-b border-dotted border-[var(--color-border)]" />
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  {entry.startPage}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (page.type === 'magazine-title') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-[var(--space-element)]" style={{ padding: '15%' }}>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] text-center tracking-tight">
          {page.title}
        </h2>
        {page.dateRange && (
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {page.dateRange}
          </span>
        )}
      </div>
    );
  }

  if (page.type === 'back-cover') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center">
        <BookOpen size={32} className="text-[var(--color-ink-tertiary)] opacity-30" />
      </div>
    );
  }

  // ── Magazine content pages with smart layout ──
  if (page.type === 'magazine-content' && page.photos && page.photos.length > 0) {
    const layout = page.layout ?? 'full_bleed';
    const layoutConfig = getLayoutConfig(layout);
    const gridCSS = getGridCSS(layout);
    const useContain = layoutConfig.preserveAspectRatio !== false;
    const objectFit = layoutConfig.objectFit ?? (useContain ? 'contain' : 'cover');

    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] overflow-hidden group">
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateRows: gridCSS.gridTemplateRows,
            gridTemplateColumns: gridCSS.gridTemplateColumns,
            gap: useContain ? '2px' : '1px',
            padding: layoutConfig.innerPadding ?? (useContain ? '2%' : '0'),
          }}
        >
          {page.photos.map((photo, i) => (
            <div
              key={`${photo.id}-${i}`}
              className="overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: useContain ? 'var(--color-surface-raised)' : 'var(--color-surface-sunken)' }}
            >
              {/* For assembled pages, thumbnailUrl is on the page itself */}
              <div className={`${objectFit === 'contain' ? 'max-w-full max-h-full' : 'w-full h-full'} bg-[var(--color-surface-sunken)] flex items-center justify-center`}>
                <span className="text-[9px] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                  {photo.id.slice(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        {page.caption && layoutConfig.hasCaption && (
          <div className="absolute bottom-0 inset-x-0 p-[5%_8%] bg-gradient-to-t from-[var(--color-surface-raised)] to-transparent">
            <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-secondary)] text-[length:var(--text-caption)] leading-relaxed italic text-center">
              {page.caption}
            </p>
          </div>
        )}

        {/* Page number */}
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] opacity-60 px-2 py-0.5">
          {pageIndex + 1}
        </span>
      </div>
    );
  }

  // ── Legacy single-photo pages (backward compatibility) ──
  return (
    <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] overflow-hidden group">
      {/* Photo — use contain to preserve aspect ratio */}
      {page.thumbnailUrl ? (
        <div className="w-full h-full flex items-center justify-center p-[5%]">
          <img
            src={page.thumbnailUrl}
            alt={`Page ${pageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            style={
              page.width && page.height
                ? { aspectRatio: `${page.width}/${page.height}` }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="w-full h-full bg-[var(--color-surface-sunken)]" />
      )}

      {/* Page number badge */}
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] opacity-60 px-2 py-0.5">
        {pageIndex + 1}
      </span>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200">
        {/* Fullscreen button */}
        {onPhotoTap && (
          <button
            type="button"
            onClick={() => onPhotoTap(page.photoId ?? '')}
            className="absolute top-2 right-2 p-2.5 rounded-[var(--radius-sharp)] bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity touch-target"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Edit mode controls */}
        {editable && (
          <div className="absolute top-2 left-2 flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMovePage && pageIndex > 0 && (
              <button
                type="button"
                onClick={() => onMovePage(pageIndex, 'up')}
                className="p-2.5 rounded-[var(--radius-sharp)] bg-black/40 text-white hover:bg-black/60 transition-colors touch-target"
                title="Move page earlier"
              >
                <ChevronUp size={16} />
              </button>
            )}
            {onMovePage && pageIndex < totalPages - 1 && (
              <button
                type="button"
                onClick={() => onMovePage(pageIndex, 'down')}
                className="p-2.5 rounded-[var(--radius-sharp)] bg-black/40 text-white hover:bg-black/60 transition-colors touch-target"
                title="Move page later"
              >
                <ChevronDown size={16} />
              </button>
            )}
            {onRemovePage && (
              <button
                type="button"
                onClick={() => onRemovePage(page.photoId ?? '')}
                className="p-2.5 rounded-[var(--radius-sharp)] bg-black/40 text-red-300 hover:bg-red-500/60 hover:text-white transition-colors touch-target"
                title="Remove page"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
