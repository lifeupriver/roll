interface BadgeProps {
  variant?: 'developed' | 'processing' | 'action' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'processing', children, className = '' }: BadgeProps) {
  const variants = {
    developed: 'bg-[var(--color-developed)]/10 text-[var(--color-developed)]',
    processing: 'bg-[var(--color-processing)]/10 text-[var(--color-processing)]',
    action: 'bg-[var(--color-action)]/10 text-[var(--color-action)]',
    error: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-[var(--space-tight)] px-[var(--space-tight)] py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium ${variants[variant]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
