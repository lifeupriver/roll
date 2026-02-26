'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Camera, Share2, BookOpen, Book, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Nudge {
  id: string;
  type: string;
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  dismissKey: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  roll: <Camera size={18} />,
  share: <Share2 size={18} />,
  magazine: <BookOpen size={18} />,
  book: <Book size={18} />,
  blog: <Globe size={18} />,
};

interface NudgeBannerProps {
  context?: string;
}

export function NudgeBanner({ context }: NudgeBannerProps) {
  const router = useRouter();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchNudges = useCallback(async () => {
    try {
      const res = await fetch('/api/nudges');
      if (res.ok) {
        const { data } = await res.json();
        setNudges(data || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    // Load dismissed nudges from localStorage
    const stored = localStorage.getItem('dismissed-nudges');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, number>;
        const now = Date.now();
        const active = new Set<string>();
        for (const [key, timestamp] of Object.entries(parsed)) {
          // Re-show after 7 days
          if (now - timestamp < 7 * 24 * 60 * 60 * 1000) {
            active.add(key);
          }
        }
        setDismissed(active);
      } catch {
        // ignore
      }
    }

    fetchNudges();
  }, [fetchNudges]);

  const handleDismiss = (dismissKey: string) => {
    setDismissed((prev) => new Set([...prev, dismissKey]));

    const stored = localStorage.getItem('dismissed-nudges');
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[dismissKey] = Date.now();
    localStorage.setItem('dismissed-nudges', JSON.stringify(parsed));
  };

  const visibleNudges = nudges.filter((n) => !dismissed.has(n.dismissKey));

  // Only show context-appropriate nudges if specified
  const filteredNudges = context
    ? visibleNudges.filter((n) => {
        if (context === 'library') return ['roll', 'magazine', 'blog'].includes(n.type);
        if (context === 'projects') return ['magazine', 'book'].includes(n.type);
        if (context === 'roll') return n.type === 'share';
        return true;
      })
    : visibleNudges;

  if (filteredNudges.length === 0) return null;

  // Show only the most important nudge
  const nudge = filteredNudges[0];

  return (
    <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border border-[var(--color-border)] mb-[var(--space-component)]">
      <div className="flex items-start gap-[var(--space-element)]">
        <div className="text-[var(--color-action)] mt-0.5 shrink-0">
          {ICON_MAP[nudge.type] || <Camera size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
            {nudge.title}
          </h3>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-micro)]">
            {nudge.description}
          </p>
          <div className="flex items-center gap-[var(--space-element)] mt-[var(--space-element)]">
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(nudge.actionUrl)}
            >
              {nudge.action}
            </Button>
            <button
              type="button"
              onClick={() => handleDismiss(nudge.dismissKey)}
              className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors min-h-[44px] flex items-center"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleDismiss(nudge.dismissKey)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
