import { Skeleton } from '@/components/ui/Skeleton';

export default function MapLoading() {
  return (
    <div className="flex flex-col h-full gap-[var(--space-component)]">
      {/* Map controls bar */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="80px" height="32px" />
        <Skeleton
          variant="rect"
          width="36px"
          height="36px"
          className="rounded-[var(--radius-sharp)]"
        />
      </div>

      {/* Full-height map placeholder */}
      <Skeleton
        variant="rect"
        width="100%"
        height="100%"
        className="rounded-[var(--radius-sharp)] min-h-[60vh] bg-[var(--color-surface-sunken)]"
      />
    </div>
  );
}
