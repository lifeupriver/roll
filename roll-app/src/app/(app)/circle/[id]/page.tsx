'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Copy, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { CirclePostCard } from '@/components/circle/CirclePostCard';
import { ShareToCircleModal } from '@/components/circle/ShareToCircleModal';
import { useToast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import type { Circle, CircleMember, CirclePost, ReactionType } from '@/types/circle';

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const user = useUserStore((s) => s.user);
  const circleId = params.id as string;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const fetchCircleData = useCallback(async () => {
    try {
      const res = await fetch(`/api/circles/${circleId}`);
      if (res.ok) {
        const { data } = await res.json();
        setCircle(data.circle);
        setMembers(data.members ?? []);
      } else {
        router.push('/circle');
      }
    } catch {
      router.push('/circle');
    } finally {
      setLoading(false);
    }
  }, [circleId, router]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/circles/${circleId}/posts`);
      if (res.ok) {
        const { data } = await res.json();
        setPosts(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setPostsLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchCircleData();
    fetchPosts();
  }, [fetchCircleData, fetchPosts]);

  const isCreator = circle?.creator_id === user?.id;

  const handleInvite = async () => {
    setInviteModalOpen(true);
    setInviteLoading(true);
    setInviteLink('');

    try {
      const res = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
      });

      if (res.ok) {
        const { data } = await res.json();
        const link = `${window.location.origin}/circle/join/${data.token}`;
        setInviteLink(link);
      } else {
        const { error } = await res.json();
        toast(error || 'Failed to create invite', 'error');
        setInviteModalOpen(false);
      }
    } catch {
      toast('Something went wrong', 'error');
      setInviteModalOpen(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast('Invite link copied!', 'success');
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

  const handleReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      // Optimistic update
      setPosts((prev) =>
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

      try {
        const res = await fetch(`/api/circles/${circleId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, reactionType }),
        });

        if (!res.ok) {
          // Revert optimistic update
          fetchPosts();
        }
      } catch {
        fetchPosts();
      }
    },
    [circleId, user?.id, fetchPosts]
  );

  const handleRemoveReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            reactions: (p.reactions ?? []).filter(
              (r) =>
                !(r.user_id === user?.id && r.reaction_type === reactionType)
            ),
          };
        })
      );

      try {
        const res = await fetch(`/api/circles/${circleId}/reactions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, reactionType }),
        });

        if (!res.ok) {
          fetchPosts();
        }
      } catch {
        fetchPosts();
      }
    },
    [circleId, user?.id, fetchPosts]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!circle) return null;

  // Show max 5 member avatars
  const visibleMembers = members.slice(0, 5);
  const overflowCount = members.length - 5;

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-24">
      {/* Header */}
      <div className="flex flex-col gap-[var(--space-component)]">
        {/* Back + title row */}
        <div className="flex items-center gap-[var(--space-element)]">
          <button
            onClick={() => router.push('/circle')}
            className="p-[var(--space-tight)] -ml-[var(--space-tight)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Back to circles"
          >
            <ArrowLeft size={20} className="text-[var(--color-ink)]" />
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] flex-1 truncate">
            {circle.name}
          </h1>
        </div>

        {/* Members row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] flex-shrink-0 overflow-hidden"
                  title={member.profiles?.display_name || member.profiles?.email || 'Member'}
                >
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                      <span className="text-[10px] font-medium text-[var(--color-action)]">
                        {(member.profiles?.display_name || member.profiles?.email || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-sunken)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium text-[var(--color-ink-secondary)]">
                    +{overflowCount}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Invite button (creator only) */}
          {isCreator && (
            <Button variant="secondary" size="sm" onClick={handleInvite}>
              <Link2 size={14} className="mr-1" /> Invite
            </Button>
          )}
        </div>
      </div>

      {/* Posts feed */}
      {postsLoading && (
        <div className="flex items-center justify-center py-[var(--space-section)]">
          <Spinner />
        </div>
      )}

      {!postsLoading && posts.length === 0 && (
        <Empty
          icon={Share2}
          title="No posts yet"
          description="Share your favorite photos to get the conversation started."
          action={
            <Button variant="primary" onClick={() => setShareModalOpen(true)}>
              Share Photos
            </Button>
          }
        />
      )}

      {!postsLoading && posts.length > 0 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {posts.map((post) => (
            <CirclePostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? ''}
              onReaction={handleReaction}
              onRemoveReaction={handleRemoveReaction}
            />
          ))}
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setShareModalOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-[var(--color-action)] text-white shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150 z-30"
        aria-label="Share photos to circle"
      >
        <Share2 size={22} />
      </button>

      {/* Invite Modal */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <div className="flex flex-col gap-[var(--space-component)]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Invite to {circle.name}
          </h2>

          {inviteLoading ? (
            <div className="flex items-center justify-center py-[var(--space-section)]">
              <Spinner />
            </div>
          ) : (
            <>
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
                Share this link with someone to invite them to your circle. The link expires in 7 days.
              </p>
              <div className="flex items-center gap-[var(--space-element)]">
                <div className="flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] px-[var(--space-element)] py-[var(--space-element)] overflow-hidden">
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-[family-name:var(--font-mono)] truncate">
                    {inviteLink}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={handleCopyLink}>
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Share to Circle Modal */}
      <ShareToCircleModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          // Refresh posts after sharing
          fetchPosts();
        }}
        circleId={circleId}
      />
    </div>
  );
}
