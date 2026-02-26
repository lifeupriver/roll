'use client';

import { useState } from 'react';

const PROFILES = [
  {
    name: 'Classic',
    description: 'Clean tones with subtle warmth',
    color: 'var(--color-stock-classic)',
    filter: 'preview-classic',
  },
  {
    name: 'Vivid',
    description: 'Saturated, punchy colors',
    color: 'var(--color-stock-vivid)',
    filter: 'preview-vivid',
  },
  {
    name: 'Warmth',
    description: 'Golden tones, like afternoon light',
    color: 'var(--color-stock-warmth)',
    filter: 'preview-warmth',
  },
  {
    name: 'Fade',
    description: 'Lifted blacks, dreamy feel',
    color: 'var(--color-stock-gentle)',
    filter: 'preview-gentle',
  },
  {
    name: 'Mono',
    description: 'Rich black-and-white with grain',
    color: 'var(--color-stock-modern)',
    filter: 'preview-modern',
  },
  {
    name: 'Cool',
    description: 'Crisp, blue-shifted tones',
    color: 'var(--color-stock-golden)',
    filter: 'preview-golden',
  },
];

export function FilmProfileShowcase() {
  const [activeProfile, setActiveProfile] = useState(0);

  return (
    <div className="w-full">
      {/* Large hero preview with crossfade */}
      <div className="relative w-full aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)] mb-[var(--space-section)]">
        {PROFILES.map((profile, i) => (
          <div
            key={profile.name}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${profile.filter} ${
              i === activeProfile ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Placeholder for reference photo */}
            <div className="w-full h-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-[var(--space-element)]">
                <div className="w-24 h-24 rounded-[var(--radius-card)] bg-[var(--color-surface)] opacity-30" />
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
                  {profile.name} preview
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal scrolling profile cards — min 200px each */}
      <div
        className="flex gap-[var(--space-element)] overflow-x-auto pb-[var(--space-element)] -mx-[var(--space-component)] px-[var(--space-component)] md:-mx-0 md:px-0"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {PROFILES.map((profile, i) => (
          <button
            key={profile.name}
            onClick={() => setActiveProfile(i)}
            className={`flex-shrink-0 min-w-[200px] flex-1 rounded-[var(--radius-card)] overflow-hidden transition-all duration-200 text-left ${
              i === activeProfile
                ? 'ring-2 ring-[var(--color-action)] bg-[var(--color-surface)] shadow-[var(--shadow-floating)]'
                : 'bg-[var(--color-surface-raised)] hover:shadow-[var(--shadow-raised)]'
            }`}
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Thumbnail */}
            <div
              className={`w-full aspect-[4/3] bg-[var(--color-surface-sunken)] ${profile.filter}`}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-[var(--radius-card)] bg-[var(--color-surface)] opacity-30" />
              </div>
            </div>
            {/* Label + description */}
            <div className="p-[var(--space-element)]">
              <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-micro)]">
                <span
                  className="w-[8px] h-[8px] rounded-[var(--radius-pill)] flex-shrink-0"
                  style={{ backgroundColor: profile.color }}
                />
                <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                  {profile.name}
                </span>
              </div>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] leading-[1.4]">
                {profile.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
