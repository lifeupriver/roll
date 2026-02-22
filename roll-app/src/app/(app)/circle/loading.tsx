import { Skeleton } from '@/components/ui/Skeleton';

export default function CircleLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <Skeleton variant="text" width="100px" height="32px" />

      {/* Circle card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)] flex flex-col gap-[var(--space-element)]"
        >
          <div className="flex items-center gap-[var(--space-element)]">
            <Skeleton variant="circle" width="40px" height="40px" />
            <div className="flex flex-col gap-[var(--space-tight)]">
              <Skeleton variant="text" width="120px" />
              <Skeleton variant="text" width="80px" />
            </div>
          </div>
          <div className="flex gap-[var(--space-micro)]">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="w-16 h-16 shrink-0" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
