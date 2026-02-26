'use client';

import { BookOpen, ChevronUp, ChevronDown, Trash2, Maximize2 } from 'lucide-react';
import { CaptionEditor } from './CaptionEditor';
import type { BookPage } from '@/types/book';

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
              caption={leftPage.caption}
              editable={editable}
              onSave={(c) => onCaptionChange(leftPage.photoId, c)}
              placeholder="Add caption..."
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {rightPage && (
            <CaptionEditor
              caption={rightPage.caption}
              editable={editable}
              onSave={(c) => onCaptionChange(rightPage.photoId, c)}
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

  return (
    <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden group">
      {/* Photo */}
      <img
        src={page.thumbnailUrl}
        alt={`Page ${pageIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Page number badge */}
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
        {pageIndex + 1}
      </span>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
        {/* Fullscreen button */}
        {onPhotoTap && (
          <button
            type="button"
            onClick={() => onPhotoTap(page.photoId)}
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
                onClick={() => onRemovePage(page.photoId)}
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
