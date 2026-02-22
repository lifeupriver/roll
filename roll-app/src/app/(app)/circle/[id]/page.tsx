'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Copy, Link2, Mail, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { CirclePostCard } from '@/components/circle/CirclePostCard';
import { ShareToCircleModal } from '@/components/circle/ShareToCircleModal';
import { useToast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import { track } from '@/lib/analytics';
import { isValidEmail } from '@/types/auth';
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Members modal state
  const [membersModalOpen, setMembersModalOpen] = useState(false);

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
    setInviteEmail('');

    try {
      const res = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
      });

      if (res.ok) {
        const { data } = await res.json();
        const link = `${window.location.origin}/circle/join/${data.token}`;
        setInviteLink(link);
        track({ event: 'circle_invite_sent', properties: { circleId } });
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

  const handleEmailInvite = async () => {
    if (!isValidEmail(inviteEmail)) {
      toast('Please enter a valid email address', 'error');
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (res.ok) {
        toast(`Invite sent to ${inviteEmail}`, 'success');
        setInviteEmail('');
      } else {
        const { error } = await res.json();
        toast(error || 'Failed to send invite', 'error');
      }
    } catch {
      toast('Failed to send invite', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const res = await fetch(`/api/circles/${circleId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
        toast(`${memberName} removed from circle`, 'success');
      } else {
        const { error } = await res.json();
        toast(error || 'Failed to remove member', 'error');
      }
    } catch {
      toast('Failed to remove member', 'error');
    }
  };

  const handleReaction = useCallback(
    async (postId: string, reactionType: ReactionType) => {
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

  const visibleMembers = members.slice(0, 5);
  const overflowCount = members.length - 5;

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-24">
      {/* Header */}
      <div className="flex flex-col gap-[var(--space-component)]">
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

        {/* Members row — tappable to open members list */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMembersModalOpen(true)}
            className="flex items-center gap-[var(--space-element)] hover:opacity-80 transition-opacity"
          >
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] flex-shrink-0 overflow-hidden"
                  title={member.profiles?.display_name || member.profiles?.email || 'Member'}
                >
                  {member.profiles?.avatar_url ? (
                    <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                      <span className="text-[10px] font-medium text-[var(--color-action)]">
                        {(member.profiles?.display_name || member.profiles?.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-sunken)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-medium text-[var(--color-ink-secondary)]">+{overflowCount}</span>
                </div>
              )}
            </div>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </button>

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

      {/* FAB */}
      <button
        onClick={() => setShareModalOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-[var(--color-action)] text-white shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150 z-30"
        aria-label="Share photos to circle"
      >
        <Share2 size={22} />
      </button>

      {/* Invite Modal — with email invite + link copy */}
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
              {/* Email invite */}
              <div className="flex flex-col gap-[var(--space-tight)]">
                <label className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]">
                  Send invite by email
                </label>
                <div className="flex items-center gap-[var(--space-element)]">
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailInvite();
                    }}
                  />
                  <Button variant="primary" size="sm" onClick={handleEmailInvite} isLoading={emailSending} disabled={!inviteEmail}>
                    <Mail size={14} className="mr-1" /> Send
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-[var(--space-element)]">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">or</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Link invite */}
              <div className="flex flex-col gap-[var(--space-tight)]">
                <label className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]">
                  Share invite link
                </label>
                <div className="flex items-center gap-[var(--space-element)]">
                  <div className="flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] px-[var(--space-element)] py-[var(--space-element)] overflow-hidden">
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-[family-name:var(--font-mono)] truncate">
                      {inviteLink}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                    <Copy size={14} className="mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Expires in 7 days.
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={membersModalOpen} onClose={() => setMembersModalOpen(false)}>
        <div className="flex flex-col gap-[var(--space-component)]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Members
          </h2>
          <div className="flex flex-col gap-[var(--space-tight)]">
            {members.map((member) => {
              const name = member.profiles?.display_name || member.profiles?.email || 'Member';
              const initial = name.charAt(0).toUpperCase();
              const isSelf = member.user_id === user?.id;
              return (
                <div key={member.id} className="flex items-center justify-between py-[var(--space-tight)]">
                  <div className="flex items-center gap-[var(--space-element)]">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                          <span className="text-[12px] font-medium text-[var(--color-action)]">{initial}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                        {name}{isSelf ? ' (you)' : ''}
                      </span>
                      {member.role === 'creator' && (
                        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Creator</span>
                      )}
                    </div>
                  </div>
                  {isCreator && !isSelf && member.role !== 'creator' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id, name)}
                      className="p-[var(--space-tight)] rounded-[var(--radius-sharp)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      aria-label={`Remove ${name}`}
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Share to Circle Modal */}
      <ShareToCircleModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          fetchPosts();
        }}
        circleId={circleId}
      />
    </div>
  );
}
