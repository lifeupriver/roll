'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Image, Grid3X3, Grid2X2, ChevronLeft, ChevronRight,
  Send, Trash2, Settings, Bell, BellOff, Lock, Globe, UserPlus, UserMinus,
  Shield, Eye, EyeOff, X, ChevronDown,
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { CirclePostCard } from '@/components/circle/CirclePostCard';
import { useToast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import type { Circle, CirclePost, CircleComment, ReactionType } from '@/types/circle';

// ---------------------------------------------------------------------------
// Settings types
// ---------------------------------------------------------------------------
interface CircleSettings {
  notifications: 'all' | 'mentions' | 'off';
  privacy: 'private' | 'public';
  whoCanPost: 'everyone' | 'admins';
  approveNewMembers: boolean;
  muteCircle: boolean;
  showActivity: boolean;
}

const DEFAULT_SETTINGS: CircleSettings = {
  notifications: 'all',
  privacy: 'private',
  whoCanPost: 'everyone',
  approveNewMembers: true,
  muteCircle: false,
  showActivity: true,
};

export default function CirclePage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useUserStore((s) => s.user);

  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');

  // Feed posts from all circles
  const [feedPosts, setFeedPosts] = useState<CirclePost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const [gridColumns, setGridColumns] = useState(3);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsCircle, setActiveSettingsCircle] = useState<Circle | null>(null);
  const [settings, setSettings] = useState<CircleSettings>(DEFAULT_SETTINGS);
  const [inviteEmail, setInviteEmail] = useState('');

  // Post detail view state
  const [selectedPost, setSelectedPost] = useState<CirclePost | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [detailCommentText, setDetailCommentText] = useState('');
  const [detailCommentSending, setDetailCommentSending] = useState(false);

  const fetchCircles = useCallback(async () => {
    try {
      const res = await fetch('/api/circles');
      if (res.ok) {
        const { data } = await res.json();
        setCircles(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all circle posts (combined feed)
  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/circles/feed');
      if (res.ok) {
        const { data } = await res.json();
        setFeedPosts(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Load feed on mount
  useEffect(() => {
    if (!loading && circles.length > 0 && feedPosts.length === 0) {
      fetchFeed();
    }
  }, [loading, circles.length, fetchFeed]);

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      setNameError('Circle name is required');
      return;
    }

    if (user?.tier !== 'plus') {
      toast('Upgrade to Roll+ to create circles', 'error');
      setCreateModalOpen(false);
      return;
    }

    setCreating(true);
    setNameError('');

    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: circleName.trim() }),
      });

      if (res.ok) {
        const { data } = await res.json();
        toast('Circle created!', 'success');
        setCreateModalOpen(false);
        setCircleName('');
        router.push(`/circle/${data.id}`);
      } else {
        const { error } = await res.json();
        toast(error || 'Failed to create circle', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Reaction handlers for feed posts
  const handleReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      setFeedPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            reactions: [
              ...(p.reactions ?? []),
              {
                id: `temp-${Date.now()}`,
                post_id: postId,
                user_id: user?.id ?? '',
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
              },
            ],
          };
        })
      );

      const post = feedPosts.find((p) => p.id === postId);
      if (!post) return;

      try {
        await fetch(`/api/circles/${post.circle_id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, reactionType }),
        });
      } catch {
        // Revert on error
      }
    },
    [user?.id, feedPosts]
  );

  const handleRemoveReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      setFeedPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            reactions: (p.reactions ?? []).filter(
              (r) => !(r.user_id === user?.id && r.reaction_type === reactionType)
            ),
          };
        })
      );

      const post = feedPosts.find((p) => p.id === postId);
      if (!post) return;

      try {
        await fetch(`/api/circles/${post.circle_id}/reactions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, reactionType }),
        });
      } catch {
        // Revert on error
      }
    },
    [user?.id, feedPosts]
  );

  const handleCommentAdded = useCallback((postId: string, comment: CircleComment) => {
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, comments: [...(p.comments ?? []), comment] };
      })
    );
  }, []);

  const handleCommentDeleted = useCallback((postId: string, commentId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, comments: (p.comments ?? []).filter((c) => c.id !== commentId) };
      })
    );
  }, []);

  // Keep selectedPost synced with feed post changes
  useEffect(() => {
    if (selectedPost) {
      const updated = feedPosts.find((p) => p.id === selectedPost.id);
      if (updated) setSelectedPost(updated);
    }
  }, [feedPosts]);

  const handleDetailComment = async () => {
    if (!detailCommentText.trim() || detailCommentSending || !selectedPost) return;
    setDetailCommentSending(true);
    try {
      const res = await fetch(`/api/circles/${selectedPost.circle_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: selectedPost.id, text: detailCommentText.trim() }),
      });
      if (res.ok) {
        const { data } = await res.json();
        handleCommentAdded(selectedPost.id, data);
        setDetailCommentText('');
      }
    } catch {
      // Silently fail
    } finally {
      setDetailCommentSending(false);
    }
  };

  const handleDetailDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    try {
      const res = await fetch(`/api/circles/${selectedPost.circle_id}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        handleCommentDeleted(selectedPost.id, commentId);
      }
    } catch {
      // Silently fail
    }
  };

  const openSettings = (circle: Circle) => {
    setActiveSettingsCircle(circle);
    setSettings(DEFAULT_SETTINGS);
    setSettingsOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeSettingsCircle) return;
    try {
      const res = await fetch(`/api/circles/${activeSettingsCircle.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        toast('Invitation sent!', 'success');
        setInviteEmail('');
      } else {
        toast('Failed to send invitation', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    }
  };

  const isPlus = user?.tier === 'plus';

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-8">
      {/* Header with circles list and settings gear */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Circle
        </h1>
        {!loading && circles.length > 0 && (
          <div className="flex items-center gap-[var(--space-tight)]">
            {isPlus && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="p-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
                aria-label="New circle"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Circles row — horizontal scroll of circle avatars */}
      {!loading && circles.length > 0 && (
        <div className="flex gap-[var(--space-component)] overflow-x-auto no-scrollbar pb-[var(--space-tight)]">
          {circles.map((circle) => (
            <div key={circle.id} className="flex flex-col items-center gap-[var(--space-tight)] shrink-0">
              <button
                type="button"
                onClick={() => router.push(`/circle/${circle.id}`)}
                className="relative w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center ring-2 ring-[var(--color-action)]/30 hover:ring-[var(--color-action)] transition-all cursor-pointer"
              >
                <Users size={22} className="text-[var(--color-action)]" />
              </button>
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] text-center max-w-[72px] line-clamp-2 leading-tight">
                {circle.name}
              </span>
              <button
                type="button"
                onClick={() => openSettings(circle)}
                className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
                aria-label={`${circle.name} settings`}
              >
                <Settings size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="lg" />
        </div>
      )}

      {/* No circles at all */}
      {!loading && circles.length === 0 && (
        <Empty
          icon={Users}
          title="No circles yet"
          description={
            isPlus
              ? 'Create a Circle to share your best photos with family and friends.'
              : 'Upgrade to Roll+ to create circles and share your best photos with family and friends.'
          }
          action={
            isPlus ? (
              <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                Create Circle
              </Button>
            ) : (
              <Button variant="primary" onClick={() => router.push('/account')}>
                Upgrade to Roll+
              </Button>
            )
          }
        />
      )}

      {/* Feed — see photos from all your circles */}
      {!loading && circles.length > 0 && (
        <section>
          {feedLoading && (
            <div className="flex items-center justify-center py-[var(--space-section)]">
              <Spinner />
            </div>
          )}

          {!feedLoading && feedPosts.length === 0 && (
            <Empty
              icon={Image}
              title="Your circle feed is empty"
              description="Share photos or invite friends to see their posts here."
            />
          )}

          {!feedLoading && feedPosts.length > 0 && (
            <div className="flex flex-col gap-[var(--space-component)]">
              {feedPosts.map((post) => (
                <CirclePostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id ?? ''}
                  circleId={post.circle_id}
                  onReaction={handleReaction}
                  onRemoveReaction={handleRemoveReaction}
                  onCommentAdded={handleCommentAdded}
                  onCommentDeleted={handleCommentDeleted}
                  onClick={() => {
                    setSelectedPost(post);
                    setSelectedPhotoIndex(0);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Post Detail View — single image with reactions and comments */}
      {selectedPost && (() => {
        const photos = (selectedPost.photos ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position);
        const currentPhoto = photos[selectedPhotoIndex];
        const comments = (selectedPost.comments ?? []).sort(
          (a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const reactions = selectedPost.reactions ?? [];
        const reactionCounts: Record<string, number> = {};
        const userReactions = new Set<string>();
        for (const r of reactions) {
          reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          if (r.user_id === user?.id) userReactions.add(r.reaction_type);
        }
        const authorName = selectedPost.profiles?.display_name || selectedPost.profiles?.email || 'Unknown';
        const authorInitial = authorName.charAt(0).toUpperCase();

        const REACTIONS = [
          { type: 'heart' as ReactionType, emoji: '\u2764\uFE0F' },
          { type: 'smile' as ReactionType, emoji: '\uD83D\uDE0A' },
          { type: 'wow' as ReactionType, emoji: '\uD83E\uDD29' },
        ];

        return (
          <div className="fixed inset-0 z-50 bg-[var(--color-surface)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-[var(--space-element)] px-[var(--space-component)] py-[var(--space-element)] border-b border-[var(--color-border)] shrink-0">
              <BackButton onClick={() => setSelectedPost(null)} />
              <div className="flex items-center gap-[var(--space-element)] flex-1 min-w-0">
                {selectedPost.profiles?.avatar_url ? (
                  <img src={selectedPost.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-[var(--color-action)]/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center shrink-0 ring-2 ring-[var(--color-action)]/30">
                    <span className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">{authorInitial}</span>
                  </div>
                )}
                <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">{authorName}</span>
              </div>
              {photos.length > 1 && (
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                  {selectedPhotoIndex + 1}/{photos.length}
                </span>
              )}
            </div>

            {/* Main content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Image */}
              {currentPhoto && (
                <div className="relative bg-[var(--color-surface-sunken)]">
                  <img
                    src={`/api/photos/serve?key=${encodeURIComponent(currentPhoto.storage_key)}`}
                    alt=""
                    className="w-full max-h-[60vh] object-contain"
                  />
                  {photos.length > 1 && selectedPhotoIndex > 0 && (
                    <button
                      onClick={() => setSelectedPhotoIndex((i) => i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  )}
                  {photos.length > 1 && selectedPhotoIndex < photos.length - 1 && (
                    <button
                      onClick={() => setSelectedPhotoIndex((i) => i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight size={22} />
                    </button>
                  )}
                </div>
              )}

              {/* Caption */}
              {selectedPost.caption && (
                <p className="px-[var(--space-component)] pt-[var(--space-element)] text-[length:var(--text-body)] text-[var(--color-ink)]">
                  {selectedPost.caption}
                </p>
              )}

              {/* Reactions */}
              <div className="flex items-center gap-[var(--space-element)] px-[var(--space-component)] py-[var(--space-element)]">
                {REACTIONS.map(({ type, emoji }) => {
                  const count = reactionCounts[type] || 0;
                  const isActive = userReactions.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (isActive) handleRemoveReaction(selectedPost.id, type);
                        else handleReaction(selectedPost.id, type);
                      }}
                      className={`inline-flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-caption)] transition-all duration-150 ${
                        isActive
                          ? 'bg-[var(--color-action-subtle)] border border-[var(--color-action)]'
                          : 'bg-[var(--color-surface-sunken)] border border-transparent hover:border-[var(--color-border)]'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && (
                        <span className={`font-[family-name:var(--font-mono)] ${isActive ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-secondary)]'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Comments section */}
              <div className="flex flex-col gap-[var(--space-element)] px-[var(--space-component)] pb-[var(--space-component)] border-t border-[var(--color-border)] pt-[var(--space-element)]">
                <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]">
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </span>
                {comments.map((c: CircleComment) => {
                  const cName = c.profiles?.display_name || c.profiles?.email || 'Unknown';
                  const cInitial = cName.charAt(0).toUpperCase();
                  const isOwn = c.user_id === user?.id;
                  return (
                    <div key={c.id} className="flex gap-[var(--space-tight)] group">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden mt-0.5 ring-1 ring-[var(--color-action)]/20">
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                            <span className="text-[9px] font-medium text-[var(--color-action)]">{cInitial}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                          <span className="font-medium">{cName}</span>{' '}{c.body}
                        </p>
                        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                          {(() => {
                            const d = new Date(c.created_at);
                            const now = new Date();
                            const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
                            if (diff < 60) return 'just now';
                            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                            const days = Math.floor(diff / 86400);
                            if (days < 7) return `${days}d ago`;
                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          })()}
                        </span>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => handleDetailDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-2.5 -mr-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] transition-all touch-target"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comment input — fixed at bottom */}
            <div className="flex items-center gap-[var(--space-tight)] px-[var(--space-component)] py-[var(--space-element)] border-t border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
              <input
                type="text"
                value={detailCommentText}
                onChange={(e) => setDetailCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleDetailComment();
                  }
                }}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 h-10 px-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-pill)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)]"
              />
              <button
                onClick={handleDetailComment}
                disabled={!detailCommentText.trim() || detailCommentSending}
                className="p-2 rounded-full text-[var(--color-action)] disabled:opacity-30 hover:bg-[var(--color-action-subtle)] transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Circle Settings Panel — slides in from right */}
      {settingsOpen && activeSettingsCircle && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_150ms_ease-out]"
            onClick={() => setSettingsOpen(false)}
          />
          {/* Settings panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[var(--color-surface)] shadow-[var(--shadow-overlay)] flex flex-col animate-[slideInRight_200ms_ease-out] overflow-hidden">
            {/* Settings header */}
            <div className="flex items-center justify-between px-[var(--space-component)] py-[var(--space-element)] border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-[var(--space-element)]">
                <Settings size={18} className="text-[var(--color-ink-secondary)]" />
                <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                  {activeSettingsCircle.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-2 -mr-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Settings content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Circle info */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-[var(--space-component)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center ring-2 ring-[var(--color-action)]/30">
                    <Users size={24} className="text-[var(--color-action)]" />
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                      {activeSettingsCircle.name}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                      {activeSettingsCircle.member_count} member{activeSettingsCircle.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite members */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <UserPlus size={14} /> Invite Members
                </h3>
                <div className="flex gap-[var(--space-tight)]">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 h-10 px-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)]"
                  />
                  <Button variant="primary" size="sm" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    Invite
                  </Button>
                </div>
              </div>

              {/* Notifications */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Bell size={14} /> Notifications
                </h3>
                <div className="flex flex-col gap-[var(--space-tight)]">
                  {(['all', 'mentions', 'off'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, notifications: opt }))}
                      className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] transition-colors ${
                        settings.notifications === opt
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      {opt === 'all' && <Bell size={16} />}
                      {opt === 'mentions' && <Bell size={16} />}
                      {opt === 'off' && <BellOff size={16} />}
                      <span className="text-[length:var(--text-body)] font-medium capitalize">{opt === 'all' ? 'All notifications' : opt === 'mentions' ? 'Mentions only' : 'Off'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Shield size={14} /> Privacy
                </h3>
                <div className="flex flex-col gap-[var(--space-element)]">
                  {/* Private / Public toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[var(--space-element)]">
                      {settings.privacy === 'private' ? <Lock size={16} className="text-[var(--color-ink-secondary)]" /> : <Globe size={16} className="text-[var(--color-ink-secondary)]" />}
                      <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                        {settings.privacy === 'private' ? 'Private circle' : 'Public circle'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, privacy: s.privacy === 'private' ? 'public' : 'private' }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.privacy === 'private' ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.privacy === 'private' ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {settings.privacy === 'private' ? 'Only invited members can see and join' : 'Anyone with the link can view posts'}
                  </p>

                  {/* Approve new members */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[var(--space-element)]">
                      <UserPlus size={16} className="text-[var(--color-ink-secondary)]" />
                      <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">Approve new members</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, approveNewMembers: !s.approveNewMembers }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.approveNewMembers ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.approveNewMembers ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Posting permissions */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Image size={14} /> Who Can Post
                </h3>
                <div className="flex flex-col gap-[var(--space-tight)]">
                  {(['everyone', 'admins'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, whoCanPost: opt }))}
                      className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] transition-colors ${
                        settings.whoCanPost === opt
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <span className="text-[length:var(--text-body)] font-medium capitalize">
                        {opt === 'everyone' ? 'All members' : 'Admins only'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity & Visibility */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Eye size={14} /> Activity
                </h3>
                <div className="flex flex-col gap-[var(--space-element)]">
                  {/* Mute circle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[var(--space-element)]">
                      {settings.muteCircle ? <EyeOff size={16} className="text-[var(--color-ink-secondary)]" /> : <Eye size={16} className="text-[var(--color-ink-secondary)]" />}
                      <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">Mute this circle</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, muteCircle: !s.muteCircle }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.muteCircle ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.muteCircle ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Show activity status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[var(--space-element)]">
                      <Globe size={16} className="text-[var(--color-ink-secondary)]" />
                      <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">Show activity status</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, showActivity: !s.showActivity }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${settings.showActivity ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.showActivity ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="p-[var(--space-component)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <UserMinus size={14} /> Leave Circle
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast('Leave circle functionality coming soon', 'info');
                  }}
                  className="text-[var(--color-error)]"
                >
                  Leave {activeSettingsCircle.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Circle Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <div className="flex flex-col gap-[var(--space-component)]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Create a Circle
          </h2>
          <Input
            label="Circle Name"
            placeholder="e.g. Family Photos"
            value={circleName}
            onChange={(e) => {
              setCircleName(e.target.value);
              if (nameError) setNameError('');
            }}
            error={nameError}
          />
          <div className="flex gap-[var(--space-element)] justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateModalOpen(false);
                setCircleName('');
                setNameError('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCircle}
              isLoading={creating}
              disabled={!circleName.trim()}
            >
              Create Circle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
