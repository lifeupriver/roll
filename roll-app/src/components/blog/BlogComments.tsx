'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
}

interface BlogCommentsProps {
  authorSlug: string;
  postSlug: string;
  postOwnerId: string;
  currentUserId: string | null;
}

export function BlogComments({ authorSlug, postSlug, postOwnerId, currentUserId }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/${authorSlug}/${postSlug}/comments`);
      if (res.ok) {
        const { data } = await res.json();
        setComments(data.comments);
        setTotal(data.total);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [authorSlug, postSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/blog/${authorSlug}/${postSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setComments((prev) => [...prev, data]);
        setTotal((prev) => prev + 1);
        setNewComment('');
      }
    } catch {
      // silently fail
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/blog/${authorSlug}/${postSlug}/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setTotal((prev) => prev - 1);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <section>
      <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-component)]">
        <MessageCircle size={18} className="text-[var(--color-ink-secondary)]" />
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)]">
          {total} {total === 1 ? 'comment' : 'comments'}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-[var(--space-component)]">
          <div className="animate-spin w-5 h-5 border-2 border-[var(--color-action)] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="flex flex-col gap-[var(--space-component)] mb-[var(--space-component)]">
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
                  <div className="flex-1">
                    <div className="flex items-baseline gap-[var(--space-tight)]">
                      <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink)]">
                        {comment.author_name}
                      </span>
                      <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                      {(currentUserId === comment.user_id || currentUserId === postOwnerId) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-red-500 transition-colors"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-micro)]">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment form or auth gate */}
          {currentUserId ? (
            <div className="flex gap-[var(--space-tight)]">
              <textarea
                value={newComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-caption)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none min-h-[44px]"
                maxLength={2000}
                rows={2}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handlePost}
                isLoading={posting}
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          ) : (
            <a
              href="/auth/signup"
              className="inline-block text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline"
            >
              Sign up free to leave a comment
            </a>
          )}
        </>
      )}
    </section>
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
