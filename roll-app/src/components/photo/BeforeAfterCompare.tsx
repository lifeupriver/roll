'use client';

import { useState, useRef, useCallback } from 'react';

interface BeforeAfterCompareProps {
  originalUrl: string;
  developedUrl: string;
  className?: string;
}

export function BeforeAfterCompare({
  originalUrl,
  developedUrl,
  className,
}: BeforeAfterCompareProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[var(--radius-card)] select-none touch-none cursor-col-resize ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Developed (full image underneath) */}
      <img
        src={developedUrl}
        alt="Developed"
        className="w-full block"
        draggable={false}
      />

      {/* Original (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="w-full block"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-[var(--shadow-floating)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round">
            <path d="M8 6l-4 6 4 6" />
            <path d="M16 6l4 6-4 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-[var(--space-tight)] left-[var(--space-tight)] text-[length:var(--text-caption)] font-medium text-white bg-black/40 px-2 py-0.5 rounded-[var(--radius-pill)] backdrop-blur-sm">
        Original
      </span>
      <span className="absolute top-[var(--space-tight)] right-[var(--space-tight)] text-[length:var(--text-caption)] font-medium text-white bg-black/40 px-2 py-0.5 rounded-[var(--radius-pill)] backdrop-blur-sm">
        Developed
      </span>
    </div>
  );
}
