'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { BlogAuthorHeader } from './BlogAuthorHeader';
import { BlogPhotoLayout } from './BlogPhotoLayout';
import { BlogPrintCTA } from './BlogPrintCTA';
import { BlogShareBar } from './BlogShareBar';
import { BlogFooter } from './BlogFooter';
import { MessageCircle } from 'lucide-react';
import { smartDesignBlog } from '@/lib/design/design-engine';

interface BlogPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
  aesthetic_score?: number | null;
  face_count?: number | null;
  scene_classification?: string[];
}

interface BlogVideo {
  id: string;
  thumbnail_url: string;
  video_url: string;
  width: number;
  height: number;
  caption: string | null;
  duration_ms: number | null;
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
  /** Video clips from reels to embed inline. */
  videos?: BlogVideo[];
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
  videos = [],
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

  // Use the Smart Design System to create the editorial layout
  const blocks = useMemo(() => {
    const mediaItems = [
      ...photos
        .filter(p => p.id !== coverPhoto?.id)
        .map(p => ({
          id: p.id,
          type: 'photo' as const,
          width: p.width,
          height: p.height,
          caption: p.caption,
          aesthetic_score: p.aesthetic_score ?? null,
          face_count: p.face_count ?? null,
          scene_classification: p.scene_classification ?? [],
          duration_ms: null,
        })),
      ...videos.map(v => ({
        id: v.id,
        type: 'video' as const,
        width: v.width,
        height: v.height,
        caption: v.caption,
        aesthetic_score: null,
        face_count: null,
        scene_classification: [] as string[],
        duration_ms: v.duration_ms,
      })),
    ];

    return smartDesignBlog(mediaItems, post.story);
  }, [photos, videos, coverPhoto?.id, post.story]);

  const publishDate = new Date(post.published_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${author.blog_slug}/${post.slug}`
    : '';

  const totalMediaCount = photoCount + videos.length;

  // Build lookup maps for rendering
  const photoMap = useMemo(() => {
    const map = new Map<string, BlogPhoto>();
    for (const p of photos) map.set(p.id, p);
    return map;
  }, [photos]);

  const videoMap = useMemo(() => {
    const map = new Map<string, BlogVideo>();
    for (const v of videos) map.set(v.id, v);
    return map;
  }, [videos]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <BlogAuthorHeader
        displayName={author.display_name}
        avatarUrl={author.avatar_url}
        blogName={author.blog_name}
        blogSlug={author.blog_slug}
      />

      <article className="max-w-3xl mx-auto px-[var(--space-component)] py-[var(--space-section)]">
        {/* Cover photo — full-width, natural aspect ratio, no cropping */}
        {coverPhoto && (
          <figure className="mb-[var(--space-section)]">
            <Image
              src={coverPhoto.developed_url || coverPhoto.thumbnail_url}
              alt={post.title}
              width={coverPhoto.width || 500}
              height={coverPhoto.height || 500}
              className="w-full rounded-[var(--radius-card)]"
              style={{
                aspectRatio:
                  coverPhoto.width && coverPhoto.height
                    ? `${coverPhoto.width}/${coverPhoto.height}`
                    : undefined,
              }}
              unoptimized
            />
          </figure>
        )}

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
          <time dateTime={post.published_at}>{publishDate}</time>
          <span>&middot;</span>
          <span>
            {totalMediaCount} {totalMediaCount === 1 ? 'photo' : 'photos'}
            {videos.length > 0 && ` + ${videos.length} clip${videos.length > 1 ? 's' : ''}`}
          </span>
          {rollTheme && (
            <>
              <span>&middot;</span>
              <span className="capitalize">{rollTheme} film</span>
            </>
          )}
        </div>

        {/* Title — generous size, tight tracking for editorial feel */}
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] leading-tight tracking-tight mb-[var(--space-component)]">
          {post.title}
        </h1>

        {/* Smart editorial content — photos, videos, text, pull quotes interwoven */}
        <section className="mb-[var(--space-section)]">
          <BlogPhotoLayout
            blocks={blocks}
            photoMap={photoMap}
            videoMap={videoMap}
          />
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
                    <Image
                      src={comment.author_avatar}
                      alt={comment.author_name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      unoptimized
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
