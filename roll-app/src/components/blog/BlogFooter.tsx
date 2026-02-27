'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface BlogFooterProps {
  displayName: string;
  avatarUrl: string | null;
  blogSlug: string;
  blogDescription: string | null;
}

export function BlogFooter({
  displayName,
  avatarUrl,
  blogSlug,
  blogDescription,
}: BlogFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] pt-[var(--space-section)]">
      <div className="flex items-start gap-[var(--space-component)]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center shrink-0">
            <User size={20} className="text-[var(--color-ink-tertiary)]" />
          </div>
        )}
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
            {displayName}
          </h3>
          {blogDescription && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-micro)]">
              {blogDescription}
            </p>
          )}
          <div className="flex items-center gap-[var(--space-element)] mt-[var(--space-element)]">
            <a
              href={`/blog/${blogSlug}`}
              className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline min-h-[44px] flex items-center"
            >
              View All Posts
            </a>
            <a
              href={`/blog/${blogSlug}#subscribe`}
              className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline min-h-[44px] flex items-center"
            >
              Subscribe by Email
            </a>
          </div>
        </div>
      </div>

      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-component)]">
        &copy; {year} {displayName} &middot; Powered by{' '}
        <a href="https://roll.photos" className="hover:underline">
          Roll
        </a>
      </p>
    </footer>
  );
}
