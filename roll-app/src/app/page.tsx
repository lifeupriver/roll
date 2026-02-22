import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[var(--space-section)]">
      <h1
        className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)]"
      >
        ROLL
      </h1>
      <p className="font-[family-name:var(--font-display)] font-light italic text-[length:var(--text-lead)] text-[var(--color-ink-secondary)]">
        Develop your roll.
      </p>
      <Link
        href="/login"
        className="mt-[var(--space-component)] rounded-[var(--radius-sharp)] bg-[var(--color-action)] px-[var(--space-section)] py-[var(--space-element)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] tracking-[0.02em] text-[var(--color-ink-inverse)] transition-colors duration-150 hover:bg-[var(--color-action-hover)] active:scale-[0.98]"
      >
        Get Started
      </Link>
    </main>
  );
}
