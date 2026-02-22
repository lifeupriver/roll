interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="film-grain min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-[var(--space-component)]">
      <div className="w-full max-w-[400px] flex flex-col gap-[var(--space-section)]">
        <div className="text-center flex flex-col gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)]">
            ROLL
          </h1>
          <p className="font-[family-name:var(--font-display)] font-light italic text-[length:var(--text-lead)] text-[var(--color-ink-secondary)]">
            Develop your roll.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
