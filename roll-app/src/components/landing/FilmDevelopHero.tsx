'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hero visual that transitions from a grey "camera roll" grid to warm,
 * color-graded thumbnails — like film being developed in a darkroom.
 */
export function FilmDevelopHero() {
  const [developing, setDeveloping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Short delay so the user sees the "before" state
          setTimeout(() => setDeveloping(true), 600);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Palette of warm oklch colors for "developed" thumbnails
  const warmColors = [
    'oklch(0.72 0.10 55)', 'oklch(0.65 0.12 40)', 'oklch(0.78 0.06 80)',
    'oklch(0.58 0.14 35)', 'oklch(0.70 0.08 65)', 'oklch(0.62 0.10 50)',
    'oklch(0.75 0.04 90)', 'oklch(0.68 0.12 45)', 'oklch(0.80 0.06 70)',
    'oklch(0.55 0.08 38)', 'oklch(0.73 0.10 58)', 'oklch(0.66 0.14 42)',
    'oklch(0.77 0.05 85)', 'oklch(0.60 0.12 48)', 'oklch(0.71 0.08 62)',
    'oklch(0.64 0.10 52)', 'oklch(0.79 0.06 75)', 'oklch(0.57 0.14 40)',
    'oklch(0.74 0.08 68)', 'oklch(0.67 0.12 44)', 'oklch(0.76 0.05 82)',
    'oklch(0.61 0.10 46)', 'oklch(0.69 0.08 58)', 'oklch(0.63 0.12 50)',
  ];

  return (
    <div
      ref={ref}
      className="w-full max-w-[600px] aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)] border border-[var(--color-border)] relative"
    >
      {/* Thumbnail grid — transitions from grey to warm */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-0.5 p-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[2px] transition-all ease-out"
            style={{
              backgroundColor: developing ? warmColors[i] : 'oklch(0.50 0 0)',
              transitionDuration: `${1200 + i * 60}ms`,
              transitionDelay: `${i * 50}ms`,
              opacity: developing ? 0.8 : 0.25,
            }}
          />
        ))}
      </div>

      {/* Stage label */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center">
        <span
          className="font-[family-name:var(--font-mono)] text-[10px] tracking-wider uppercase transition-all duration-1000"
          style={{
            color: developing ? 'var(--color-action)' : 'var(--color-ink-tertiary)',
            transitionDelay: developing ? '1800ms' : '0ms',
          }}
        >
          {developing ? 'Developed' : 'Camera roll'}
        </span>
      </div>
    </div>
  );
}
