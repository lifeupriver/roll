import { Skeleton } from '@/components/ui/Skeleton';

export default function MemoriesLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <Skeleton variant="text" width="140px" height="32px" />

      {/* Memory card list */}
      <div className="flex flex-col gap-[var(--space-element)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] overflow-hidden flex flex-col"
          >
            <Skeleton variant="photo" width="100%" height="200px" />
            <div className="p-[var(--space-component)] flex flex-col gap-[var(--space-tight)]">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="100px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
