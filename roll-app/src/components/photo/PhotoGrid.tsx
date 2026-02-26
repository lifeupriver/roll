'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types/photo';

/** Bounding rect for shared element transition to lightbox */
export interface PhotoSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PhotoGridProps {
  photos: Photo[];
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  selectMode?: boolean;
  checkedIds?: Set<string>;
  /** Ordered list of checked IDs for showing selection numbers */
  checkedOrder?: string[];
  onCheck?: (photoId: string) => void;
  onHide?: (photoId: string) => void;
  onPhotoTap?: (photoId: string, sourceRect?: PhotoSourceRect) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  columns?: number;
  /** Optional: render a custom element for specific photo IDs (e.g. stacks) */
  renderOverride?: (photoId: string) => ReactNode | null;
}

// Max items to animate on initial mount (viewport items only)
const MAX_ANIMATED_ITEMS = 30;
const STAGGER_MS = 30;

export function PhotoGrid({
  photos,
  mode,
  selectMode,
  checkedIds,
  checkedOrder,
  onCheck,
  onHide,
  onPhotoTap,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  columns,
  renderOverride,
}: PhotoGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const hasAnimated = useRef(false);

  // Re-trigger entrance animation on mount (tab switch causes remount)
  useEffect(() => {
    hasAnimated.current = false;
    setAnimationKey((k) => k + 1);
  }, [mode]);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [onLoadMore, hasMore]);

  // Mark animation as done after the stagger window
  useEffect(() => {
    const timer = setTimeout(() => {
      hasAnimated.current = true;
    }, MAX_ANIMATED_ITEMS * STAGGER_MS + 250);
    return () => clearTimeout(timer);
  }, [animationKey]);

  return (
    <div className="w-full">
      {/* Contact sheet grid: 4px gaps, no border-radius */}
      <div
        key={animationKey}
        className={columns ? 'grid gap-[var(--space-micro)]' : 'grid grid-cols-2 lg:grid-cols-3 gap-[var(--space-micro)]'}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      >
        {photos.map((photo, index) => {
          // Check if this photo has a custom override (e.g. stack rendering)
          const override = renderOverride?.(photo.id);
          if (override) return override;

          // Only animate items in the initial viewport
          const shouldAnimate = index < MAX_ANIMATED_ITEMS && !hasAnimated.current;

          return (
            <div
              key={photo.id}
              className={shouldAnimate ? 'grid-enter-item' : ''}
              style={shouldAnimate ? { animationDelay: `${index * STAGGER_MS}ms` } : undefined}
            >
              <PhotoCard
                photo={photo}
                isChecked={checkedIds?.has(photo.id) ?? false}
                selectionNumber={checkedOrder ? checkedOrder.indexOf(photo.id) + 1 || undefined : undefined}
                mode={mode}
                selectMode={selectMode}
                onCheck={onCheck ? () => onCheck(photo.id) : undefined}
                onHide={onHide ? () => onHide(photo.id) : undefined}
                onTap={onPhotoTap ? (sourceRect?: PhotoSourceRect) => onPhotoTap(photo.id, sourceRect) : undefined}
              />
            </div>
          );
        })}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-[3/4] bg-[var(--color-surface-sunken)] skeleton-pulse"
            />
          ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
