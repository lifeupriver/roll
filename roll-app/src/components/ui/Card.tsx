interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] shadow-[var(--shadow-raised)] p-[var(--space-component)] ${className}`}
    >
      {children}
    </div>
  );
}
