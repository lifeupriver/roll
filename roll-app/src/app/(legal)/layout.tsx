import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="flex items-center justify-between px-[var(--space-component)] py-[var(--space-element)] border-b border-[var(--color-border)]">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-lead)] tracking-[0.15em] text-[var(--color-ink)]"
        >
          ROLL
        </Link>
        <nav className="flex gap-[var(--space-component)]" aria-label="Legal pages">
          <Link
            href="/privacy"
            className="font-[family-name:var(--font-body)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-[family-name:var(--font-body)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline"
          >
            Terms
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
