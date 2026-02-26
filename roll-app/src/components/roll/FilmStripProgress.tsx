'use client';

import { useEffect, useState, useRef } from 'react';

interface FilmStripProgressProps {
  rollName: string;
  currentCount: number;
  maxCount: number;
  onTap?: () => void;
}

export function FilmStripProgress({
  rollName,
  currentCount,
  maxCount,
  onTap,
}: FilmStripProgressProps) {
  const isComplete = currentCount >= maxCount;
  const fillPercent = Math.min((currentCount / maxCount) * 100, 100);
  const [shimmer, setShimmer] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [displayCount, setDisplayCount] = useState(currentCount);
  const [flipping, setFlipping] = useState(false);
  const prevCount = useRef(currentCount);

  useEffect(() => {
    if (isComplete) {
      setShimmer(true);
      setPulse(true);
      const shimmerTimer = setTimeout(() => setShimmer(false), 600);
      const pulseTimer = setTimeout(() => setPulse(false), 900);
      return () => {
        clearTimeout(shimmerTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [isComplete]);

  // Number flip animation when count changes
  useEffect(() => {
    if (currentCount !== prevCount.current) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setDisplayCount(currentCount);
        setFlipping(false);
      }, 100);
      prevCount.current = currentCount;
      return () => clearTimeout(timer);
    }
  }, [currentCount]);

  return (
    <>
      <style>{`
        .filmstrip-sprockets::before,
        .filmstrip-sprockets::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background-image: radial-gradient(
            circle at center,
            var(--color-sprocket) 2px,
            transparent 2px
          );
          background-size: 16px 4px;
          background-repeat: repeat-x;
          pointer-events: none;
        }
        .filmstrip-sprockets::before {
          top: 2px;
        }
        .filmstrip-sprockets::after {
          bottom: 2px;
        }

        @keyframes filmstrip-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes filmstrip-counter-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .filmstrip-shimmer {
          background-image: linear-gradient(
            90deg,
            var(--color-action) 0%,
            var(--color-framecounter) 40%,
            var(--color-stock-golden) 50%,
            var(--color-framecounter) 60%,
            var(--color-action) 100%
          );
          background-size: 200% 100%;
          animation: filmstrip-shimmer 600ms ease-out forwards;
        }

        .filmstrip-counter-pulse {
          animation: filmstrip-counter-pulse 300ms ease-in-out 3;
        }

        @media (prefers-reduced-motion: reduce) {
          .filmstrip-shimmer {
            animation: none;
          }
          .filmstrip-counter-pulse {
            animation: none;
          }
        }
      `}</style>

      <div
        role="progressbar"
        aria-valuenow={currentCount}
        aria-valuemax={maxCount}
        aria-label={`${rollName}: ${currentCount} of ${maxCount} frames`}
        onClick={onTap}
        className={[
          'w-full h-14 bg-[var(--color-filmstrip)] relative flex items-center cursor-pointer',
          'transition-[filter] duration-150 ease-out hover:brightness-105',
          // Mobile: fixed above tab bar
          'fixed bottom-14 left-0 right-0 z-40',
          // Desktop: pinned to bottom of content area
          'md:static md:bottom-auto',
        ].join(' ')}
      >
        {/* Sprocket holes - desktop only */}
        <div className="filmstrip-sprockets absolute inset-0 hidden md:block" />

        {/* Content layer */}
        <div className="relative z-10 flex items-center w-full h-full px-[var(--space-component)]">
          {/* Left zone: Roll name */}
          <span
            className={[
              'font-[family-name:var(--font-display)] text-[length:var(--text-label)]',
              'text-[var(--color-ink-inverse)]',
              'shrink-0 truncate max-w-[30%] md:max-w-[25%]',
            ].join(' ')}
          >
            {rollName}
          </span>

          {/* Center zone: Fill bar — smooth width transition */}
          <div className="flex-1 mx-[var(--space-element)] md:mx-[var(--space-component)] h-2 rounded-[var(--radius-pill)] bg-[var(--color-sprocket)] overflow-hidden">
            <div
              className={[
                'h-full rounded-[var(--radius-pill)] transition-[width] duration-300 ease-out',
                shimmer ? 'filmstrip-shimmer' : 'bg-[var(--color-action)]',
              ].join(' ')}
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          {/* Right zone: Frame counter with number flip */}
          <span
            className={[
              'font-[family-name:var(--font-mono)] text-[length:var(--text-lead)]',
              'text-[var(--color-framecounter)] tracking-[0.05em]',
              'shrink-0 tabular-nums',
              pulse ? 'filmstrip-counter-pulse' : '',
            ].join(' ')}
          >
            <span className="inline-flex items-baseline">
              <span
                className="overflow-hidden inline-block h-[1.2em] relative"
                style={{ width: `${String(displayCount).length}ch` }}
              >
                <span className={flipping ? 'number-flip-enter' : ''} style={{ display: 'block' }}>
                  {displayCount}
                </span>
              </span>
              <span> / {maxCount}</span>
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
