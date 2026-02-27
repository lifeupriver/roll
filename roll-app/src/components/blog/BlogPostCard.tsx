'use client';

import Image from 'next/image';

interface BlogPostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
  tags: string[];
  coverPhoto: {
    thumbnail_url: string;
    developed_url: string;
    width: number;
    height: number;
  } | null;
  authorSlug: string;
}

export function BlogPostCard({
  title,
  slug,
  excerpt,
  publishedAt,
  tags,
  coverPhoto,
  authorSlug,
}: BlogPostCardProps) {
  const date = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <a
      href={`/blog/${authorSlug}/${slug}`}
      className="group block rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border-focus)] transition-colors bg-[var(--color-surface)]"
    >
      {coverPhoto && (
        <div className="aspect-[3/2] overflow-hidden bg-[var(--color-surface-sunken)]">
          <Image
            src={coverPhoto.thumbnail_url || coverPhoto.developed_url}
            alt={title}
            width={coverPhoto.width || 500}
            height={coverPhoto.height || 500}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
            unoptimized
          />
        </div>
      )}
      <div className="p-[var(--space-component)]">
        <time
          dateTime={publishedAt}
          className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]"
        >
          {date}
        </time>
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)] mt-[var(--space-micro)] line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-tight)] line-clamp-3">
            {excerpt}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-[var(--space-tight)] mt-[var(--space-element)]">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[length:var(--text-caption)] text-[var(--color-action)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
