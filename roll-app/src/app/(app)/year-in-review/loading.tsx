import { Skeleton } from '@/components/ui/Skeleton';

export default function YearInReviewLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Hero section */}
      <div className="flex flex-col items-center gap-[var(--space-element)] py-[var(--space-section)]">
        <Skeleton variant="text" width="220px" height="40px" />
        <Skeleton variant="text" width="160px" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-[var(--space-element)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)] flex flex-col items-center gap-[var(--space-tight)]"
          >
            <Skeleton variant="text" width="48px" height="32px" />
            <Skeleton variant="text" width="64px" />
          </div>
        ))}
      </div>

      {/* Highlight cards */}
      <div className="flex flex-col gap-[var(--space-element)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] overflow-hidden"
          >
            <Skeleton variant="photo" width="100%" height="180px" />
            <div className="p-[var(--space-component)] flex flex-col gap-[var(--space-tight)]">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="120px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
