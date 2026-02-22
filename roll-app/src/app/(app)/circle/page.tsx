'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import type { Circle } from '@/types/circle';

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

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

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

  const isPlus = user?.tier === 'plus';

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
          Circle
        </h1>
        {circles.length > 0 && isPlus && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} className="mr-1" /> New Circle
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
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

      {/* Circle list */}
      {!loading && circles.length > 0 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => router.push(`/circle/${circle.id}`)}
              className="text-left w-full"
            >
              <Card className="flex items-center justify-between hover:bg-[var(--color-surface-sunken)] transition-colors cursor-pointer">
                <div className="flex items-center gap-[var(--space-component)]">
                  {/* Circle avatar */}
                  <div className="w-12 h-12 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center flex-shrink-0">
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
