'use client';

import { ChevronRight, MapPin, Calendar } from 'lucide-react';
import type { Photo } from '@/types/photo';

interface MomentClusterCardProps {
  coverPhoto: Photo;
  locationName?: string;
  dateRange: string;
  photoCount: number;
  onExpand: () => void;
}

export function MomentClusterCard({
  coverPhoto,
  locationName,
  dateRange,
  photoCount,
  onExpand,
}: MomentClusterCardProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full flex items-center gap-[var(--space-component)] p-[var(--space-element)] rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors group cursor-pointer"
    >
      {/* Cover thumbnail */}
      <div className="w-16 h-16 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
        <img
          src={coverPhoto.thumbnail_url}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-[var(--space-tight)] mb-0.5">
          <Calendar size={12} className="text-[var(--color-ink-tertiary)] shrink-0" />
          <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
            {dateRange}
          </span>
        </div>
        {locationName && (
          <div className="flex items-center gap-[var(--space-tight)] mb-0.5">
            <MapPin size={12} className="text-[var(--color-ink-tertiary)] shrink-0" />
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] truncate">
              {locationName}
            </span>
          </div>
        )}
        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Arrow */}
      <ChevronRight
        size={16}
        className="text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-action)] transition-colors shrink-0"
      />
    </button>
  );
}
