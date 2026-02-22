import { Skeleton, PhotoGridSkeleton } from '@/components/ui/Skeleton';

export default function FeedLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <Skeleton variant="text" width="160px" height="32px" />
        <Skeleton variant="rect" width="96px" height="32px" />
      </div>
      <div className="flex gap-[var(--space-tight)] mb-[var(--space-section)]">
        {['All', 'People', 'Landscapes'].map((label) => (
          <Skeleton
            key={label}
            variant="rect"
            width="80px"
            height="32px"
            className="rounded-[var(--radius-pill)]"
          />
        ))}
      </div>
      <PhotoGridSkeleton count={12} />
    </div>
  );
}
