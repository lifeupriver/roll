'use client';

import { useMemo } from 'react';
import { Heart, Smile, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { CirclePost, ReactionType } from '@/types/circle';

interface CirclePostCardProps {
  post: CirclePost;
  currentUserId: string;
  onReaction: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction: (postId: string, reactionType: ReactionType) => void;
}

const REACTION_CONFIG: { type: ReactionType; icon: typeof Heart; emoji: string }[] = [
  { type: 'heart', icon: Heart, emoji: '\u2764\uFE0F' },
  { type: 'smile', icon: Smile, emoji: '\uD83D\uDE0A' },
  { type: 'wow', icon: Star, emoji: '\uD83E\uDD29' },
];

function getInitial(post: CirclePost): string {
  const name = post.profiles?.display_name || post.profiles?.email || '?';
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
  onReaction,
  onRemoveReaction,
}: CirclePostCardProps) {
  const photos = useMemo(
    () => (post.photos ?? []).sort((a, b) => a.position - b.position),
    [post.photos]
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

  return (
    <Card className="flex flex-col gap-[var(--space-component)] overflow-hidden !p-0">
      {/* Author header */}
      <div className="flex items-center gap-[var(--space-element)] px-[var(--space-component)] pt-[var(--space-component)]">
        {/* Avatar */}
        {post.profiles?.avatar_url ? (
          <img
            src={post.profiles.avatar_url}
            alt={getAuthorName(post)}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center flex-shrink-0">
            <span className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">
              {getInitial(post)}
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

      {/* Photo grid */}
      {photos.length > 0 && (
        <div
          className={`w-full ${
            photos.length === 1
              ? ''
              : 'grid grid-cols-2 gap-0.5'
          }`}
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
        </div>
      )}

      {/* Caption and reactions */}
      <div className="flex flex-col gap-[var(--space-element)] px-[var(--space-component)] pb-[var(--space-component)]">
        {/* Caption */}
        {post.caption && (
          <p className="text-[length:var(--text-body)] text-[var(--color-ink)]">
            {post.caption}
          </p>
        )}

        {/* Reactions */}
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
                      isActive ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-secondary)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
