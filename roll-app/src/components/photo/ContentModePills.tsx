'use client';

interface ContentModePillsProps {
  activeMode: string;
  onChange: (mode: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
}

export function ContentModePills({ activeMode, onChange, options }: ContentModePillsProps) {
  return (
    <div
      role="tablist"
      className="flex gap-[var(--space-tight)] overflow-x-auto no-scrollbar"
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={activeMode === option.value}
          onClick={() => onChange(option.value)}
          className={`px-[var(--space-component)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium whitespace-nowrap transition-all duration-150 ease-out ${
            activeMode === option.value
              ? 'bg-[var(--color-ink)] text-[var(--color-ink-inverse)]'
              : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
