'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Film canister SVG that "develops" as the user pulls down.
 * Fill transitions from transparent to opaque, then spins on release.
 */
function FilmCanisterIcon({ progress, spinning }: { progress: number; spinning: boolean }) {
  const fillOpacity = Math.min(progress, 1);
  const rotation = spinning ? 360 : progress * 180;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: spinning ? 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Film canister body */}
      <rect
        x="8"
        y="4"
        width="16"
        height="24"
        rx="3"
        stroke="var(--color-action)"
        strokeWidth="1.5"
        fill={`oklch(0.57 0.16 42 / ${fillOpacity * 0.3})`}
      />
      {/* Film spool hole */}
      <circle
        cx="16"
        cy="16"
        r="4"
        stroke="var(--color-action)"
        strokeWidth="1.5"
        fill={`oklch(0.57 0.16 42 / ${fillOpacity * 0.5})`}
      />
      {/* Inner hub */}
      <circle
        cx="16"
        cy="16"
        r="1.5"
        fill={`oklch(0.57 0.16 42 / ${fillOpacity})`}
      />
      {/* Film sprocket marks */}
      <rect x="9.5" y="6" width="2" height="1.5" rx="0.5" fill="var(--color-action)" opacity={fillOpacity * 0.6} />
      <rect x="20.5" y="6" width="2" height="1.5" rx="0.5" fill="var(--color-action)" opacity={fillOpacity * 0.6} />
      <rect x="9.5" y="24.5" width="2" height="1.5" rx="0.5" fill="var(--color-action)" opacity={fillOpacity * 0.6} />
      <rect x="20.5" y="24.5" width="2" height="1.5" rx="0.5" fill="var(--color-action)" opacity={fillOpacity * 0.6} />
      {/* Film leader tab */}
      <path
        d="M24 10h3a1 1 0 011 1v2a1 1 0 01-1 1h-3"
        stroke="var(--color-action)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={fillOpacity * 0.8}
      />
    </svg>
  );
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isAtTop() || refreshing) return;
      touchStartY.current = e.touches[0].clientY;
    },
    [isAtTop, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchStartY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta > 0) {
        // Apply resistance — diminishing returns as pull increases
        const resisted = Math.min(delta * 0.4, MAX_PULL);
        setPullDistance(resisted);
      }
    },
    [refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setReleasing(true);
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Hold the spin for a moment before snapping back
        setTimeout(() => {
          setPullDistance(0);
          setRefreshing(false);
          setReleasing(false);
        }, 600);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  // Attach passive touch listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isPastThreshold = pullDistance >= PULL_THRESHOLD;

  return (
    <div ref={containerRef}>
      {/* Pull indicator */}
      <div
        className="flex flex-col items-center justify-end overflow-hidden transition-[height] ease-out"
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : '0px',
          transitionDuration: pullDistance > 0 ? '0ms' : '300ms',
        }}
      >
        <div className="flex flex-col items-center gap-1 pb-2">
          <FilmCanisterIcon progress={progress} spinning={releasing} />
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-wider uppercase transition-all duration-200"
            style={{
              opacity: progress > 0.3 ? 1 : 0,
              color: isPastThreshold ? 'var(--color-action)' : 'var(--color-ink-tertiary)',
            }}
          >
            {refreshing ? 'Developing…' : isPastThreshold ? 'Release to develop' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
