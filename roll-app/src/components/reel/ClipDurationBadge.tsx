'use client';

interface ClipDurationBadgeProps {
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ClipDurationBadge({ durationMs }: ClipDurationBadgeProps) {
  return (
    <span
      className={[
        'absolute bottom-1.5 left-1.5 z-10',
        'px-1.5 py-0.5',
        'bg-[oklch(0_0_0/0.7)]',
        'rounded-sm',
        'font-[family-name:var(--font-mono)]',
        'text-[length:var(--text-caption)]',
        'text-white',
        'leading-none',
        'tabular-nums',
        'pointer-events-none',
      ].join(' ')}
      aria-label={`Duration: ${formatDuration(durationMs)}`}
    >
      {formatDuration(durationMs)}
    </span>
  );
}

export { formatDuration };
