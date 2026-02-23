import { Skeleton, PhotoGridSkeleton } from '@/components/ui/Skeleton';

export default function RollDetailLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Roll header */}
      <div className="flex flex-col gap-[var(--space-element)]">
        <Skeleton variant="text" width="200px" height="32px" />
        <div className="flex items-center gap-[var(--space-tight)]">
          <Skeleton variant="circle" width="28px" height="28px" />
          <Skeleton variant="text" width="100px" />
        </div>
        <Skeleton variant="text" width="140px" />
      </div>

      {/* Photo grid */}
      <PhotoGridSkeleton count={12} />
    </div>
  );
}
