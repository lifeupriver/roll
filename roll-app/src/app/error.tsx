'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-[var(--space-section)] p-[var(--space-component)] bg-[var(--color-surface)]">
      <AlertTriangle size={40} strokeWidth={1.5} className="text-[var(--color-ink-tertiary)]" />
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
        Something went wrong
      </h1>
      <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md text-center">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-[var(--space-element)]">
        <button
          onClick={reset}
          className="flex items-center gap-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-action)] px-[var(--space-component)] py-[var(--space-element)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] transition-opacity hover:opacity-90"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-[var(--space-tight)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] px-[var(--space-component)] py-[var(--space-element)] text-[var(--color-ink)] font-[family-name:var(--font-body)] text-[length:var(--text-label)] transition-opacity hover:opacity-80"
        >
          <Home size={14} />
          Go home
        </Link>
      </div>
    </div>
  );
}
