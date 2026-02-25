'use client';

import { useRef, useCallback } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import type { FilmProfile } from '@/types/roll';

interface FilmProfileSelectorProps {
  profiles: FilmProfile[];
  selectedId: string;
  onChange: (profileId: string) => void;
  samplePhotoUrl: string;
  userTier: 'free' | 'plus';
  recommendation?: { profileId: string; reason: string } | null;
}

export function FilmProfileSelector({
  profiles,
  selectedId,
  onChange,
  samplePhotoUrl,
  userTier,
  recommendation,
}: FilmProfileSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (profile: FilmProfile) => {
      if (profile.tier === 'plus' && userTier === 'free') {
        return;
      }
      onChange(profile.id);
    },
    [onChange, userTier],
  );

  return (
    <div className="flex flex-col gap-[var(--space-element)]">
      {/* Recommendation banner */}
      {recommendation && userTier === 'plus' && (
        <button
          type="button"
          onClick={() => onChange(recommendation.profileId)}
          className={[
            'flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] transition-all duration-150',
            selectedId === recommendation.profileId
              ? 'bg-[var(--color-action-subtle)] border-2 border-[var(--color-action)]'
              : 'bg-[var(--color-surface-raised)] border-2 border-transparent hover:border-[var(--color-border-strong)]',
          ].join(' ')}
        >
          <Sparkles size={16} className="text-[var(--color-action)] shrink-0" />
          <div className="text-left">
            <span className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">
              Recommended: {profiles.find((p) => p.id === recommendation.profileId)?.name}
            </span>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {recommendation.reason}
            </p>
          </div>
        </button>
      )}
    <div
      ref={scrollRef}
      role="listbox"
      aria-label="Film profile selector"
      className="flex gap-[var(--space-element)] overflow-x-auto no-scrollbar"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {profiles.map((profile) => {
        const isSelected = profile.id === selectedId;
        const isLocked = profile.tier === 'plus' && userTier === 'free';

        return (
          <button
            key={profile.id}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isLocked}
            onClick={() => handleSelect(profile)}
            className={[
              'shrink-0 w-[160px] rounded-[var(--radius-card)] transition-all duration-150 ease-out',
              'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
              'bg-[var(--color-surface-raised)]',
              isSelected
                ? 'border-2 border-[var(--color-action)] shadow-[var(--shadow-raised)]'
                : 'border-2 border-transparent',
            ].join(' ')}
            style={{ scrollSnapAlign: 'center' }}
          >
            {/* Preview image container */}
            <div className="relative w-[160px] h-[120px] overflow-hidden rounded-t-[var(--radius-card)]">
              <img
                src={samplePhotoUrl}
                alt={`${profile.name} film preview`}
                className={[
                  'w-full h-full object-cover',
                  profile.cssFilterClass,
                ].join(' ')}
              />

              {/* Locked overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-darkroom)]/40">
                  <Lock
                    size={24}
                    strokeWidth={2}
                    className="text-[var(--color-ink-inverse)]"
                  />
                </div>
              )}
            </div>

            {/* Profile info */}
            <div className={[
              'flex flex-col items-center gap-[var(--space-tight)] py-[var(--space-element)]',
              isLocked ? 'opacity-40' : '',
            ].join(' ')}>
              {/* Profile name */}
              <span className="font-[family-name:var(--font-display)] text-[length:var(--text-label)] text-[var(--color-ink)] text-center">
                {profile.name}
              </span>

              {/* Signature color dot */}
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: profile.stockColor }}
                aria-hidden="true"
              />
            </div>
          </button>
        );
      })}
    </div>
    </div>
  );
}
