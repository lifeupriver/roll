'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { GripVertical, X, Scissors } from 'lucide-react';
import { formatDuration } from './ClipDurationBadge';
import type { ReelClip } from '@/types/reel';
import type { Photo } from '@/types/photo';

interface StoryboardClip extends ReelClip {
  photos?: Photo;
}

interface ReelStoryboardProps {
  clips: StoryboardClip[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (photoId: string) => void;
  onEditTrim: (clipId: string) => void;
  readOnly?: boolean;
}

export function ReelStoryboard({
  clips,
  onReorder,
  onRemove,
  onEditTrim,
  readOnly = false,
}: ReelStoryboardProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex !== null && dragIndex !== index) {
        onReorder(dragIndex, index);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-element)] text-center">
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] font-[family-name:var(--font-body)]">
          No clips yet
        </p>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)]">
          Go to the Videos tab to select clips for your reel. Drag to reorder, use the scissors to
          trim, or tap X to remove.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-tight)]">
      {clips.map((clip, index) => {
        const photo = clip.photos;
        const thumbnailUrl = photo?.thumbnail_url ?? '';
        const date = photo?.date_taken
          ? new Date(photo.date_taken).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '';
        const isDragging = dragIndex === index;
        const isDropTarget = overIndex === index && dragIndex !== null;

        return (
          <div
            key={clip.id}
            draggable={!readOnly}
            onDragStart={readOnly ? undefined : () => handleDragStart(index)}
            onDragOver={readOnly ? undefined : (e) => handleDragOver(e, index)}
            onDrop={readOnly ? undefined : () => handleDrop(index)}
            onDragEnd={readOnly ? undefined : handleDragEnd}
            className={[
              'flex items-center gap-[var(--space-element)]',
              'p-[var(--space-tight)] pr-[var(--space-element)]',
              'bg-[var(--color-surface-raised)]',
              'rounded-[var(--radius-card)]',
              'transition-all duration-150 ease-out',
              isDragging ? 'opacity-50 scale-95' : '',
              isDropTarget ? 'ring-2 ring-[var(--color-action)]' : '',
            ].join(' ')}
          >
            {/* Drag handle */}
            {!readOnly && (
              <div className="shrink-0 cursor-grab active:cursor-grabbing p-1 text-[var(--color-ink-tertiary)]">
                <GripVertical size={16} />
              </div>
            )}

            {/* Thumbnail */}
            <div className="relative shrink-0 w-[120px] h-[68px] rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]">
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  width={120}
                  height={68}
                  unoptimized
                />
              )}
              {/* Duration overlay */}
              <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-[oklch(0_0_0/0.6)] rounded-[2px] font-[family-name:var(--font-mono)] text-[10px] text-white tabular-nums">
                {formatDuration(clip.trimmed_duration_ms)}
              </span>
              {/* Position badge */}
              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--color-action)] rounded-full font-[family-name:var(--font-mono)] text-[10px] text-white font-bold tabular-nums">
                {clip.position}
              </span>
            </div>

            {/* Clip info */}
            <div className="flex-1 min-w-0">
              <p className="text-[length:var(--text-label)] text-[var(--color-ink)] font-[family-name:var(--font-body)] font-medium truncate">
                {photo?.filename ?? `Clip ${clip.position}`}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)]">
                {date}
                {clip.trim_start_ms > 0 || clip.trim_end_ms !== null ? (
                  <>
                    {' \u00B7 '}
                    <span className="font-[family-name:var(--font-mono)] tabular-nums">
                      {formatDuration(clip.trim_start_ms)}\u2013
                      {formatDuration(clip.trim_end_ms ?? photo?.duration_ms ?? 0)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="flex items-center gap-[var(--space-micro)] shrink-0">
                <button
                  type="button"
                  onClick={() => onEditTrim(clip.id)}
                  aria-label="Edit trim"
                  className="p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors rounded-[var(--radius-sharp)]"
                >
                  <Scissors size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(clip.photo_id)}
                  aria-label="Remove clip"
                  className="p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] transition-colors rounded-[var(--radius-sharp)]"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
