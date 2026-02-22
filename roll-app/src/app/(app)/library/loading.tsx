import { Skeleton, RollCardSkeleton } from '@/components/ui/Skeleton';

export default function LibraryLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <Skeleton variant="text" width="120px" height="32px" />
      <div className="flex gap-[var(--space-tight)]">
        <Skeleton variant="rect" width="80px" height="32px" className="rounded-[var(--radius-pill)]" />
        <Skeleton variant="rect" width="96px" height="32px" className="rounded-[var(--radius-pill)]" />
      </div>
      <div className="flex flex-col gap-[var(--space-element)]">
        <RollCardSkeleton />
        <RollCardSkeleton />
        <RollCardSkeleton />
      </div>
    </div>
  );
}
