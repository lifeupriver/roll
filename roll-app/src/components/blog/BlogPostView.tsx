'use client';

import { useEffect } from 'react';
import { BlogAuthorHeader } from './BlogAuthorHeader';
import { BlogPhotoLayout } from './BlogPhotoLayout';
import { BlogPrintCTA } from './BlogPrintCTA';
import { BlogShareBar } from './BlogShareBar';
import { BlogFooter } from './BlogFooter';
import { MessageCircle } from 'lucide-react';

interface BlogPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
}

interface BlogComment {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

interface BlogPostViewProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    story: string | null;
    published_at: string;
    tags: string[];
    view_count: number;
    allow_print_orders: boolean;
    allow_magazine_orders: boolean;
    allow_book_orders: boolean;
  };
  author: {
    display_name: string;
    avatar_url: string | null;
    blog_slug: string;
    blog_name: string | null;
    blog_description: string | null;
  };
  coverPhoto: {
    id: string;
    thumbnail_url: string;
    developed_url: string;
    width: number;
    height: number;
  } | null;
  photos: BlogPhoto[];
  photoCount: number;
  rollTheme: string | null;
  comments: BlogComment[];
  commentCount: number;
}

export function BlogPostView({
  post,
  author,
  coverPhoto,
  photos,
  photoCount,
  rollTheme,
  comments,
  commentCount,
}: BlogPostViewProps) {
  // Record view on mount
  useEffect(() => {
    const key = `blog-view-${post.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    fetch(`/api/blog/${author.blog_slug}/${post.slug}/views`, {
      method: 'POST',
    }).catch(() => {});
  }, [post.id, post.slug, author.blog_slug]);

  const publishDate = new Date(post.published_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${author.blog_slug}/${post.slug}`
    : '';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <BlogAuthorHeader
        displayName={author.display_name}
        avatarUrl={author.avatar_url}
        blogName={author.blog_name}
        blogSlug={author.blog_slug}
      />

      <article className="max-w-3xl mx-auto px-[var(--space-component)] py-[var(--space-section)]">
        {/* Cover photo */}
        {coverPhoto && (
          <figure className="mb-[var(--space-section)]">
            <img
              src={coverPhoto.developed_url || coverPhoto.thumbnail_url}
              alt={post.title}
              className="w-full rounded-[var(--radius-card)] object-cover"
              style={{
                aspectRatio:
                  coverPhoto.width && coverPhoto.height
                    ? `${coverPhoto.width}/${coverPhoto.height}`
                    : undefined,
              }}
            />
          </figure>
        )}

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
          <time dateTime={post.published_at}>{publishDate}</time>
          <span>&middot;</span>
          <span>{photoCount} photos</span>
          {rollTheme && (
            <>
              <span>&middot;</span>
              <span className="capitalize">{rollTheme} film</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] leading-tight mb-[var(--space-component)]">
          {post.title}
        </h1>

        {/* Story */}
        {post.story && (
          <div className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-line mb-[var(--space-section)]">
            {post.story}
          </div>
        )}

        {/* Photos */}
        <section className="mb-[var(--space-section)]">
          <BlogPhotoLayout photos={photos} />
        </section>

        {/* Print CTA */}
        <section className="mb-[var(--space-section)]">
          <BlogPrintCTA
            allowPrints={post.allow_print_orders}
            allowMagazine={post.allow_magazine_orders}
            allowBook={post.allow_book_orders}
          />
        </section>

        {/* Comments */}
        <section className="mb-[var(--space-section)]">
          <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-component)]">
            <MessageCircle size={18} className="text-[var(--color-ink-secondary)]" />
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)]">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </h2>
          </div>

          {comments.length > 0 ? (
            <div className="flex flex-col gap-[var(--space-component)]">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-[var(--space-element)]">
                  {comment.author_avatar ? (
                    <img
                      src={comment.author_avatar}
                      alt={comment.author_name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-sunken)] shrink-0" />
                  )}
                  <div>
                    <div className="flex items-baseline gap-[var(--space-tight)]">
                      <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink)]">
                        {comment.author_name}
                      </span>
                      <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-micro)]">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              No comments yet.
            </p>
          )}

          <a
            href="/auth/signup"
            className="inline-block mt-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline"
          >
            Sign up free to comment
          </a>
        </section>

        {/* Share & Tags */}
        <section className="mb-[var(--space-section)]">
          <BlogShareBar url={postUrl} title={post.title} tags={post.tags} />
        </section>

        {/* Footer */}
        <BlogFooter
          displayName={author.display_name}
          avatarUrl={author.avatar_url}
          blogSlug={author.blog_slug}
          blogDescription={author.blog_description}
        />
      </article>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
