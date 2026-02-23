'use client';

import { useEffect, useState } from 'react';
import { formatDuration } from './ClipDurationBadge';

interface ReelStripProgressProps {
  reelName: string;
  currentDurationMs: number;
  targetDurationMs: number;
  onTap?: () => void;
}

export function ReelStripProgress({
  reelName,
  currentDurationMs,
  targetDurationMs,
  onTap,
}: ReelStripProgressProps) {
  const fillPercent = Math.min((currentDurationMs / targetDurationMs) * 100, 100);
  const isComplete = currentDurationMs >= targetDurationMs;
  const [shimmer, setShimmer] = useState(false);
  const [pulse, setPulse] = useState(false);

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

  return (
    <>
      <style>{`
        .reelstrip-sprockets::before,
        .reelstrip-sprockets::after {
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
        .reelstrip-sprockets::before {
          top: 2px;
        }
        .reelstrip-sprockets::after {
          bottom: 2px;
        }

        @keyframes reelstrip-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes reelstrip-counter-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .reelstrip-shimmer {
          background-image: linear-gradient(
            90deg,
            var(--color-action) 0%,
            var(--color-framecounter) 40%,
            var(--color-stock-golden) 50%,
            var(--color-framecounter) 60%,
            var(--color-action) 100%
          );
          background-size: 200% 100%;
          animation: reelstrip-shimmer 600ms ease-out forwards;
        }

        .reelstrip-counter-pulse {
          animation: reelstrip-counter-pulse 300ms ease-in-out 3;
        }

        @media (prefers-reduced-motion: reduce) {
          .reelstrip-shimmer { animation: none; }
          .reelstrip-counter-pulse { animation: none; }
        }
      `}</style>

      <div
        role="progressbar"
        aria-valuenow={currentDurationMs}
        aria-valuemax={targetDurationMs}
        aria-label={`${reelName}: ${formatDuration(currentDurationMs)} of ${formatDuration(targetDurationMs)}`}
        onClick={onTap}
        className={[
          'w-full h-14 bg-[var(--color-filmstrip)] relative flex items-center cursor-pointer',
          'transition-[filter] duration-150 ease-out hover:brightness-105',
          'fixed bottom-14 left-0 right-0 z-40',
          'md:static md:bottom-auto',
        ].join(' ')}
      >
        {/* Sprocket holes - desktop only */}
        <div className="reelstrip-sprockets absolute inset-0 hidden md:block" />

        {/* Content layer */}
        <div className="relative z-10 flex items-center w-full h-full px-[var(--space-component)]">
          {/* Left: Reel name */}
          <span
            className={[
              'font-[family-name:var(--font-display)] text-[length:var(--text-label)]',
              'text-[var(--color-ink-inverse)]',
              'shrink-0 truncate max-w-[30%] md:max-w-[25%]',
            ].join(' ')}
          >
            {reelName}
          </span>

          {/* Center: Fill bar */}
          <div className="flex-1 mx-[var(--space-element)] md:mx-[var(--space-component)] h-2 rounded-[var(--radius-pill)] bg-[var(--color-sprocket)] overflow-hidden">
            <div
              className={[
                'h-full rounded-[var(--radius-pill)] transition-[width] duration-200 ease-out',
                shimmer ? 'reelstrip-shimmer' : 'bg-[var(--color-action)]',
              ].join(' ')}
              style={{ width: `${fillPercent}%` }}
            />
          </div>

          {/* Right: Duration counter */}
          <span
            className={[
              'font-[family-name:var(--font-mono)] text-[length:var(--text-lead)]',
              'text-[var(--color-framecounter)] tracking-[0.05em]',
              'shrink-0 tabular-nums',
              pulse ? 'reelstrip-counter-pulse' : '',
            ].join(' ')}
          >
            {formatDuration(currentDurationMs)} / {formatDuration(targetDurationMs)}
          </span>
        </div>
      </div>
    </>
  );
}
