'use client';

import { User } from 'lucide-react';

interface BlogAuthorHeaderProps {
  displayName: string;
  avatarUrl: string | null;
  blogName: string | null;
  blogSlug: string;
  showSubscribe?: boolean;
}

export function BlogAuthorHeader({
  displayName,
  avatarUrl,
  blogName,
  blogSlug,
  showSubscribe = true,
}: BlogAuthorHeaderProps) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <header className="flex items-center justify-between px-[var(--space-component)] py-[var(--space-element)] border-b border-[var(--color-border)]">
      <a
        href={`/blog/${blogSlug}`}
        className="flex items-center gap-[var(--space-element)] min-h-[44px]"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
            <User size={16} className="text-[var(--color-ink-tertiary)]" />
          </div>
        )}
        <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
          {blogName || displayName}
        </span>
      </a>

      <div className="flex items-center gap-[var(--space-element)]">
        {showSubscribe && (
          <a
            href={`/blog/${blogSlug}#subscribe`}
            className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline min-h-[44px] flex items-center"
          >
            Subscribe
          </a>
        )}
        <a
          href={appUrl || 'https://roll.photos'}
          className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors min-h-[44px] flex items-center"
        >
          Powered by Roll
        </a>
      </div>
    </header>
  );
}
