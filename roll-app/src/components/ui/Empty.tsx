import type { LucideIcon } from 'lucide-react';

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Empty({ icon: Icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
      <Icon size={48} strokeWidth={1.5} className="text-[var(--color-ink-tertiary)]" />
      <div className="flex flex-col gap-[var(--space-tight)]">
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          {title}
        </h3>
        {description && (
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
