'use client';

interface TabOption {
  value: string;
  label: string;
  count?: number;
}

interface TabPillProps {
  activeValue: string;
  onChange: (value: string) => void;
  options: TabOption[];
  variant?: 'primary' | 'secondary';
}

export function TabPill({ activeValue, onChange, options, variant = 'primary' }: TabPillProps) {
  return (
    <div
      role="tablist"
      className="flex gap-[var(--space-tight)] overflow-x-auto no-scrollbar"
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;

        const primaryStyles = isActive
          ? 'bg-[#2A2522] text-[#FAF7F2]'
          : 'bg-[#F3EDE4] text-[#6B5E54] hover:text-[#2A2522]';

        const secondaryStyles = isActive
          ? 'border-b-2 border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent'
          : 'border-b-2 border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] bg-transparent';

        const styles = variant === 'primary' ? primaryStyles : secondaryStyles;
        const shapeStyles = variant === 'primary'
          ? 'rounded-[var(--radius-pill)]'
          : 'rounded-none';

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`px-[var(--space-component)] py-[var(--space-tight)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium whitespace-nowrap transition-all duration-150 ease-out ${shapeStyles} ${styles}`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 opacity-70">({option.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
