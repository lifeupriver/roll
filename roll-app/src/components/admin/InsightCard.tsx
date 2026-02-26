'use client';

import { StatusBadge } from './StatusBadge';

interface Insight {
  id: string;
  type: string;
  severity: string;
  section: string;
  title: string;
  body: string;
  acknowledged: boolean;
  created_at: string;
}

interface InsightCardProps {
  insight: Insight;
  onAcknowledge?: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  anomaly: '!',
  growth: '↗',
  cost: '$',
  security: '⚑',
  performance: '⚡',
  churn: '↘',
  revenue: '♦',
};

export function InsightCard({ insight, onAcknowledge }: InsightCardProps) {
  const borderColor =
    insight.severity === 'critical'
      ? 'border-l-red-500'
      : insight.severity === 'warning'
        ? 'border-l-amber-500'
        : 'border-l-blue-500';

  const timeAgo = getTimeAgo(insight.created_at);

  return (
    <div
      className={`bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] border-l-2 ${borderColor} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono">{TYPE_ICONS[insight.type] ?? '•'}</span>
            <StatusBadge status={insight.severity} />
            <span className="text-[11px] text-[var(--color-ink-tertiary)]">{insight.section}</span>
            <span className="text-[11px] text-[var(--color-ink-tertiary)]">{timeAgo}</span>
          </div>
          <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
          <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            {insight.body}
          </p>
        </div>

        {!insight.acknowledged && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(insight.id)}
            className="flex-shrink-0 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--color-surface-sunken)]"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
