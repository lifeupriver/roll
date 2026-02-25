'use client';

import { ShieldCheck } from 'lucide-react';

const PROMISES = [
  'Your photos stay on your phone until you choose to develop them',
  'No training — your photos are never used to train models',
  'No ads, no data sales — we make money from subscriptions and prints',
  'You own your photos — delete your account and everything goes',
  'Private by default — no public profiles, no discoverability',
];

interface PrivacyPromiseProps {
  onContinue: () => void;
}

export function PrivacyPromise({ onContinue }: PrivacyPromiseProps) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-section)] text-center max-w-md animate-[fadeIn_250ms_ease-out]">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-developed)]/10">
        <ShieldCheck size={32} className="text-[var(--color-developed)]" />
      </div>

      <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
        Our promise to you
      </h2>

      <ul className="flex flex-col gap-[var(--space-component)] text-left w-full">
        {PROMISES.map((promise, i) => (
          <li key={i} className="flex items-start gap-[var(--space-element)]">
            <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.5]">
              {promise}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onContinue}
        className="inline-flex items-center justify-center h-12 px-[var(--space-region)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] mt-[var(--space-element)]"
      >
        I understand — let&apos;s go
      </button>
    </div>
  );
}
