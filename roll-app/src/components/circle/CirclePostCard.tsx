'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { Heart, Smile, Star, MessageCircle, Send, Trash2, Play, Film } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDuration } from '@/components/reel/ClipDurationBadge';
import type { CirclePost, CircleComment, ReactionType } from '@/types/circle';

interface CirclePostCardProps {
  post: CirclePost;
  currentUserId: string;
  circleId: string;
  onReaction: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction: (postId: string, reactionType: ReactionType) => void;
  onCommentAdded: (postId: string, comment: CircleComment) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
  onClick?: () => void;
}

const REACTION_CONFIG: { type: ReactionType; icon: typeof Heart; emoji: string }[] = [
  { type: 'heart', icon: Heart, emoji: '\u2764\uFE0F' },
  { type: 'smile', icon: Smile, emoji: '\uD83D\uDE0A' },
  { type: 'wow', icon: Star, emoji: '\uD83E\uDD29' },
];

function getInitial(profile?: { display_name: string | null; email: string }): string {
  const name = profile?.display_name || profile?.email || '?';
  return name.charAt(0).toUpperCase();
}

function getAuthorName(post: CirclePost): string {
  return post.profiles?.display_name || post.profiles?.email || 'Unknown';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPhotoUrl(storageKey: string): string {
  return `/api/photos/serve?key=${encodeURIComponent(storageKey)}`;
}

export function CirclePostCard({
  post,
  currentUserId,
  circleId,
  onReaction,
  onRemoveReaction,
  onCommentAdded,
  onCommentDeleted,
  onClick,
}: CirclePostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reelPlaying, setReelPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isReelPost = post.post_type === 'reel';

  const toggleReelPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setReelPlaying(true);
    } else {
      video.pause();
      setReelPlaying(false);
    }
  }, []);

  const photos = useMemo(
    () => (post.photos ?? []).sort((a, b) => a.position - b.position),
    [post.photos]
  );

  const comments = useMemo(
    () =>
      (post.comments ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [post.comments]
  );

  const reactionCounts = useMemo(() => {
    const counts: Record<ReactionType, number> = { heart: 0, smile: 0, wow: 0 };
    for (const r of post.reactions ?? []) {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    }
    return counts;
  }, [post.reactions]);

  const userReactions = useMemo(() => {
    const set = new Set<ReactionType>();
    for (const r of post.reactions ?? []) {
      if (r.user_id === currentUserId) {
        set.add(r.reaction_type);
      }
    }
    return set;
  }, [post.reactions, currentUserId]);

  const handleReactionClick = (type: ReactionType) => {
    if (userReactions.has(type)) {
      onRemoveReaction(post.id, type);
    } else {
      onReaction(post.id, type);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || commentSending) return;
    setCommentSending(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, text: commentText.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        onCommentAdded(post.id, data);
        setCommentText('');
        setShowComments(true);
      }
    } catch {
      // Silently fail
    } finally {
      setCommentSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/circles/${circleId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        onCommentDeleted(post.id, commentId);
      }
    } catch {
      // Silently fail
    }
  };

  const commentCount = comments.length;

  return (
    <Card className="flex flex-col gap-[var(--space-component)] overflow-hidden !p-0">
      {/* Author header */}
      <div className="flex items-center gap-[var(--space-element)] px-[var(--space-component)] pt-[var(--space-component)]">
        {post.profiles?.avatar_url ? (
          <img
            src={post.profiles.avatar_url}
            alt={getAuthorName(post)}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-[var(--color-action)]/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center flex-shrink-0 ring-2 ring-[var(--color-action)]/30">
            <span className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">
              {getInitial(post.profiles)}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
            {getAuthorName(post)}
          </span>
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
      </div>

      {/* Reel video */}
      {isReelPost && post.reel_storage_key && (
        <div className="relative w-full bg-[var(--color-surface-sunken)]">
          <video
            ref={videoRef}
            src={getPhotoUrl(post.reel_storage_key)}
            poster={post.reel_poster_key ? getPhotoUrl(post.reel_poster_key) : undefined}
            className="w-full max-h-[500px] object-contain"
            playsInline
            preload="metadata"
            onEnded={() => setReelPlaying(false)}
          />
          {/* Play/pause overlay */}
          <button
            type="button"
            onClick={toggleReelPlayback}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label={reelPlaying ? 'Pause reel' : 'Play reel'}
          >
            {!reelPlaying && (
              <div className="w-14 h-14 rounded-full bg-[oklch(0_0_0/0.5)] flex items-center justify-center backdrop-blur-sm">
                <Play size={28} className="text-white ml-1" fill="white" fillOpacity={0.9} />
              </div>
            )}
          </button>
          {/* Duration badge */}
          {post.reel_duration_ms && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-[oklch(0_0_0/0.6)] rounded-[4px] font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white tabular-nums">
              {formatDuration(post.reel_duration_ms)}
            </span>
          )}
          {/* Reel badge */}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-[oklch(0_0_0/0.6)] rounded-[4px] text-[length:var(--text-caption)] text-white">
            <Film size={12} /> Reel
          </span>
        </div>
      )}

      {/* Photo grid */}
      {!isReelPost && photos.length > 0 && (
        <button
          type="button"
          onClick={onClick}
          className={`w-full text-left ${
            photos.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
          } ${onClick ? 'cursor-pointer' : ''}`}
        >
          {photos.slice(0, 4).map((photo) => (
            <div
              key={photo.id}
              className={`overflow-hidden bg-[var(--color-surface-sunken)] ${
                photos.length === 1 ? 'w-full' : 'aspect-square'
              }`}
            >
              <img
                src={getPhotoUrl(photo.storage_key)}
                alt=""
                loading="lazy"
                className={`w-full object-cover ${
                  photos.length === 1 ? 'max-h-[500px]' : 'h-full'
                }`}
              />
            </div>
          ))}
        </button>
      )}

      {/* Caption, reactions, and comments */}
      <div className="flex flex-col gap-[var(--space-element)] px-[var(--space-component)] pb-[var(--space-component)]">
        {/* Caption */}
        {post.caption && (
          <p className="text-[length:var(--text-body)] text-[var(--color-ink)]">{post.caption}</p>
        )}

        {/* Reactions + comment toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            {REACTION_CONFIG.map(({ type, emoji }) => {
              const count = reactionCounts[type];
              const isActive = userReactions.has(type);

              return (
                <button
                  key={type}
                  onClick={() => handleReactionClick(type)}
                  className={`inline-flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-caption)] transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-action-subtle)] border border-[var(--color-action)]'
                      : 'bg-[var(--color-surface-sunken)] border border-transparent hover:border-[var(--color-border)]'
                  }`}
                  aria-label={`${type} reaction${isActive ? ' (active)' : ''}`}
                >
                  <span>{emoji}</span>
                  {count > 0 && (
                    <span
                      className={`font-[family-name:var(--font-mono)] ${
                        isActive
                          ? 'text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Comment toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
          >
            <MessageCircle size={14} />
            {commentCount > 0 && (
              <span className="font-[family-name:var(--font-mono)]">{commentCount}</span>
            )}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="flex flex-col gap-[var(--space-element)] border-t border-[var(--color-border)] pt-[var(--space-element)]">
            {/* Existing comments */}
            {comments.map((c) => {
              const cName = c.profiles?.display_name || c.profiles?.email || 'Unknown';
              const isOwn = c.user_id === currentUserId;
              return (
                <div key={c.id} className="flex gap-[var(--space-tight)] group">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden mt-0.5 ring-1 ring-[var(--color-action)]/20">
                    {c.profiles?.avatar_url ? (
                      <img
                        src={c.profiles.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                        <span className="text-[8px] font-medium text-[var(--color-action)]">
                          {getInitial(c.profiles)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink)]">
                      <span className="font-medium">{cName}</span> {c.body}
                    </p>
                    <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                      {formatRelativeTime(c.created_at)}
                    </span>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-2.5 -mr-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] transition-all touch-target"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Comment input */}
            <div className="flex items-center gap-[var(--space-tight)]">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 h-8 px-[var(--space-element)] text-[length:var(--text-caption)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-pill)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)]"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentSending}
                className="p-1.5 rounded-full text-[var(--color-action)] disabled:opacity-30 hover:bg-[var(--color-action-subtle)] transition-colors"
                aria-label="Send comment"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
