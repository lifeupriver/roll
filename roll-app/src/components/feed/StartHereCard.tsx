'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Photo } from '@/types/photo';

interface MomentSuggestion {
  date: string;
  photoCount: number;
  topPhotos: Photo[];
  locationName?: string;
}

export function StartHereCard() {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<MomentSuggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasRolls, setHasRolls] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        // Check if user already has roll photos (not a first-timer)
        const rollsRes = await fetch('/api/rolls');
        if (rollsRes.ok) {
          const { data: rolls } = await rollsRes.json();
          const hasAnyRolls = rolls && rolls.length > 0;
          setHasRolls(hasAnyRolls);
          if (hasAnyRolls) return; // Don't show for experienced users
        }

        // Fetch photos grouped by date to find best starting cluster
        const photosRes = await fetch('/api/photos?limit=50');
        if (photosRes.ok) {
          const { data: photos } = await photosRes.json();
          if (!photos || photos.length < 5) return;

          // Group by date
          const dateGroups = new Map<string, Photo[]>();
          for (const photo of photos) {
            const date = photo.date_taken
              ? new Date(photo.date_taken).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown date';
            if (!dateGroups.has(date)) dateGroups.set(date, []);
            dateGroups.get(date)!.push(photo);
          }

          // Find the largest recent cluster
          let bestDate = '';
          let bestPhotos: Photo[] = [];
          for (const [date, group] of dateGroups) {
            if (group.length > bestPhotos.length) {
              bestDate = date;
              bestPhotos = group;
            }
          }

          if (bestPhotos.length >= 3) {
            // Sort by aesthetic_score descending and take top 4 as preview
            const sorted = [...bestPhotos].sort(
              (a, b) => (b.aesthetic_score ?? 0) - (a.aesthetic_score ?? 0)
            );
            setSuggestion({
              date: bestDate,
              photoCount: bestPhotos.length,
              topPhotos: sorted.slice(0, 4),
            });
          }
        }
      } catch {
        // Non-critical
      }
    }
    check();
  }, []);

  if (dismissed || hasRolls || !suggestion) return null;

  return (
    <div className="mb-[var(--space-component)] rounded-[var(--radius-card)] border border-[var(--color-action)] bg-[var(--color-action-subtle)] p-[var(--space-component)] animate-[fadeIn_250ms_ease-out]">
      <div className="flex items-start justify-between gap-[var(--space-element)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <Sparkles size={18} className="text-[var(--color-action)] shrink-0" />
          <div>
            <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
              Start with your photos from {suggestion.date}
            </p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {suggestion.photoCount} photos — select your favorites to build your first roll
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] shrink-0"
          aria-label="Dismiss suggestion"
        >
          &times;
        </button>
      </div>

      {/* Preview thumbnails */}
      {suggestion.topPhotos.length > 0 && (
        <div className="flex gap-[var(--space-tight)] mt-[var(--space-element)] overflow-hidden rounded-[var(--radius-sharp)]">
          {suggestion.topPhotos.map((photo) => (
            <Image
              key={photo.id}
              src={photo.thumbnail_url}
              alt=""
              className="w-16 h-16 object-cover rounded-[var(--radius-sharp)] bg-[var(--color-surface-sunken)]"
              loading="lazy"
              width={64}
              height={64}
              unoptimized
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/feed')}
        className="flex items-center gap-[var(--space-tight)] mt-[var(--space-element)] text-[length:var(--text-label)] font-medium text-[var(--color-action)] hover:underline"
      >
        Start selecting
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
