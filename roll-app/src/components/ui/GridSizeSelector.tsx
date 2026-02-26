'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'roll-grid-columns';

interface GridSizeSelectorProps {
  value: number;
  onChange: (columns: number) => void;
  options?: number[];
}

export function GridSizeSelector({ value, onChange, options = [2, 3, 4] }: GridSizeSelectorProps) {
  // Sync from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (options.includes(parsed) && parsed !== value) {
          onChange(parsed);
        }
      }
    } catch {
      // localStorage unavailable
    }
  }, [options, onChange, value]);

  const handleChange = (cols: number) => {
    try { localStorage.setItem(STORAGE_KEY, String(cols)); } catch { /* noop */ }
    onChange(cols);
  };

  return (
    <div className="flex items-center gap-[var(--space-micro)]" role="radiogroup" aria-label="Grid columns">
      {options.map((cols) => {
        const isActive = value === cols;
        return (
          <button
            key={cols}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${cols} columns`}
            onClick={() => handleChange(cols)}
            className={`w-8 h-8 rounded-[var(--radius-sharp)] flex items-center justify-center transition-colors duration-150 ${
              isActive
                ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            <GridIcon cols={cols} size={14} />
          </button>
        );
      })}
    </div>
  );
}

function GridIcon({ cols, size }: { cols: number; size: number }) {
  const gap = 1.5;
  const cellSize = (size - gap * (cols - 1)) / cols;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="currentColor" aria-hidden="true">
      {Array.from({ length: cols * cols }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return (
          <rect
            key={i}
            x={col * (cellSize + gap)}
            y={row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}
