'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface BlogShareBarProps {
  url: string;
  title: string;
  tags?: string[];
}

export function BlogShareBar({ url, title, tags = [] }: BlogShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`;

  return (
    <div className="flex flex-wrap items-center gap-[var(--space-element)]">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-tight)] mr-[var(--space-element)]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-[var(--space-tight)]">
        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] uppercase tracking-[0.04em]">
          Share:
        </span>
        <button
          type="button"
          onClick={handleCopyLink}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Copy link"
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
        </button>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Share on Twitter"
        >
          Twitter
        </a>
        <a
          href={pinterestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Share on Pinterest"
        >
          Pinterest
        </a>
      </div>
    </div>
  );
}
