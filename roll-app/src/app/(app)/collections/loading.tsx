import { Skeleton } from '@/components/ui/Skeleton';

export default function CollectionsLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <Skeleton variant="text" width="160px" height="32px" />

      {/* Collection card grid */}
      <div className="grid grid-cols-2 gap-[var(--space-element)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] overflow-hidden flex flex-col"
          >
            <Skeleton variant="photo" width="100%" height="140px" />
            <div className="p-[var(--space-component)] flex flex-col gap-[var(--space-tight)]">
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="48px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
