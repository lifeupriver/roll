import { Skeleton } from '@/components/ui/Skeleton';

export default function UploadLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--space-element)] py-[var(--space-section)]">
      <Skeleton variant="text" width="120px" height="32px" />

      {/* Upload drop zone */}
      <Skeleton
        variant="rect"
        width="100%"
        height="240px"
        className="rounded-[var(--radius-sharp)] max-w-md"
      />

      <Skeleton variant="text" width="180px" />
    </div>
  );
}
