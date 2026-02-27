'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface RollForSelection {
  id: string;
  title: string;
  theme_name: string | null;
  created_at: string;
  photo_count: number;
  thumbnail_url: string | null;
}

interface RollSelectorProps {
  selectedRollIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxRolls?: number;
}

export function RollSelector({ selectedRollIds, onSelectionChange, maxRolls = 4 }: RollSelectorProps) {
  const [rolls, setRolls] = useState<RollForSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRolls() {
      try {
        const res = await fetch('/api/rolls?status=developed');
        if (res.ok) {
          const { data } = await res.json();
          // Map rolls to selection format
          const mapped = (data || []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            title: (r.title as string) || (r.theme_name as string) || 'Untitled Roll',
            theme_name: r.theme_name as string | null,
            created_at: r.created_at as string,
            photo_count: (r.photo_count as number) || 0,
            thumbnail_url: r.cover_url as string | null,
          }));
          setRolls(mapped);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRolls();
  }, []);

  const toggleRoll = (rollId: string) => {
    if (selectedRollIds.includes(rollId)) {
      onSelectionChange(selectedRollIds.filter((id) => id !== rollId));
    } else if (selectedRollIds.length < maxRolls) {
      onSelectionChange([...selectedRollIds, rollId]);
    }
  };

  const totalPhotos = rolls
    .filter((r) => selectedRollIds.includes(r.id))
    .reduce((sum, r) => sum + r.photo_count, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-[var(--space-section)]">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--color-action)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          Select 1-{maxRolls} rolls &middot; {selectedRollIds.length} selected &middot; {totalPhotos} photos
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-element)]">
        {rolls.map((roll) => {
          const isSelected = selectedRollIds.includes(roll.id);
          const isDisabled = !isSelected && selectedRollIds.length >= maxRolls;

          return (
            <button
              key={roll.id}
              type="button"
              onClick={() => toggleRoll(roll.id)}
              disabled={isDisabled}
              className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-colors min-h-[44px] text-left ${
                isSelected
                  ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                  : isDisabled
                    ? 'border-[var(--color-border)] opacity-40 cursor-not-allowed'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
                {roll.thumbnail_url && (
                  <Image
                    src={roll.thumbnail_url}
                    alt=""
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
                  {roll.title}
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  {roll.photo_count} photos &middot;{' '}
                  {new Date(roll.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Checkbox */}
              <div
                className={`w-6 h-6 rounded-[var(--radius-sharp)] border-2 flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-[var(--color-action)] border-[var(--color-action)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
            </button>
          );
        })}

        {rolls.length === 0 && (
          <p className="text-center text-[length:var(--text-body)] text-[var(--color-ink-tertiary)] py-[var(--space-section)]">
            No developed rolls yet. Develop some rolls first!
          </p>
        )}
      </div>
    </div>
  );
}
