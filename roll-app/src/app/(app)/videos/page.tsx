'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Film, MousePointerClick, X, Send } from 'lucide-react';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { GridSizeSelector } from '@/components/ui/GridSizeSelector';
import { Empty } from '@/components/ui/Empty';
import { Spinner } from '@/components/ui/Spinner';
import { usePhotos } from '@/hooks/usePhotos';
import { useReelStore } from '@/stores/reelStore';
import { useToast } from '@/stores/toastStore';
import { track } from '@/lib/analytics';

const CLIP_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'people', label: 'People' },
];

export default function VideosPage() {
  const router = useRouter();
  const {
    photos,
    contentMode: _contentMode,
    setContentMode,
    loading,
    hasMore,
    loadMore,
  } = usePhotos();

  const {
    currentReel,
    clipIds,
    reelCount,
    isClipAdded,
    addClip,
    removeClip,
    setReel: setReelState,
  } = useReelStore();

  const { toast } = useToast();

  const [clipFilter, setClipFilter] = useState<'all' | 'people'>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [gridColumns, setGridColumns] = useState(3);

  // Set content mode to 'clips' on mount to fetch videos
  useEffect(() => {
    setContentMode('clips');
  }, []);

  // Filter videos only + apply people filter
  const videoClips = useMemo(() => {
    let clips = photos.filter((p) => p.media_type === 'video');
    if (clipFilter === 'people') {
      clips = clips.filter((p) => (p.face_count ?? 0) > 0);
    }
    return clips;
  }, [photos, clipFilter]);

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

  // Handle clip selection for reel
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
      const index = videoClips.findIndex((p) => p.id === photoId);
      if (index >= 0) setLightboxIndex(index);
    },
    [videoClips]
  );

  const handleAddToReel = useCallback(() => {
    const count = reelCount;
    setSelectMode(false);
    toast(`${count} clip${count !== 1 ? 's' : ''} added to your reel`, 'success');
    track({
      event: 'clips_added_to_reel',
      properties: { reelId: currentReel?.id || '', clipCount: count },
    });
  }, [reelCount, currentReel, toast]);

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Content mode pills + grid size selector */}
      <div className="flex items-center justify-between">
        <ContentModePills
          activeMode={clipFilter}
          onChange={(mode) => setClipFilter(mode as 'all' | 'people')}
          options={CLIP_FILTER_OPTIONS}
        />
        <GridSizeSelector value={gridColumns} onChange={setGridColumns} />
      </div>

      <div className="flex flex-col gap-[var(--space-component)]">
          {/* Reel builder banner */}
          <div
            className={`rounded-[var(--radius-card)] p-[var(--space-component)] transition-all duration-300 ${
              selectMode
                ? 'bg-[var(--color-action-subtle)] border border-[var(--color-action)]'
                : reelCount > 0
                  ? 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]'
                  : 'bg-[var(--color-surface-raised)] border border-dashed border-[var(--color-border)]'
            }`}
          >
            {selectMode ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-element)]">
                  <Film size={16} className="text-[var(--color-action)]" />
                  <div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">
                      Selecting clips for reel
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                      {reelCount > 0
                        ? `${reelCount} clip${reelCount !== 1 ? 's' : ''} selected`
                        : 'Tap clips to add them'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectMode(false)}
                  className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium"
                >
                  Done
                  <X size={14} />
                </button>
              </div>
            ) : reelCount > 0 && currentReel ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push(`/library/reels/${currentReel.id}`)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-[var(--space-element)]">
                    <Film size={16} className="text-[var(--color-ink-secondary)]" />
                    <div>
                      <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                        {currentReel.name || 'Next Reel'}
                      </span>
                      <span className="ml-2 font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] tabular-nums">
                        {reelCount} clip{reelCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium"
                >
                  <MousePointerClick size={14} />
                  Select
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-element)]">
                  <Film size={16} className="text-[var(--color-ink-tertiary)]" />
                  <div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                      Select your favorites for a reel
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      Browse your clips, then select your best ones to create a reel
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium"
                >
                  <MousePointerClick size={14} />
                  Select
                </button>
              </div>
            )}
          </div>

          {/* Video clip grid */}
          {loading && videoClips.length === 0 && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!loading && videoClips.length === 0 && (
            <Empty
              icon={Film}
              title="No video clips yet"
              description="Videos you shoot will appear here. Select your favorites to build a reel."
            />
          )}

          {videoClips.length > 0 && (
            <>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                {videoClips.length} clip{videoClips.length !== 1 ? 's' : ''}
              </p>
              <PhotoGrid
                photos={videoClips}
                mode="feed"
                selectMode={selectMode}
                checkedIds={clipIds}
                onCheck={handleClipCheck}
                onPhotoTap={handlePhotoTap}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoading={loading}
                columns={gridColumns}
              />
            </>
          )}

          {/* Lightbox */}
          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={videoClips}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              mode="feed"
              onCheck={selectMode ? handleClipCheck : undefined}
              isChecked={selectMode ? isClipAdded : undefined}
            />
          )}
        </div>

      {/* Fixed bottom action bar — slides up when clips are selected */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
          selectMode && reelCount > 0 ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-[var(--space-component)] py-[var(--space-element)] safe-area-bottom">
          <div className="flex items-center justify-between max-w-screen-lg mx-auto">
            <div className="flex items-center gap-[var(--space-element)]">
              <Film size={18} className="text-[var(--color-action)]" />
              <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                {reelCount} clip{reelCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddToReel}
              className="flex items-center gap-[var(--space-tight)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-sharp)] bg-[#C45D3E] text-white text-[length:var(--text-label)] font-semibold min-h-[44px] transition-colors hover:bg-[#B04E32] active:scale-[0.98]"
            >
              <Send size={16} />
              Add to Reel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
