import { Skeleton, PhotoGridSkeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Search bar */}
      <Skeleton
        variant="rect"
        width="100%"
        height="44px"
        className="rounded-[var(--radius-pill)]"
      />

      {/* Filter chips */}
      <div className="flex gap-[var(--space-tight)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rect"
            width="72px"
            height="32px"
            className="rounded-[var(--radius-pill)]"
          />
        ))}
      </div>

      {/* Photo grid results */}
      <PhotoGridSkeleton count={9} />
    </div>
  );
}
