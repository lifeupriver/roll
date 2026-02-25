'use client';

/**
 * HeroVisual — A styled mockup showing the "messy camera roll → curated film strip"
 * transformation. Left side: desaturated chaotic grid. Right side: warm curated strip.
 */
export function HeroVisual() {
  return (
    <div className="w-full max-w-[560px] mx-auto">
      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Left: Messy camera roll grid — desaturated, cluttered */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-4 gap-[2px] rounded-[var(--radius-card)] overflow-hidden opacity-60">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={`messy-${i}`}
                className="aspect-square"
                style={{
                  backgroundColor: `oklch(${0.45 + (i % 5) * 0.08} 0.02 ${60 + (i * 17) % 40})`,
                  filter: 'grayscale(0.6) brightness(0.8)',
                }}
              />
            ))}
            {/* Overlay icons for "junk" — screenshots, blurry */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[var(--color-darkroom)]/60 backdrop-blur-sm rounded-[var(--radius-card)] px-3 py-1.5">
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white/80 tracking-wide">
                  20,000 photos
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
            Before
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-action)]">
            <path d="M5 12h14m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Right: Curated film strip — warm, beautiful */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-3 grid-rows-2 gap-[3px] rounded-[var(--radius-card)] overflow-hidden">
            {[
              { l: 0.72, c: 0.10, h: 55 },
              { l: 0.65, c: 0.08, h: 70 },
              { l: 0.70, c: 0.12, h: 80 },
              { l: 0.60, c: 0.09, h: 45 },
              { l: 0.68, c: 0.11, h: 65 },
              { l: 0.75, c: 0.10, h: 50 },
            ].map((color, i) => (
              <div
                key={`curated-${i}`}
                className="aspect-square"
                style={{
                  backgroundColor: `oklch(${color.l} ${color.c} ${color.h})`,
                  filter: 'saturate(1.1) sepia(0.1) brightness(1.05)',
                }}
              />
            ))}
          </div>
          {/* Film strip sprocket holes decoration */}
          <div className="absolute -top-1 left-0 right-0 flex justify-between px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sprocket-top-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-darkroom)] opacity-30"
              />
            ))}
          </div>
          <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sprocket-bottom-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-darkroom)] opacity-30"
              />
            ))}
          </div>
          <p className="mt-2 text-center font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-action)] tracking-wide uppercase font-medium">
            After
          </p>
        </div>
      </div>
    </div>
  );
}
