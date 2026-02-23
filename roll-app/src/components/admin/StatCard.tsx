interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeLabel, icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = change === undefined
    ? ''
    : isPositive
    ? 'text-[var(--color-developed)]'
    : 'text-[var(--color-error)]';

  return (
    <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-4 border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)]">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--color-ink-tertiary)]">{icon}</span>
        )}
      </div>
      <div className="text-2xl font-[family-name:var(--font-display)] font-medium">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {change !== undefined && (
        <div className={`mt-1 text-xs ${changeColor}`}>
          {isPositive ? '+' : ''}{change}%{changeLabel ? ` ${changeLabel}` : ''}
        </div>
      )}
    </div>
  );
}
