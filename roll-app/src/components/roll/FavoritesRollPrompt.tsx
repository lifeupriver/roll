'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DISMISS_KEY = 'roll-favorites-prompt-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function FavoritesRollPrompt() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites/unassigned-count');
      if (!res.ok) return;
      const json = await res.json();
      const unassigned = json.count ?? 0;

      if (unassigned >= 36) {
        // Check dismiss state
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10);
          if (Date.now() - dismissedAt < DISMISS_DURATION_MS) return;
        }
        setCount(unassigned);
        setVisible(true);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/rolls/from-favorites', { method: 'POST' });
      if (!res.ok) {
        setCreating(false);
        return;
      }
      const json = await res.json();
      const rollId = json.data?.rollId;
      if (rollId) {
        router.push(`/roll/${rollId}/build`);
      }
    } catch {
      setCreating(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="relative bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)]">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-[var(--space-element)]">
        <div className="w-10 h-10 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center shrink-0">
          <Camera size={20} className="text-[var(--color-action)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] mb-[var(--space-micro)]">
            You have {count} new favorites — create a roll?
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
            Your favorites are ready to be collected into a roll of 36.
          </p>
          <div className="flex items-center gap-[var(--space-element)]">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create a Roll'}
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors min-h-[44px] px-[var(--space-tight)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
