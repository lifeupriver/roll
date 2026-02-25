'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BurstPhoto {
  id: string;
  photo_id: string;
  thumbnail_url: string;
  aesthetic_score?: number;
}

interface BurstPickerProps {
  photos: BurstPhoto[];
  onPick: (selectedPhotoId: string, hiddenPhotoIds: string[]) => void;
  onDismiss: () => void;
}

/**
 * Best of Burst — Phase 4.5
 * When multiple similar photos exist (same phash cluster),
 * present a "pick the best" UI. User taps the best one; others are auto-hidden.
 */
export function BurstPicker({ photos, onPick, onDismiss }: BurstPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sort by aesthetic score (best first) to suggest a default
  const sorted = [...photos].sort(
    (a, b) => (b.aesthetic_score ?? 0) - (a.aesthetic_score ?? 0)
  );
  const suggestedId = sorted[0]?.photo_id;

  const handleConfirm = () => {
    const pickId = selectedId || suggestedId;
    if (!pickId) return;
    const hiddenIds = photos
      .filter((p) => p.photo_id !== pickId)
      .map((p) => p.photo_id);
    onPick(pickId, hiddenIds);
  };

  return (
    <div className="flex flex-col gap-[var(--space-element)] p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
            Pick the best shot
          </h3>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {photos.length} similar photos found. Tap your favorite — others will be hidden.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Photo comparison grid */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sorted.map((photo) => {
          const isSelected = selectedId === photo.photo_id;
          const isSuggested = !selectedId && photo.photo_id === suggestedId;

          return (
            <button
              key={photo.photo_id}
              type="button"
              onClick={() => setSelectedId(photo.photo_id)}
              className={`relative flex-shrink-0 w-28 aspect-[3/4] rounded-[var(--radius-sharp)] overflow-hidden transition-all ${
                isSelected || isSuggested
                  ? 'ring-2 ring-[var(--color-action)] scale-[1.02]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={photo.thumbnail_url}
                alt=""
                className="w-full h-full object-cover"
              />
              {(isSelected || isSuggested) && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--color-action)] flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              {isSuggested && !selectedId && (
                <div className="absolute bottom-0 inset-x-0 bg-[var(--color-action)]/80 py-0.5 text-center">
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                    Suggested
                  </span>
                </div>
              )}
              {photo.aesthetic_score !== undefined && (
                <span className="absolute bottom-1.5 left-1.5 font-[family-name:var(--font-mono)] text-[9px] text-white/70 bg-black/30 px-1 py-0.5 rounded">
                  {photo.aesthetic_score.toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Keep All
        </Button>
        <Button variant="primary" size="sm" onClick={handleConfirm}>
          Pick This One
        </Button>
      </div>
    </div>
  );
}
