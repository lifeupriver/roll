'use client';

interface SectionDividerProps {
  title: string;
  subtitle?: string;
}

export function SectionDivider({ title, subtitle }: SectionDividerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-tight)]">
      <div className="w-8 h-[1px] bg-[var(--color-border)]" />
      <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {subtitle}
        </p>
      )}
      <div className="w-8 h-[1px] bg-[var(--color-border)]" />
    </div>
  );
}
