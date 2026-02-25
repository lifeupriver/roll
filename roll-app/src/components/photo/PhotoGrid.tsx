'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types/photo';

interface PhotoGridProps {
  photos: Photo[];
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  selectMode?: boolean;
  checkedIds?: Set<string>;
  onCheck?: (photoId: string) => void;
  onHide?: (photoId: string) => void;
  onPhotoTap?: (photoId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  columns?: number;
  /** Optional: render a custom element for specific photo IDs (e.g. stacks) */
  renderOverride?: (photoId: string) => ReactNode | null;
}

export function PhotoGrid({
  photos,
  mode,
  selectMode,
  checkedIds,
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

  return (
    <div className="w-full">
      {/* Contact sheet grid: 4px gaps, no border-radius */}
      <div
        className={columns ? 'grid gap-[var(--space-micro)]' : 'grid grid-cols-2 lg:grid-cols-3 gap-[var(--space-micro)]'}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      >
        {photos.map((photo) => {
          // Check if this photo has a custom override (e.g. stack rendering)
          const override = renderOverride?.(photo.id);
          if (override) return override;

          return (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isChecked={checkedIds?.has(photo.id) ?? false}
              mode={mode}
              selectMode={selectMode}
              onCheck={onCheck ? () => onCheck(photo.id) : undefined}
              onHide={onHide ? () => onHide(photo.id) : undefined}
              onTap={onPhotoTap ? () => onPhotoTap(photo.id) : undefined}
            />
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
