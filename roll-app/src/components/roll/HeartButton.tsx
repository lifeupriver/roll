'use client';

import { useState, useCallback } from 'react';

interface HeartButtonProps {
  isHearted: boolean;
  onChange: (hearted: boolean) => void;
  count?: number;
}

export function HeartButton({ isHearted, onChange, count }: HeartButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const handleClick = useCallback(() => {
    const next = !isHearted;
    if (next) {
      setAnimating(true);
      setShowParticles(true);
      const animTimer = setTimeout(() => setAnimating(false), 300);
      const particleTimer = setTimeout(() => setShowParticles(false), 400);
      onChange(next);
      return () => {
        clearTimeout(animTimer);
        clearTimeout(particleTimer);
      };
    }
    onChange(next);
  }, [isHearted, onChange]);

  return (
    <>
      <style>{`
        @keyframes heart-beat {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(0.7);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1.0);
          }
        }

        @keyframes heart-particle {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1) translate(var(--px), var(--py));
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2) translate(var(--px), var(--py));
          }
        }

        .heart-animate {
          animation: heart-beat 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .heart-particle {
          animation: heart-particle 400ms ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .heart-animate {
            animation: none;
          }
          .heart-particle {
            animation: none;
          }
        }
      `}</style>

      <button
        type="button"
        role="checkbox"
        aria-checked={isHearted}
        aria-label={isHearted ? 'Remove from favorites' : 'Mark as favorite'}
        onClick={handleClick}
        className={[
          'relative inline-flex items-center justify-center',
          'min-w-[44px] min-h-[44px]',
          'bg-transparent border-none cursor-pointer',
          'transition-colors duration-150 ease-out',
          isHearted
            ? 'text-[var(--color-heart)]'
            : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-heart)] hover:scale-105',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
        ].join(' ')}
      >
        {/* Particle burst */}
        {showParticles && (
          <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = i * 60 * (Math.PI / 180);
              const dist = 14;
              const px = Math.cos(angle) * dist;
              const py = Math.sin(angle) * dist;
              return (
                <span
                  key={i}
                  className="heart-particle absolute top-1/2 left-1/2 block w-1.5 h-1.5 text-[var(--color-heart)]"
                  style={
                    {
                      '--px': `${px}px`,
                      '--py': `${py}px`,
                    } as React.CSSProperties
                  }
                >
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
              );
            })}
          </span>
        )}

        {/* Color flash circle on favorite */}
        {animating && (
          <span
            className="heart-flash absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--color-heart)] pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Heart icon */}
        <span
          className={animating ? 'heart-animate' : 'transition-transform duration-150 ease-out'}
        >
          {isHearted ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </span>

        {/* Optional count */}
        {count !== undefined && (
          <span className="ml-1 text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium tabular-nums text-current">
            {count}
          </span>
        )}
      </button>
    </>
  );
}
