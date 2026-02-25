'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Image, Grid3X3, Grid2X2, ArrowLeft, ChevronLeft, ChevronRight, Heart, Smile, Star, MessageCircle, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { CirclePostCard } from '@/components/circle/CirclePostCard';
import { useToast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import type { Circle, CirclePost, CircleComment, ReactionType } from '@/types/circle';

type CircleView = 'feed' | 'shared' | 'circles';

const VIEW_OPTIONS = [
  { value: 'feed', label: 'Feed' },
  { value: 'shared', label: 'Shared' },
  { value: 'circles', label: 'Circles' },
];

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

  // Shared by me posts
  const [sharedPosts, setSharedPosts] = useState<CirclePost[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  const [activeView, setActiveView] = useState<CircleView>('feed');
  const [gridColumns, setGridColumns] = useState(3);

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

  // Fetch posts shared by current user
  const fetchShared = useCallback(async () => {
    setSharedLoading(true);
    try {
      const res = await fetch('/api/circles/shared');
      if (res.ok) {
        const { data } = await res.json();
        setSharedPosts(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setSharedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Load feed on mount and when switching to feed view
  useEffect(() => {
    if (activeView === 'feed' && feedPosts.length === 0) {
      fetchFeed();
    }
  }, [activeView, fetchFeed]);

  // Load shared when switching to shared view
  useEffect(() => {
    if (activeView === 'shared' && sharedPosts.length === 0) {
      fetchShared();
    }
  }, [activeView, fetchShared]);

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

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Reaction handlers for feed posts
  const handleReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      const updatePosts = (setter: typeof setFeedPosts) => {
        setter((prev) =>
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
      };
      updatePosts(setFeedPosts);
      updatePosts(setSharedPosts);

      const post = [...feedPosts, ...sharedPosts].find((p) => p.id === postId);
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
    [user?.id, feedPosts, sharedPosts]
  );

  const handleRemoveReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      const updatePosts = (setter: typeof setFeedPosts) => {
        setter((prev) =>
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
      };
      updatePosts(setFeedPosts);
      updatePosts(setSharedPosts);

      const post = [...feedPosts, ...sharedPosts].find((p) => p.id === postId);
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
    [user?.id, feedPosts, sharedPosts]
  );

  const handleCommentAdded = useCallback((postId: string, comment: CircleComment) => {
    const updatePosts = (setter: typeof setFeedPosts) => {
      setter((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return { ...p, comments: [...(p.comments ?? []), comment] };
        })
      );
    };
    updatePosts(setFeedPosts);
    updatePosts(setSharedPosts);
  }, []);

  const handleCommentDeleted = useCallback((postId: string, commentId: string) => {
    const updatePosts = (setter: typeof setFeedPosts) => {
      setter((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return { ...p, comments: (p.comments ?? []).filter((c) => c.id !== commentId) };
        })
      );
    };
    updatePosts(setFeedPosts);
    updatePosts(setSharedPosts);
  }, []);

  // When selectedPost changes in feed/shared state, sync it
  const syncSelectedPost = useCallback((postId: string) => {
    const updated = [...feedPosts, ...sharedPosts].find((p) => p.id === postId);
    if (updated) setSelectedPost(updated);
  }, [feedPosts, sharedPosts]);

  // Keep selectedPost synced with feed/shared post changes
  useEffect(() => {
    if (selectedPost) {
      syncSelectedPost(selectedPost.id);
    }
  }, [feedPosts, sharedPosts]);

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

  const isPlus = user?.tier === 'plus';

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-light text-[length:var(--text-page-title)] leading-[0.9] tracking-tight text-[var(--color-ink)]">
          Circle
        </h1>
        {isPlus && (
          <Button variant="secondary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} className="mr-1" /> New Circle
          </Button>
        )}
      </div>

      {/* View toggle: Feed / Shared (profile) / Circles */}
      <ContentModePills
        activeMode={activeView}
        onChange={(mode) => setActiveView(mode as CircleView)}
        options={VIEW_OPTIONS}
      />

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

      {/* Feed view — see photos from your circles */}
      {!loading && circles.length > 0 && activeView === 'feed' && (
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

      {/* Shared view — your posts (profile-like) */}
      {!loading && circles.length > 0 && activeView === 'shared' && (
        <section>
          {/* Profile header */}
          <div className="flex items-center gap-[var(--space-component)] mb-[var(--space-section)]">
            <div className="w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-[var(--color-action)]/30">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[length:var(--text-heading)] font-medium text-[var(--color-action)]">
                  {(user?.display_name || user?.email || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                {user?.display_name || user?.email || 'You'}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {sharedPosts.length} post{sharedPosts.length !== 1 ? 's' : ''} shared
              </p>
            </div>
          </div>

          {sharedLoading && (
            <div className="flex items-center justify-center py-[var(--space-section)]">
              <Spinner />
            </div>
          )}

          {!sharedLoading && sharedPosts.length === 0 && (
            <Empty
              icon={Grid3X3}
              title="No shared posts yet"
              description="Develop a roll, choose your favorites, and share them to a circle."
            />
          )}

          {/* Grid size slider */}
          {!sharedLoading && sharedPosts.length > 0 && (
            <div className="flex items-center justify-end gap-[var(--space-tight)] mb-[var(--space-element)]">
              <Grid2X2 size={14} className="text-[var(--color-ink-tertiary)]" />
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={gridColumns}
                onChange={(e) => setGridColumns(parseInt(e.target.value, 10))}
                className="w-20 accent-[var(--color-action)] cursor-pointer"
                aria-label="Grid columns"
              />
              <Grid3X3 size={14} className="text-[var(--color-ink-tertiary)]" />
            </div>
          )}

          {/* Grid view of shared posts (profile grid style) */}
          {!sharedLoading && sharedPosts.length > 0 && (
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
              {sharedPosts.map((post) => {
                const firstPhoto = (post.photos ?? [])[0];
                const isReel = post.post_type === 'reel';
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => router.push(`/circle/${post.circle_id}`)}
                    className="relative aspect-square bg-[var(--color-surface-sunken)] overflow-hidden"
                  >
                    {isReel && post.reel_poster_key ? (
                      <img
                        src={`/api/photos/serve?key=${encodeURIComponent(post.reel_poster_key)}`}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : firstPhoto ? (
                      <img
                        src={`/api/photos/serve?key=${encodeURIComponent(firstPhoto.storage_key)}`}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={20} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                    {/* Multi-photo indicator */}
                    {!isReel && (post.photos ?? []).length > 1 && (
                      <div className="absolute top-1 right-1">
                        <Grid3X3 size={14} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Circles list view */}
      {!loading && circles.length > 0 && activeView === 'circles' && (
        <section className="flex flex-col gap-[var(--space-component)]">
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => router.push(`/circle/${circle.id}`)}
              className="text-left w-full"
            >
              <Card className="flex items-center justify-between hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer">
                <div className="flex items-center gap-[var(--space-component)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center flex-shrink-0 ring-2 ring-[var(--color-action)]/30">
                    <Users size={20} className="text-[var(--color-action)]" />
                  </div>
                  <div className="flex flex-col gap-[var(--space-tight)]">
                    <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                      {circle.name}
                    </span>
                    <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                      {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                  {formatRelativeDate(circle.updated_at)}
                </span>
              </Card>
            </button>
          ))}
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
              <button
                onClick={() => setSelectedPost(null)}
                className="p-[var(--space-tight)] -ml-[var(--space-tight)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <ArrowLeft size={20} className="text-[var(--color-ink)]" />
              </button>
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
                  {/* Navigation arrows */}
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
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] transition-all"
                        >
                          <Trash2 size={12} />
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
