'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { FilmStripProgress } from '@/components/roll/FilmStripProgress';
import { ReelStripProgress } from '@/components/reel/ReelStripProgress';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { usePhotos } from '@/hooks/usePhotos';
import { useRollStore } from '@/stores/rollStore';
import { useReelStore } from '@/stores/reelStore';
import { track } from '@/lib/analytics';
import type { ContentMode } from '@/types/photo';
import { Badge } from '@/components/ui/Badge';

export default function FeedPage() {
  const router = useRouter();
  const { photos, contentMode, setContentMode, loading, hasMore, loadMore, hidePhoto } =
    usePhotos();

  const { currentRoll, checkedPhotoIds, rollCount, checkPhoto, uncheckPhoto, isChecked, setRoll } =
    useRollStore();

  const {
    currentReel,
    clipIds,
    reelCount,
    currentDurationMs,
    isClipAdded,
    addClip,
    removeClip,
    setReel: setReelState,
  } = useReelStore();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  // Determine if we're in clip mode (building a reel)
  const isClipMode = contentMode === 'clips';

  useEffect(() => {
    setContentMode('all');
  }, []);

  // Load active roll on mount
  useEffect(() => {
    async function loadActiveRoll() {
      try {
        const res = await fetch('/api/rolls');
        if (res.ok) {
          const { data } = await res.json();
          const buildingRoll = data?.find(
            (r: { status: string }) => r.status === 'building' || r.status === 'ready'
          );
          if (buildingRoll) {
            setRoll(buildingRoll);
            // Load checked photo IDs for this roll
            const rollRes = await fetch(`/api/rolls/${buildingRoll.id}`);
            if (rollRes.ok) {
              const rollData = await rollRes.json();
              if (rollData.data?.photos) {
                const store = useRollStore.getState();
                for (const rp of rollData.data.photos) {
                  store.checkPhoto(rp.photo_id);
                }
              }
            }
          }
        }
      } catch {
        // Silently fail — no active roll is fine
      }
    }
    loadActiveRoll();
  }, [setRoll]);

  // Load active reel on mount
  useEffect(() => {
    async function loadActiveReel() {
      try {
        const res = await fetch('/api/reels');
        if (res.ok) {
          const { data } = await res.json();
          const buildingReel = data?.find(
            (r: { status: string }) => r.status === 'building' || r.status === 'ready'
          );
          if (buildingReel) {
            setReelState(buildingReel);
            const reelRes = await fetch(`/api/reels/${buildingReel.id}`);
            if (reelRes.ok) {
              const reelData = await reelRes.json();
              if (reelData.data?.clips) {
                const store = useReelStore.getState();
                store.setReelClips(reelData.data.clips);
              }
            }
          }
        }
      } catch {
        // No active reel is fine
      }
    }
    loadActiveReel();
  }, [setReelState]);

  const contentModeOptions = [
    { value: 'all', label: 'All' },
    { value: 'people', label: 'People' },
    { value: 'landscapes', label: 'Landscapes' },
    { value: 'clips', label: 'Clips' },
  ];

  const handleCheck = useCallback(
    async (photoId: string) => {
      if (isChecked(photoId)) {
        uncheckPhoto(photoId);
        track({
          event: 'photo_unchecked',
          properties: { rollId: currentRoll?.id || '', photoCount: rollCount - 1 },
        });
        // Remove from roll in backend
        if (currentRoll) {
          try {
            await fetch(`/api/rolls/${currentRoll.id}/photos`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId }),
            });
          } catch {
            // Revert on error
            checkPhoto(photoId);
          }
        }
      } else {
        // If no roll exists, create one
        let rollId = currentRoll?.id;
        if (!rollId) {
          try {
            const createRes = await fetch('/api/rolls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            if (createRes.ok) {
              const { data: newRoll } = await createRes.json();
              setRoll(newRoll);
              rollId = newRoll.id;
              track({ event: 'roll_created', properties: { rollId: newRoll.id } });
            }
          } catch {
            return;
          }
        }

        checkPhoto(photoId);
        track({
          event: 'photo_checked',
          properties: { rollId: rollId || '', photoCount: rollCount + 1 },
        });
        // Add to roll in backend
        if (rollId) {
          try {
            const res = await fetch(`/api/rolls/${rollId}/photos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId }),
            });
            if (res.ok) {
              const { rollStatus } = await res.json();
              if (rollStatus === 'ready' && currentRoll) {
                setRoll({ ...currentRoll, status: 'ready', photo_count: 36 });
                track({ event: 'roll_filled', properties: { rollId: currentRoll.id } });
              }
            }
          } catch {
            uncheckPhoto(photoId);
          }
        }
      }
    },
    [isChecked, currentRoll, checkPhoto, uncheckPhoto, setRoll]
  );

  // Handle video clip check (add to reel)
  const handleClipCheck = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo || photo.media_type !== 'video') return;

      if (isClipAdded(photoId)) {
        removeClip(photoId);
        track({ event: 'clip_removed', properties: { reelId: currentReel?.id || '' } });
        if (currentReel) {
          try {
            await fetch(`/api/reels/${currentReel.id}/clips`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId }),
            });
          } catch {
            addClip(photoId, photo.duration_ms ?? 0);
          }
        }
      } else {
        let reelId = currentReel?.id;
        if (!reelId) {
          try {
            const createRes = await fetch('/api/reels', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            if (createRes.ok) {
              const { data: newReel } = await createRes.json();
              setReelState(newReel);
              reelId = newReel.id;
              track({ event: 'reel_created', properties: { reelId: newReel.id } });
            }
          } catch {
            return;
          }
        }

        addClip(photoId, photo.duration_ms ?? 0);
        track({
          event: 'clip_added',
          properties: { reelId: reelId || '', clipCount: reelCount + 1 },
        });

        if (reelId) {
          try {
            const res = await fetch(`/api/reels/${reelId}/clips`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoId }),
            });
            if (res.ok) {
              const { reelStatus } = await res.json();
              if (reelStatus === 'ready' && currentReel) {
                setReelState({ ...currentReel, status: 'ready' });
                track({ event: 'reel_filled', properties: { reelId: currentReel.id } });
              }
            }
          } catch {
            removeClip(photoId);
          }
        }
      }
    },
    [photos, isClipAdded, currentReel, addClip, removeClip, setReelState, reelCount]
  );

  const handlePhotoTap = useCallback(
    (photoId: string) => {
      const index = photos.findIndex((p) => p.id === photoId);
      if (index >= 0) setLightboxIndex(index);
    },
    [photos]
  );

  const handleAutoFill = useCallback(async () => {
    setSuggesting(true);
    try {
      const remaining = 36 - rollCount;
      if (remaining <= 0) return;

      const res = await fetch(`/api/rolls/suggest?limit=${remaining}`);
      if (!res.ok) return;
      const { data } = await res.json();
      const suggestedIds: string[] = data?.photoIds ?? [];
      if (suggestedIds.length === 0) return;

      // Ensure a roll exists
      let rollId = currentRoll?.id;
      if (!rollId) {
        const createRes = await fetch('/api/rolls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (createRes.ok) {
          const { data: newRoll } = await createRes.json();
          setRoll(newRoll);
          rollId = newRoll.id;
        } else {
          return;
        }
      }

      // Add each suggested photo
      for (const photoId of suggestedIds) {
        if (isChecked(photoId)) continue;
        checkPhoto(photoId);
        try {
          await fetch(`/api/rolls/${rollId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId }),
          });
        } catch {
          uncheckPhoto(photoId);
        }
      }

      track({
        event: 'roll_autofill',
        properties: { rollId: rollId || '', count: suggestedIds.length },
      });
    } finally {
      setSuggesting(false);
    }
  }, [rollCount, currentRoll, setRoll, isChecked, checkPhoto, uncheckPhoto]);

  if (!loading && photos.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-[var(--space-section)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
            Camera Roll
          </h1>
        </div>
        <Empty
          icon={Smartphone}
          title="No photos imported yet"
          description="Roll continuously imports and filters your camera roll. Great photos surface here — junk is hidden automatically."
        />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
            Camera Roll
          </h1>
          <Badge variant="info">
            <Smartphone size={12} className="mr-1 inline" />
            Synced
          </Badge>
        </div>
        <div className="flex items-center gap-[var(--space-tight)]">
          {!isClipMode && rollCount > 0 && rollCount < 36 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoFill}
              isLoading={suggesting}
              disabled={suggesting}
            >
              <Sparkles size={16} className="mr-1" /> Auto-fill
            </Button>
          )}
        </div>
      </div>

      {/* Content mode pills */}
      <div className="mb-[var(--space-section)]">
        <ContentModePills
          activeMode={contentMode}
          onChange={(mode) => {
            setContentMode(mode as ContentMode);
            track({ event: 'content_mode_changed', properties: { mode } });
          }}
          options={contentModeOptions}
        />
      </div>

      {/* Photo/clip grid — the contact sheet */}
      <PhotoGrid
        photos={photos}
        mode="feed"
        checkedIds={isClipMode ? clipIds : checkedPhotoIds}
        onCheck={isClipMode ? handleClipCheck : handleCheck}
        onHide={hidePhoto}
        onPhotoTap={handlePhotoTap}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
      />

      {/* Film strip progress bar — for photo rolls */}
      {!isClipMode && rollCount > 0 && (
        <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 lg:left-60 z-30">
          <FilmStripProgress
            rollName={currentRoll?.name || `Roll ${(currentRoll?.id || '').slice(0, 4)}`}
            currentCount={rollCount}
            maxCount={36}
            onTap={() => {
              if (currentRoll?.id) {
                router.push(`/roll/${currentRoll.id}`);
              }
            }}
          />
        </div>
      )}

      {/* Reel strip progress bar — for video reels */}
      {isClipMode && reelCount > 0 && currentReel && (
        <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 lg:left-60 z-30">
          <ReelStripProgress
            reelName={currentReel.name || `Reel ${currentReel.id.slice(0, 4)}`}
            currentDurationMs={currentDurationMs}
            targetDurationMs={currentReel.target_duration_ms}
            onTap={() => {
              router.push(`/library/reels/${currentReel.id}`);
            }}
          />
        </div>
      )}

      {/* Lightbox for full-screen photo/video viewing */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          mode="feed"
          onCheck={isClipMode ? handleClipCheck : handleCheck}
          isChecked={isClipMode ? isClipAdded : isChecked}
        />
      )}
    </div>
  );
}
