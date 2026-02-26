'use client';

/**
 * Styled mockup visuals for each of the 4 primary feature cards.
 * These replace the beige placeholder rectangles with high-fidelity
 * representations of each feature.
 */

/** AI-Filtered Feed — shows a grid with some items faded out (filtered) */
export function FeedVisual() {
  const items = [
    { keep: true, l: 0.7, c: 0.1, h: 60 },
    { keep: false, l: 0.5, c: 0.01, h: 0 }, // screenshot
    { keep: true, l: 0.68, c: 0.09, h: 75 },
    { keep: false, l: 0.4, c: 0.01, h: 0 }, // blurry
    { keep: true, l: 0.72, c: 0.11, h: 55 },
    { keep: true, l: 0.65, c: 0.08, h: 80 },
    { keep: false, l: 0.45, c: 0.01, h: 0 }, // duplicate
    { keep: true, l: 0.71, c: 0.1, h: 45 },
    { keep: true, l: 0.67, c: 0.09, h: 70 },
  ];

  return (
    <div className="w-full aspect-[16/10] bg-[var(--color-surface)] rounded-[var(--radius-card)] overflow-hidden p-3 flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-[3px] flex-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative rounded-sm overflow-hidden"
            style={{
              backgroundColor: `oklch(${item.l} ${item.c} ${item.h})`,
              filter: item.keep ? 'saturate(1.1) brightness(1.05)' : 'grayscale(1) brightness(0.5)',
              opacity: item.keep ? 1 : 0.35,
            }}
          >
            {!item.keep && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
            )}
            {item.keep && i === 0 && (
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-action)] flex items-center justify-center">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] tracking-wider">
          6 of 9 kept
        </span>
        <div className="flex gap-1">
          {['All', 'People', 'Places'].map((pill, i) => (
            <span
              key={pill}
              className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                i === 0
                  ? 'bg-[var(--color-ink)] text-[var(--color-ink-inverse)]'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-tertiary)]'
              }`}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Roll Building — shows a film strip progress bar filling up */
export function RollVisual() {
  const frameCount = 36;
  const filledCount = 24;

  return (
    <div className="w-full aspect-[16/10] bg-[var(--color-darkroom)] rounded-[var(--radius-card)] overflow-hidden p-3 flex flex-col justify-between">
      {/* Mini photo thumbnails being selected */}
      <div className="grid grid-cols-6 gap-[2px] flex-1 mb-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              backgroundColor: `oklch(${0.6 + (i % 4) * 0.05} ${0.08 + (i % 3) * 0.02} ${40 + ((i * 11) % 50)})`,
              filter: 'saturate(1.1) sepia(0.1)',
            }}
          />
        ))}
      </div>
      {/* Film strip progress bar */}
      <div className="relative bg-[var(--color-filmstrip)] rounded-sm h-7 flex items-center overflow-hidden">
        {/* Sprocket holes */}
        <div className="absolute top-0.5 left-0 right-0 flex justify-between px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`s-${i}`} className="w-1 h-1 rounded-full bg-[var(--color-sprocket)]" />
          ))}
        </div>
        <div className="absolute bottom-0.5 left-0 right-0 flex justify-between px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`s2-${i}`} className="w-1 h-1 rounded-full bg-[var(--color-sprocket)]" />
          ))}
        </div>
        {/* Fill bar */}
        <div
          className="h-full bg-[var(--color-action)] rounded-sm transition-all"
          style={{ width: `${(filledCount / frameCount) * 100}%` }}
        />
        {/* Counter */}
        <span className="absolute right-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-framecounter)] tracking-widest font-bold">
          {filledCount} / {frameCount}
        </span>
        <span className="absolute left-2 font-[family-name:var(--font-display)] text-[10px] text-[var(--color-ink-inverse)] opacity-70">
          Roll 1
        </span>
      </div>
    </div>
  );
}

/** Film Profiles / Developing — shows before/after with film stock swatches */
export function DevelopVisual() {
  const profiles = [
    {
      name: 'Warmth',
      color: 'var(--color-stock-warmth)',
      filter: 'saturate(1.1) sepia(0.15) brightness(1.05)',
    },
    {
      name: 'Golden',
      color: 'var(--color-stock-golden)',
      filter: 'saturate(1.2) sepia(0.25) brightness(1.08)',
    },
    { name: 'Vivid', color: 'var(--color-stock-vivid)', filter: 'saturate(1.4) contrast(1.1)' },
    { name: 'Classic', color: 'var(--color-stock-classic)', filter: 'grayscale(1) contrast(1.3)' },
    {
      name: 'Gentle',
      color: 'var(--color-stock-gentle)',
      filter: 'grayscale(1) contrast(0.9) brightness(1.1)',
    },
    { name: 'Modern', color: 'var(--color-stock-modern)', filter: 'grayscale(1) contrast(1.1)' },
  ];

  return (
    <div className="w-full aspect-[16/10] bg-[var(--color-surface)] rounded-[var(--radius-card)] overflow-hidden p-3 flex flex-col gap-2">
      {/* Before/after comparison */}
      <div className="flex-1 flex gap-2">
        <div className="flex-1 relative rounded-sm overflow-hidden">
          <div className="w-full h-full" style={{ backgroundColor: 'oklch(0.60 0.04 70)' }} />
          <span className="absolute bottom-1 left-1 font-[family-name:var(--font-mono)] text-[8px] text-white bg-black/40 px-1.5 py-0.5 rounded-sm">
            Original
          </span>
        </div>
        <div className="flex-1 relative rounded-sm overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundColor: 'oklch(0.68 0.10 60)',
              filter: 'saturate(1.1) sepia(0.15) brightness(1.05)',
            }}
          />
          <span className="absolute bottom-1 left-1 font-[family-name:var(--font-mono)] text-[8px] text-white bg-black/40 px-1.5 py-0.5 rounded-sm">
            Warmth
          </span>
        </div>
      </div>
      {/* Film stock selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {profiles.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-1 px-2 py-1 rounded-full shrink-0 text-[9px] font-medium ${
              i === 0
                ? 'bg-[var(--color-ink)] text-[var(--color-ink-inverse)]'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-tertiary)]'
            }`}
          >
            <span
              className="w-[5px] h-[5px] rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Prints Delivered — shows a "print order" mockup */
export function PrintsVisual() {
  return (
    <div className="w-full aspect-[16/10] bg-[var(--color-paper-kraft)] rounded-[var(--radius-card)] overflow-hidden p-3 flex flex-col items-center justify-center gap-2">
      {/* Stacked print cards */}
      <div className="relative w-32 h-24">
        {[2, 1, 0].map((offset) => (
          <div
            key={offset}
            className="absolute rounded-sm shadow-sm border border-white/60"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: `oklch(${0.7 + offset * 0.03} ${0.09 - offset * 0.02} ${55 + offset * 10})`,
              filter: 'saturate(1.1) sepia(0.1) brightness(1.05)',
              transform: `rotate(${(offset - 1) * 4}deg) translateY(${offset * -3}px)`,
              zIndex: 3 - offset,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-action)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="3" width="15" height="13" />
          <polyline points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--color-ink-secondary)] font-medium">
          Delivered to your door
        </span>
      </div>
      <div className="flex items-center gap-1 mt-auto">
        <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-ink-tertiary)] tracking-wider">
          4&times;6 prints &middot; Free first roll
        </span>
      </div>
    </div>
  );
}
