interface SkeletonProps {
  className?: string;
  /** Variant controls shape preset */
  variant?: 'text' | 'circle' | 'rect' | 'photo';
  /** Width in CSS units (e.g. "100%", "200px") */
  width?: string;
  /** Height in CSS units */
  height?: string;
}

export function Skeleton({ className = '', variant = 'rect', width, height }: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    text: 'h-4 rounded-[var(--radius-sharp)]',
    circle: 'rounded-full',
    rect: 'rounded-[var(--radius-sharp)]',
    photo: 'aspect-[3/4] rounded-none',
  };

  return (
    <div
      className={`bg-[var(--color-surface-sunken)] skeleton-shimmer ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Grid of photo skeleton placeholders for feed/library loading states */
export function PhotoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-[var(--space-micro)]">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="photo" />
      ))}
    </div>
  );
}

/** Skeleton for a roll card in the library */
export function RollCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)] flex flex-col gap-[var(--space-element)]">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rect" width="64px" height="24px" />
      </div>
      <div className="flex gap-[var(--space-micro)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-12 h-12 shrink-0" />
        ))}
      </div>
      <Skeleton variant="text" width="60%" />
    </div>
  );
}
