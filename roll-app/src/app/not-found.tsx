import { Search, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-[var(--space-section)] p-[var(--space-component)] bg-[var(--color-surface)]">
      <Search size={40} strokeWidth={1.5} className="text-[var(--color-ink-tertiary)]" />
      <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-display)] text-[var(--color-ink)]">
        404
      </h1>
      <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md text-center">
        This page doesn&rsquo;t exist. It may have been moved or the URL might be incorrect.
      </p>
      <Link
        href="/"
        className="flex items-center gap-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-action)] px-[var(--space-component)] py-[var(--space-element)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] transition-opacity hover:opacity-90"
      >
        <Home size={14} />
        Go home
      </Link>
    </div>
  );
}
