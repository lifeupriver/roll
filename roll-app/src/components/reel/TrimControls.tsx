'use client';

import { useState, useCallback, useRef } from 'react';
import { formatDuration } from './ClipDurationBadge';

interface TrimControlsProps {
  durationMs: number;
  initialStartMs: number;
  initialEndMs: number | null;
  thumbnailUrl: string;
  onConfirm: (startMs: number, endMs: number | null) => void;
  onCancel: () => void;
}

export function TrimControls({
  durationMs,
  initialStartMs,
  initialEndMs,
  thumbnailUrl,
  onConfirm,
  onCancel,
}: TrimControlsProps) {
  const [startMs, setStartMs] = useState(initialStartMs);
  const [endMs, setEndMs] = useState<number | null>(initialEndMs);
  const trackRef = useRef<HTMLDivElement>(null);

  const effectiveEnd = endMs ?? durationMs;
  const trimmedDuration = effectiveEnd - startMs;
  const startPercent = (startMs / durationMs) * 100;
  const endPercent = (effectiveEnd / durationMs) * 100;

  const handleTrackInteraction = useCallback(
    (clientX: number, type: 'start' | 'end') => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const ms = Math.round(percent * durationMs);

      if (type === 'start') {
        setStartMs(Math.min(ms, (endMs ?? durationMs) - 1000));
      } else {
        const newEnd = Math.max(ms, startMs + 1000);
        setEndMs(newEnd >= durationMs ? null : newEnd);
      }
    },
    [durationMs, startMs, endMs]
  );

  const handleUseFullClip = useCallback(() => {
    onConfirm(0, null);
  }, [onConfirm]);

  const handleConfirm = useCallback(() => {
    onConfirm(startMs, endMs);
  }, [onConfirm, startMs, endMs]);

  return (
    <div className="bg-[var(--color-surface)] rounded-t-[var(--radius-card)] shadow-[var(--shadow-floating)] p-[var(--space-component)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-element)]">
        <h3 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)]">
          Trim Clip
        </h3>
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] tabular-nums">
          {formatDuration(trimmedDuration)}
        </span>
      </div>

      {/* Timeline preview */}
      <div className="relative mb-[var(--space-element)]">
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-16 object-cover rounded-[var(--radius-sharp)] opacity-30"
        />
        {/* Selected region overlay */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--color-action)]/20 border-x-2 border-[var(--color-action)]"
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
        />
      </div>

      {/* Trim track */}
      <div
        ref={trackRef}
        className="relative h-8 bg-[var(--color-surface-sunken)] rounded-[var(--radius-sharp)] mb-[var(--space-element)] cursor-pointer"
      >
        {/* Selected range */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--color-action)]/15"
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
        />

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-[var(--color-action)] rounded-l-sm cursor-ew-resize flex items-center justify-center"
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            const onMove = (ev: MouseEvent) => handleTrackInteraction(ev.clientX, 'start');
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          <div className="w-0.5 h-3 bg-white rounded-full" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-[var(--color-action)] rounded-r-sm cursor-ew-resize flex items-center justify-center"
          style={{ left: `${endPercent}%`, transform: 'translateX(-100%)' }}
          onMouseDown={(e) => {
            e.preventDefault();
            const onMove = (ev: MouseEvent) => handleTrackInteraction(ev.clientX, 'end');
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        >
          <div className="w-0.5 h-3 bg-white rounded-full" />
        </div>
      </div>

      {/* Time readout */}
      <div className="flex justify-between mb-[var(--space-component)]">
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tabular-nums">
          {formatDuration(startMs)}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tabular-nums">
          {formatDuration(effectiveEnd)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-[var(--space-tight)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-[var(--space-component)] py-[var(--space-tight)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium rounded-[var(--radius-pill)] transition-colors hover:bg-[var(--color-surface-sunken)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUseFullClip}
          className="flex-1 px-[var(--space-component)] py-[var(--space-tight)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium rounded-[var(--radius-pill)] transition-colors hover:bg-[var(--color-surface-sunken)]"
        >
          Use Full Clip
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 px-[var(--space-component)] py-[var(--space-tight)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium rounded-[var(--radius-pill)] transition-colors hover:brightness-105"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
