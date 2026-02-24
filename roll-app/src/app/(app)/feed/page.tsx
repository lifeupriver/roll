'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Sparkles, Smartphone, Grid2x2, Grid3x3, Film, ChevronRight, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import { PhotoStack } from '@/components/photo/PhotoStack';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { usePhotos } from '@/hooks/usePhotos';
import { useRollStore } from '@/stores/rollStore';
import { useReelStore } from '@/stores/reelStore';
import { track } from '@/lib/analytics';
import type { ContentMode, PhotoStack as PhotoStackType } from '@/types/photo';
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
  const [gridColumns, setGridColumns] = useState(3);
  const [stacksEnabled, setStacksEnabled] = useState(true);
  const [photoStacks, setPhotoStacks] = useState<PhotoStackType[]>([]);

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

  // Load photo stacks
  useEffect(() => {
    if (!stacksEnabled || contentMode !== 'all') {
      setPhotoStacks([]);
      return;
    }
    async function loadStacks() {
      try {
        const res = await fetch('/api/photos/stacks');
        if (res.ok) {
          const { data } = await res.json();
          if (Array.isArray(data)) {
            // Convert stack data to PhotoStack objects using loaded photos
            const stacks: PhotoStackType[] = data.map((s: { id: string; top_photo_id: string; photo_ids: string[]; similarity: number }) => {
              const stackPhotos = s.photo_ids
                .map((pid: string) => photos.find((p) => p.id === pid))
                .filter(Boolean) as typeof photos;
              const topPhoto = photos.find((p) => p.id === s.top_photo_id) || stackPhotos[0];
              return {
                id: s.id,
                topPhoto: topPhoto!,
                photos: stackPhotos,
                similarity: s.similarity,
              };
            }).filter((s: PhotoStackType) => s.topPhoto && s.photos.length >= 2);
            setPhotoStacks(stacks);
          }
        }
      } catch {
        // Stacks are optional
      }
    }
    if (photos.length > 0) loadStacks();
  }, [stacksEnabled, photos.length, contentMode]);

  // Compute which photo IDs are in stacks (to hide duplicates from main grid)
  const stackedPhotoIds = useMemo(() => {
    if (!stacksEnabled || photoStacks.length === 0) return new Set<string>();
    const ids = new Set<string>();
    for (const stack of photoStacks) {
      // Don't hide the top photo — we show it via the stack component
      for (const photo of stack.photos) {
        if (photo.id !== stack.topPhoto.id) {
          ids.add(photo.id);
        }
      }
    }
    return ids;
  }, [stacksEnabled, photoStacks]);

  // Photos to render in the grid (excluding stacked duplicates)
  const displayPhotos = useMemo(() => {
    if (!stacksEnabled || stackedPhotoIds.size === 0) return photos;
    return photos.filter((p) => !stackedPhotoIds.has(p.id));
  }, [photos, stacksEnabled, stackedPhotoIds]);

  // Find which stack a photo belongs to (by top photo ID)
  const stackByTopPhotoId = useMemo(() => {
    const map = new Map<string, PhotoStackType>();
    for (const stack of photoStacks) {
      map.set(stack.topPhoto.id, stack);
    }
    return map;
  }, [photoStacks]);

  const contentModeOptions = [
    { value: 'all', label: 'All' },
    { value: 'people', label: 'People' },
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

  // Roll status helpers
  const maxPhotos = 36;
  const rollIsFull = rollCount >= maxPhotos;
  const fillPercent = Math.min((rollCount / maxPhotos) * 100, 100);

  if (!loading && photos.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-[var(--space-section)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
            Roll
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
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
            Roll
          </h1>
          <Badge variant="info">
            <Smartphone size={12} className="mr-1 inline" />
            Synced
          </Badge>
        </div>
      </div>

      {/* Content mode pills + grid size slider */}
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <ContentModePills
          activeMode={contentMode}
          onChange={(mode) => {
            setContentMode(mode as ContentMode);
            track({ event: 'content_mode_changed', properties: { mode } });
          }}
          options={contentModeOptions}
        />
        <div className="flex items-center gap-[var(--space-element)]">
          {/* Stacks toggle */}
          {!isClipMode && (
            <button
              type="button"
              onClick={() => setStacksEnabled(!stacksEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                stacksEnabled
                  ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-tertiary)]'
              }`}
              title={stacksEnabled ? 'Stacking on — similar photos are grouped' : 'Stacking off'}
            >
              <Layers size={14} />
              Stacks
            </button>
          )}
          <div className="flex items-center gap-[var(--space-tight)]">
            <Grid2x2 size={14} className="text-[var(--color-ink-tertiary)]" />
            <input
              type="range"
              min={2}
              max={6}
              value={gridColumns}
              onChange={(e) => setGridColumns(Number(e.target.value))}
              className="w-20 accent-[var(--color-action)]"
              aria-label="Grid columns"
            />
            <Grid3x3 size={14} className="text-[var(--color-ink-tertiary)]" />
          </div>
        </div>
      </div>

      {/* Roll status banner — above the grid */}
      {!isClipMode && (
        <div
          className={`mb-[var(--space-component)] rounded-[var(--radius-card)] p-[var(--space-component)] transition-all duration-300 ${
            rollIsFull
              ? 'bg-[var(--color-action)] text-white'
              : rollCount > 0
                ? 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]'
                : 'bg-[var(--color-surface-raised)] border border-dashed border-[var(--color-border)]'
          }`}
        >
          {rollIsFull ? (
            // Roll is full — prompt to develop
            <button
              type="button"
              onClick={() => {
                if (currentRoll?.id) router.push(`/roll/${currentRoll.id}`);
              }}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-[var(--space-element)]">
                <Film size={20} />
                <div className="text-left">
                  <p className="text-[length:var(--text-label)] font-medium">
                    Roll is full! Ready to develop
                  </p>
                  <p className="text-[length:var(--text-caption)] opacity-80">
                    {rollCount}/{maxPhotos} photos selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[var(--space-tight)]">
                <span className="text-[length:var(--text-label)] font-medium">Develop</span>
                <ChevronRight size={18} />
              </div>
            </button>
          ) : rollCount > 0 ? (
            // Building a roll — show progress
            <button
              type="button"
              onClick={() => {
                if (currentRoll?.id) router.push(`/roll/${currentRoll.id}`);
              }}
              className="w-full cursor-pointer"
            >
              <div className="flex items-center justify-between mb-[var(--space-tight)]">
                <div className="flex items-center gap-[var(--space-element)]">
                  <Film size={16} className="text-[var(--color-ink-secondary)]" />
                  <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                    {currentRoll?.name || 'Next Roll'}
                  </span>
                </div>
                <div className="flex items-center gap-[var(--space-element)]">
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] tabular-nums">
                    {rollCount}/{maxPhotos}
                  </span>
                  {rollCount < maxPhotos && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoFill();
                      }}
                      isLoading={suggesting}
                      disabled={suggesting}
                    >
                      <Sparkles size={14} className="mr-1" /> Auto-fill
                    </Button>
                  )}
                  <ChevronRight size={16} className="text-[var(--color-ink-tertiary)]" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] overflow-hidden">
                <div
                  className="h-full rounded-[var(--radius-pill)] bg-[var(--color-action)] transition-[width] duration-300 ease-out"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </button>
          ) : (
            // No roll started — prompt to begin
            <div className="flex items-center gap-[var(--space-element)]">
              <Film size={16} className="text-[var(--color-ink-tertiary)]" />
              <p className="text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                Tap photos to choose images for your next roll
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reel status banner — above the grid (clip mode) */}
      {isClipMode && (
        <div
          className={`mb-[var(--space-component)] rounded-[var(--radius-card)] p-[var(--space-component)] transition-all duration-300 ${
            reelCount > 0
              ? 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]'
              : 'bg-[var(--color-surface-raised)] border border-dashed border-[var(--color-border)]'
          }`}
        >
          {reelCount > 0 && currentReel ? (
            <button
              type="button"
              onClick={() => router.push(`/library/reels/${currentReel.id}`)}
              className="w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-element)]">
                  <Film size={16} className="text-[var(--color-ink-secondary)]" />
                  <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                    {currentReel.name || 'Next Reel'}
                  </span>
                </div>
                <div className="flex items-center gap-[var(--space-element)]">
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] tabular-nums">
                    {reelCount} clip{reelCount !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight size={16} className="text-[var(--color-ink-tertiary)]" />
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-[var(--space-element)]">
              <Film size={16} className="text-[var(--color-ink-tertiary)]" />
              <p className="text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                Tap clips to add them to your next reel
              </p>
            </div>
          )}
        </div>
      )}

      {/* Photo/clip grid — the contact sheet */}
      <PhotoGrid
        photos={isClipMode ? photos : displayPhotos}
        mode="feed"
        checkedIds={isClipMode ? clipIds : checkedPhotoIds}
        onCheck={isClipMode ? handleClipCheck : handleCheck}
        onHide={hidePhoto}
        onPhotoTap={handlePhotoTap}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
        columns={gridColumns}
        renderOverride={
          !isClipMode && stacksEnabled
            ? (photoId: string) => {
                const stack = stackByTopPhotoId.get(photoId);
                if (!stack) return null;
                return (
                  <PhotoStack
                    key={`stack-${stack.id}`}
                    stack={stack}
                    isChecked={isChecked}
                    onCheck={handleCheck}
                    onPhotoTap={handlePhotoTap}
                  />
                );
              }
            : undefined
        }
      />

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
