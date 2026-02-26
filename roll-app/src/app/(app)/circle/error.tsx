'use client';

import { Button } from '@/components/ui/Button';

export default function CircleError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-[var(--space-section)]">
      <p className="text-[var(--color-ink-secondary)] font-[family-name:var(--font-body)] text-[length:var(--text-body)]">
        Something went wrong loading circles.
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
