'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  FileText,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/ui/Empty';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import type { BlogPost, BlogSettings } from '@/types/blog';

const STATUS_BADGE: Record<string, 'processing' | 'action' | 'developed' | 'info'> = {
  draft: 'processing',
  published: 'developed',
  archived: 'info',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BlogPostManager() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/posts');
      if (res.ok) {
        const { data } = await res.json();
        setPosts(data || []);
      }
    } catch {
      toast('Failed to load posts', 'error');
    }
  }, [toast]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/settings');
      if (res.ok) {
        const { data } = await res.json();
        setSettings(data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPosts(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchPosts, fetchSettings]);

  const handleArchive = async (postId: string) => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: 'archived' as const } : p))
        );
        toast('Post archived', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to archive', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (postId: string) => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: 'draft' as const } : p))
        );
        toast('Post restored to draft', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to restore', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (postId: string) => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast('Post deleted', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to delete', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPosts = posts.filter((p) => p.status === 'draft');
  const archivedPosts = posts.filter((p) => p.status === 'archived');

  const blogUrl = settings?.blog_slug ? `/blog/${settings.blog_slug}` : null;

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Blog link */}
      {blogUrl && settings?.blog_enabled && (
        <div className="flex items-center gap-[var(--space-element)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border border-[var(--color-border)]">
          <Globe size={16} className="text-[var(--color-action)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Your blog is live at
            </p>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}{blogUrl}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(blogUrl, '_blank')}
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      )}

      {posts.length === 0 && (
        <Empty
          icon={FileText}
          title="No blog posts yet"
          description="Create your first post by publishing a roll from the roll detail page."
        />
      )}

      {/* Published posts */}
      {publishedPosts.length > 0 && (
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
            Published ({publishedPosts.length})
          </h3>
          <div className="flex flex-col gap-[var(--space-element)]">
            {publishedPosts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                blogSlug={settings?.blog_slug || null}
                actionLoading={actionLoading === post.id}
                onArchive={() => handleArchive(post.id)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft posts */}
      {draftPosts.length > 0 && (
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
            Drafts ({draftPosts.length})
          </h3>
          <div className="flex flex-col gap-[var(--space-element)]">
            {draftPosts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                blogSlug={settings?.blog_slug || null}
                actionLoading={actionLoading === post.id}
                onArchive={() => handleArchive(post.id)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived posts */}
      {archivedPosts.length > 0 && (
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
            Archived ({archivedPosts.length})
          </h3>
          <div className="flex flex-col gap-[var(--space-element)]">
            {archivedPosts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                blogSlug={settings?.blog_slug || null}
                actionLoading={actionLoading === post.id}
                onRestore={() => handleRestore(post.id)}
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PostRowProps {
  post: BlogPost;
  blogSlug: string | null;
  actionLoading: boolean;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}

function PostRow({ post, blogSlug, actionLoading, onArchive, onRestore, onDelete }: PostRowProps) {
  const publicUrl = post.status === 'published' && blogSlug
    ? `/blog/${blogSlug}/${post.slug}`
    : null;

  return (
    <div className="flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-micro)]">
          <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
            {post.title}
          </p>
          <Badge variant={STATUS_BADGE[post.status] || 'info'}>
            {post.status}
          </Badge>
        </div>
        <div className="flex items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          {post.view_count > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={12} /> {post.view_count}
            </span>
          )}
          {post.tags.length > 0 && (
            <span>{post.tags.slice(0, 2).join(', ')}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-[var(--space-tight)] shrink-0">
        {publicUrl && (
          <button
            type="button"
            onClick={() => window.open(publicUrl, '_blank')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-action)] transition-colors"
            title="View post"
          >
            <ExternalLink size={16} />
          </button>
        )}
        {onArchive && post.status !== 'archived' && (
          <button
            type="button"
            onClick={onArchive}
            disabled={actionLoading}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
            title="Archive"
          >
            <Archive size={16} />
          </button>
        )}
        {onRestore && post.status === 'archived' && (
          <button
            type="button"
            onClick={onRestore}
            disabled={actionLoading}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-action)] transition-colors disabled:opacity-50"
            title="Restore to draft"
          >
            <RotateCcw size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={actionLoading}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
