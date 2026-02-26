'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EmailCaptureForm({ id, trustLine }: { id?: string; trustLine?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Navigate to auth with email pre-filled
    router.push(`/login?email=${encodeURIComponent(email)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      id={id}
      className="flex flex-col gap-[var(--space-element)] w-full max-w-[400px]"
    >
      <div className="flex gap-[var(--space-tight)]">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          className="flex-1 h-12 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2"
          aria-label="Email address"
        />
        <button
          type="submit"
          className="h-12 px-[var(--space-section)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] whitespace-nowrap"
        >
          Get Started
        </button>
      </div>
      {error && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-error)]">{error}</p>
      )}
      {trustLine && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)] font-light">
          {trustLine}
        </p>
      )}
    </form>
  );
}
