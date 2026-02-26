'use client';

import { ShoppingBag } from 'lucide-react';

interface BlogPrintCTAProps {
  allowPrints: boolean;
  allowMagazine: boolean;
  allowBook: boolean;
}

export function BlogPrintCTA({ allowPrints, allowMagazine, allowBook }: BlogPrintCTAProps) {
  if (!allowPrints && !allowMagazine && !allowBook) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://roll.photos';

  return (
    <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border border-[var(--color-border)]">
      <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
        <ShoppingBag size={18} className="text-[var(--color-action)]" />
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)]">
          Order from this collection
        </h3>
      </div>

      <div className="flex flex-wrap gap-[var(--space-element)]">
        {allowPrints && (
          <a
            href={`${appUrl}/auth/signup`}
            className="flex-1 min-w-[120px] text-center px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-action)] text-white rounded-[var(--radius-card)] text-[length:var(--text-caption)] font-medium hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center"
          >
            Prints from $0.99
          </a>
        )}
        {allowMagazine && (
          <a
            href={`${appUrl}/auth/signup`}
            className="flex-1 min-w-[120px] text-center px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] rounded-[var(--radius-card)] text-[length:var(--text-caption)] font-medium hover:bg-[var(--color-border)] transition-colors min-h-[44px] flex items-center justify-center border border-[var(--color-border)]"
          >
            Magazine $12.99
          </a>
        )}
        {allowBook && (
          <a
            href={`${appUrl}/auth/signup`}
            className="flex-1 min-w-[120px] text-center px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] rounded-[var(--radius-card)] text-[length:var(--text-caption)] font-medium hover:bg-[var(--color-border)] transition-colors min-h-[44px] flex items-center justify-center border border-[var(--color-border)]"
          >
            Book $29.99
          </a>
        )}
      </div>

      <p className="mt-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        <a href={`${appUrl}/auth/signup`} className="text-[var(--color-action)] hover:underline">
          Sign up for a free Roll account
        </a>{' '}
        to order
      </p>
    </div>
  );
}
