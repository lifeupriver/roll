'use client';

import Image from 'next/image';
import { Film } from 'lucide-react';

interface RollCardProps {
  roll: {
    id: string;
    name: string | null;
    status: 'building' | 'ready' | 'processing' | 'developed' | 'error';
    film_profile: string | null;
    photo_count: number;
    max_photos: number;
    created_at: string;
  };
  thumbnails?: string[];
  onClick: () => void;
}

const STATUS_CONFIG: Record<
  RollCardProps['roll']['status'],
  { label: string; color: string; animation: 'none' | 'pulse' | 'spin' }
> = {
  building: {
    label: 'Building',
    color: 'var(--color-processing)',
    animation: 'none',
  },
  ready: {
    label: 'Ready',
    color: 'var(--color-processing)',
    animation: 'pulse',
  },
  processing: {
    label: 'Processing',
    color: 'var(--color-processing)',
    animation: 'spin',
  },
  developed: {
    label: 'Developed',
    color: 'var(--color-developed)',
    animation: 'none',
  },
  error: {
    label: 'Error',
    color: 'var(--color-error)',
    animation: 'none',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusDot({ status }: { status: RollCardProps['roll']['status'] }) {
  const config = STATUS_CONFIG[status];

  if (config.animation === 'spin') {
    return (
      <svg
        className="h-3 w-3 shrink-0 animate-spin"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="5" stroke={config.color} strokeWidth="2" opacity="0.25" />
        <path
          d="M6 1a5 5 0 014.33 2.5"
          stroke={config.color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    );
  }

  return (
    <span
      className={[
        'inline-block h-1.5 w-1.5 rounded-full shrink-0',
        config.animation === 'pulse' ? 'rollcard-pulse' : '',
      ].join(' ')}
      style={{ backgroundColor: config.color }}
      aria-hidden="true"
    />
  );
}

export function RollCard({ roll, thumbnails, onClick }: RollCardProps) {
  const config = STATUS_CONFIG[roll.status];
  const displayName = roll.name || 'Untitled Roll';

  return (
    <>
      <style>{`
        @keyframes rollcard-dot-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .rollcard-pulse {
          animation: rollcard-dot-pulse 1.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .rollcard-pulse {
            animation: none;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={onClick}
        aria-label={`${displayName}, ${roll.photo_count} photos, ${config.label}`}
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
        {/* Header row */}
        <div className="flex items-center justify-between gap-[var(--space-tight)]">
          <div className="flex items-center gap-[var(--space-tight)] min-w-0">
            <h3
              className={[
                'font-[family-name:var(--font-display)]',
                'text-[length:var(--text-lead)]',
                'font-medium tracking-[0.02em]',
                'text-[var(--color-ink)]',
                'truncate',
              ].join(' ')}
            >
              {displayName}
            </h3>
            {roll.film_profile && (
              <span className="flex items-center gap-1 shrink-0">
                <Film
                  size={14}
                  strokeWidth={1.5}
                  className="text-[var(--color-ink-tertiary)]"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: `var(--color-stock-${roll.film_profile})`,
                  }}
                  aria-label={`Film profile: ${roll.film_profile}`}
                />
              </span>
            )}
          </div>

          {/* Status badge */}
          <span
            className={[
              'inline-flex items-center gap-[var(--space-micro)]',
              'text-[length:var(--text-caption)]',
              'font-[family-name:var(--font-body)]',
              'font-medium shrink-0',
            ].join(' ')}
            style={{ color: config.color }}
          >
            <StatusDot status={roll.status} />
            {config.label}
          </span>
        </div>

        {/* Photo strip */}
        {thumbnails && thumbnails.length > 0 && (
          <div
            className={[
              'flex gap-[var(--space-micro)]',
              'overflow-x-auto',
              'mt-[var(--space-element)]',
              '-mx-[var(--space-micro)]',
              'px-[var(--space-micro)]',
              'scrollbar-none',
            ].join(' ')}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            aria-hidden="true"
          >
            {thumbnails.map((url, _index) => (
              <Image
                key={url}
                src={url}
                alt=""
                loading="lazy"
                className={[
                  'w-20 h-20 shrink-0',
                  'object-cover',
                  'rounded-[var(--radius-sharp)]',
                  'bg-[var(--color-surface-sunken)]',
                ].join(' ')}
                width={80}
                height={80}
                unoptimized
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <p
          className={[
            'mt-[var(--space-element)]',
            'text-[length:var(--text-caption)]',
            'text-[var(--color-ink-tertiary)]',
            'font-[family-name:var(--font-body)]',
            'font-light',
            'truncate',
          ].join(' ')}
        >
          {roll.photo_count} photo{roll.photo_count !== 1 ? 's' : ''}
          {roll.film_profile && (
            <>
              {' \u00B7 '}
              <span className="capitalize">{roll.film_profile}</span>
            </>
          )}
          {' \u00B7 '}
          <span className="font-[family-name:var(--font-mono)] tracking-[0.02em]">
            {roll.status === 'developed'
              ? `Developed ${formatDate(roll.created_at)}`
              : formatDate(roll.created_at)}
          </span>
        </p>
      </button>
    </>
  );
}
