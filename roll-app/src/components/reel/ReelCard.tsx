'use client';

import { Film, Play } from 'lucide-react';
import { formatDuration } from './ClipDurationBadge';

interface ReelCardProps {
  reel: {
    id: string;
    name: string | null;
    status: 'building' | 'ready' | 'processing' | 'developed' | 'error';
    film_profile: string | null;
    audio_mood: string;
    clip_count: number;
    current_duration_ms: number;
    target_duration_ms: number;
    assembled_duration_ms: number | null;
    created_at: string;
  };
  posterUrl?: string;
  onClick: () => void;
}

const STATUS_CONFIG: Record<
  ReelCardProps['reel']['status'],
  { label: string; color: string; animation: 'none' | 'pulse' | 'spin' }
> = {
  building: { label: 'Building', color: 'var(--color-processing)', animation: 'none' },
  ready: { label: 'Ready', color: 'var(--color-processing)', animation: 'pulse' },
  processing: { label: 'Processing', color: 'var(--color-processing)', animation: 'spin' },
  developed: { label: 'Developed', color: 'var(--color-developed)', animation: 'none' },
  error: { label: 'Error', color: 'var(--color-error)', animation: 'none' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusDot({ status }: { status: ReelCardProps['reel']['status'] }) {
  const config = STATUS_CONFIG[status];

  if (config.animation === 'spin') {
    return (
      <svg className="h-3 w-3 shrink-0 animate-spin" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="5" stroke={config.color} strokeWidth="2" opacity="0.25" />
        <path d="M6 1a5 5 0 014.33 2.5" stroke={config.color} strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      </svg>
    );
  }

  return (
    <span
      className={[
        'inline-block h-1.5 w-1.5 rounded-full shrink-0',
        config.animation === 'pulse' ? 'animate-pulse' : '',
      ].join(' ')}
      style={{ backgroundColor: config.color }}
      aria-hidden="true"
    />
  );
}

export function ReelCard({ reel, posterUrl, onClick }: ReelCardProps) {
  const config = STATUS_CONFIG[reel.status];
  const displayName = reel.name || 'Untitled Reel';
  const duration = reel.assembled_duration_ms ?? reel.current_duration_ms;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${displayName}, ${reel.clip_count} clips, ${config.label}`}
      className={[
        'w-full text-left',
        'bg-[var(--color-surface-raised)]',
        'rounded-[var(--radius-card)]',
        'shadow-[var(--shadow-raised)]',
        'p-[var(--space-component)]',
        'transition-shadow duration-150 ease-out',
        'hover:shadow-[var(--shadow-floating)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
        'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex gap-[var(--space-element)]">
        {/* Poster thumbnail */}
        {posterUrl && (
          <div className="relative shrink-0 w-20 h-14 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]">
            <img src={posterUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={20} className="text-white/80" fill="white" fillOpacity={0.6} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-[var(--space-tight)]">
            <div className="flex items-center gap-[var(--space-tight)] min-w-0">
              <h3 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium tracking-[0.02em] text-[var(--color-ink)] truncate">
                {displayName}
              </h3>
              {reel.film_profile && (
                <span className="flex items-center gap-1 shrink-0">
                  <Film size={14} strokeWidth={1.5} className="text-[var(--color-ink-tertiary)]" aria-hidden="true" />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--color-stock-${reel.film_profile})` }}
                    aria-label={`Film profile: ${reel.film_profile}`}
                  />
                </span>
              )}
            </div>

            <span
              className="inline-flex items-center gap-[var(--space-micro)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium shrink-0"
              style={{ color: config.color }}
            >
              <StatusDot status={reel.status} />
              {config.label}
            </span>
          </div>

          {/* Footer */}
          <p className="mt-[var(--space-micro)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)] font-light truncate">
            {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''}
            {' \u00B7 '}
            <span className="font-[family-name:var(--font-mono)] tracking-[0.02em]">
              {formatDuration(duration)}
            </span>
            {reel.film_profile && (
              <>
                {' \u00B7 '}
                <span className="capitalize">{reel.film_profile}</span>
              </>
            )}
            {' \u00B7 '}
            <span className="font-[family-name:var(--font-mono)] tracking-[0.02em]">
              {formatDate(reel.created_at)}
            </span>
          </p>
        </div>
      </div>
    </button>
  );
}
