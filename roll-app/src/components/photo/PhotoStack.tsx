'use client';

import { useState, useCallback } from 'react';
import { Layers, Check, ChevronLeft } from 'lucide-react';
import type { PhotoStack as PhotoStackType } from '@/types/photo';

interface PhotoStackProps {
  stack: PhotoStackType;
  isChecked: (photoId: string) => boolean;
  onCheck: (photoId: string) => void;
  onPhotoTap?: (photoId: string) => void;
}

export function PhotoStack({ stack, isChecked, onCheck, onPhotoTap }: PhotoStackProps) {
  const [expanded, setExpanded] = useState(false);
  const topChecked = isChecked(stack.topPhoto.id);

  const handleTopClick = useCallback(() => {
    if (expanded) return;
    // Single tap on stack top photo — select it for the roll
    onCheck(stack.topPhoto.id);
  }, [expanded, onCheck, stack.topPhoto.id]);

  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
  }, []);

  // Expanded view — show all photos in the stack
  if (expanded) {
    return (
      <div className="col-span-full">
        {/* Stack header */}
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)] px-1">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-[length:var(--text-label)] text-[var(--color-action)] font-medium"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-[var(--space-tight)]">
            <Layers size={14} className="text-[var(--color-ink-secondary)]" />
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Stack of {stack.photos.length} similar photos — tap to select for your roll
            </span>
          </div>
        </div>
        {/* Grid of all photos in the stack */}
        <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] mb-[var(--space-element)]">
          {stack.photos.map((photo, i) => {
            const checked = isChecked(photo.id);
            const isTop = photo.id === stack.topPhoto.id;
            return (
              <div
                key={photo.id}
                className="relative group overflow-hidden cursor-pointer"
                onClick={() => onCheck(photo.id)}
              >
                <img
                  src={photo.thumbnail_url}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                />
                {/* Selection overlay */}
                {checked && (
                  <div className="absolute inset-0 bg-[var(--color-action)]/15 ring-2 ring-inset ring-[var(--color-action)] pointer-events-none" />
                )}
                {/* Top pick badge */}
                {isTop && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-caption)] font-medium">
                    Best
                  </span>
                )}
                {/* Checkmark */}
                <div
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 pointer-events-none ${
                    checked
                      ? 'bg-[var(--color-action)] scale-100'
                      : 'bg-black/30 border border-white/50 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} className="text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Collapsed view — show top photo with stack indicator
  return (
    <div className="relative group overflow-hidden bg-[var(--color-surface-sunken)]">
      {/* Main (top) photo */}
      <img
        src={stack.topPhoto.thumbnail_url}
        alt=""
        loading="lazy"
        onClick={handleTopClick}
        className="w-full aspect-[3/4] object-cover cursor-pointer"
      />

      {/* Selection overlay */}
      {topChecked && (
        <div className="absolute inset-0 bg-[var(--color-action)]/15 ring-2 ring-inset ring-[var(--color-action)] pointer-events-none" />
      )}

      {/* Checkmark */}
      <div
        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 pointer-events-none ${
          topChecked
            ? 'bg-[var(--color-action)] scale-100'
            : 'bg-[var(--color-surface-overlay)]/40 border border-white/60 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
        }`}
      >
        <Check size={16} strokeWidth={2.5} className={topChecked ? 'text-white' : 'text-white/80'} />
      </div>

      {/* Stack indicator — bottom-right badge showing count */}
      <button
        type="button"
        onClick={handleExpand}
        className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] bg-[var(--color-surface-overlay)]/70 backdrop-blur-sm text-white hover:bg-[var(--color-surface-overlay)]/90 transition-colors z-10 cursor-pointer"
      >
        <Layers size={12} />
        <span className="text-[length:var(--text-caption)] font-medium tabular-nums">
          {stack.photos.length}
        </span>
      </button>

      {/* Stacked card shadow effect — visual depth indicator */}
      <div className="absolute -bottom-0.5 left-1 right-1 h-1 bg-[var(--color-surface-sunken)] rounded-b-sm -z-10" />
      <div className="absolute -bottom-1 left-2 right-2 h-1 bg-[var(--color-surface-sunken)]/60 rounded-b-sm -z-20" />
    </div>
  );
}
