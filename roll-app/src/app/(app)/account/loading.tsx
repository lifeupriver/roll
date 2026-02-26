import { Skeleton } from '@/components/ui/Skeleton';

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <Skeleton variant="text" width="120px" height="32px" />

      {/* Profile card */}
      <div className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)]">
        <div className="flex items-center gap-[var(--space-component)]">
          <Skeleton variant="circle" width="48px" height="48px" />
          <div className="flex flex-col gap-[var(--space-tight)]">
            <Skeleton variant="text" width="140px" />
            <Skeleton variant="text" width="180px" />
          </div>
        </div>
      </div>

      {/* Subscription card */}
      <div className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)]">
        <Skeleton
          variant="text"
          width="120px"
          height="20px"
          className="mb-[var(--space-element)]"
        />
        <div className="flex items-center justify-between">
          <Skeleton variant="rect" width="64px" height="24px" />
          <Skeleton variant="rect" width="80px" height="32px" />
        </div>
      </div>

      {/* Storage card */}
      <div className="rounded-[var(--radius-sharp)] border border-[var(--color-border)] p-[var(--space-component)]">
        <Skeleton variant="text" width="80px" height="20px" className="mb-[var(--space-element)]" />
        <Skeleton
          variant="rect"
          width="100%"
          height="8px"
          className="rounded-[var(--radius-pill)]"
        />
      </div>
    </div>
  );
}
