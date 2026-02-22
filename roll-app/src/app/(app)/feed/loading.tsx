export default function FeedLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <div className="h-8 w-40 bg-[var(--color-surface-sunken)] skeleton-pulse rounded-[var(--radius-sharp)]" />
        <div className="h-8 w-24 bg-[var(--color-surface-sunken)] skeleton-pulse rounded-[var(--radius-sharp)]" />
      </div>
      <div className="flex gap-[var(--space-tight)] mb-[var(--space-section)]">
        {['All', 'People', 'Landscapes'].map((label) => (
          <div
            key={label}
            className="h-8 w-20 bg-[var(--color-surface-sunken)] skeleton-pulse rounded-[var(--radius-pill)]"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-[var(--space-micro)]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] bg-[var(--color-surface-sunken)] skeleton-pulse"
          />
        ))}
      </div>
    </div>
  );
}
