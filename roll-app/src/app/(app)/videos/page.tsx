'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Film, MousePointerClick, X, Send, Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';
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
import Image from 'next/image';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

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
  const [developedReels, setDevelopedReels] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      clip_count: number;
      poster_storage_key: string | null;
      assembled_duration_ms: number | null;
      current_duration_ms?: number | null;
      created_at: string;
    }>
  >([]);

  // Set content mode to 'clips' on mount to fetch videos
  useEffect(() => {
    setContentMode('clips');
  }, [setContentMode]);

  // Filter videos only + apply people filter
  const videoClips = useMemo(() => {
    let clips = photos.filter((p) => p.media_type === 'video');
    if (clipFilter === 'people') {
      clips = clips.filter((p) => (p.face_count ?? 0) > 0);
    }
    return clips;
  }, [photos, clipFilter]);

  // Load active reel + developed reels on mount
  useEffect(() => {
    async function loadReels() {
      try {
        const res = await fetch('/api/reels');
        if (!res.ok) return;
        const { data } = await res.json();
        if (!data) return;

        const buildingReel = data.find(
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

        setDevelopedReels(
          data.filter(
            (r: { status: string }) => r.status === 'developed' || r.status === 'processing'
          )
        );
      } catch {
        // No active reel is fine
      }
    }
    loadReels();
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

        addClip(photoId, photo.duration_ms ?? 0, 0, null, photo.thumbnail_url);
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
              const { data: clipData, reelStatus } = await res.json();
              // Replace the pending clip with the real one from the API
              if (clipData) {
                const store = useReelStore.getState();
                const updatedClips = store.reelClips.map((c) =>
                  c.photo_id === photoId && c.id.startsWith('pending-')
                    ? {
                        ...clipData,
                        photos: {
                          id: photoId,
                          thumbnail_url: photo.thumbnail_url,
                          media_type: 'video',
                          duration_ms: photo.duration_ms,
                        },
                      }
                    : c
                );
                store.setReelClips(updatedClips);
              }
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
      {/* Your Reels — developed reels at the top */}
      {developedReels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-[var(--space-element)]">
            <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)]">
              Your Reels
            </h2>
            <button
              type="button"
              onClick={() => router.push('/library')}
              className="text-[length:var(--text-caption)] text-[var(--color-action)] font-medium flex items-center gap-0.5"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div
            className="flex flex-row gap-[var(--space-element)] overflow-x-auto pb-[var(--space-tight)] scrollbar-hide -mx-[var(--space-component)] px-[var(--space-component)]"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {developedReels.map((reel) => {
              const duration = reel.assembled_duration_ms ?? reel.current_duration_ms;
              return (
                <Link
                  key={reel.id}
                  href={`/library/reels/${reel.id}`}
                  className="block text-left group shrink-0 w-36"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative aspect-[9/16] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                    {reel.poster_storage_key ? (
                      <Image
                        src={
                          reel.poster_storage_key.startsWith('/photos/')
                            ? reel.poster_storage_key
                            : `/api/photos/serve?key=${encodeURIComponent(reel.poster_storage_key)}`
                        }
                        alt=""
                        fill
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                        <Play size={18} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {duration != null && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                        {formatDuration(duration)}
                      </span>
                    )}
                  </div>
                  <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                    {reel.name || 'Untitled Reel'}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
        {/* Your Reels — developed reels horizontal scroll */}
        {developedReels.length > 0 && (
          <div className="mt-[var(--space-element)]">
            <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)] mb-[var(--space-element)]">
              Your Reels
            </h2>
            <div
              className="flex flex-row gap-[var(--space-element)] overflow-x-auto pb-[var(--space-tight)] scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {developedReels.map((reel) => (
                <Link
                  key={reel.id}
                  href={`/library/reels/${reel.id}`}
                  className="text-left group shrink-0 w-36"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative aspect-[9/16] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                    {reel.poster_storage_key ? (
                      <Image
                        src={reel.poster_storage_key}
                        alt=""
                        fill
                        className="object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                        <Play size={18} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {reel.assembled_duration_ms && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-[family-name:var(--font-mono)] px-1.5 py-0.5 rounded">
                        {Math.floor(reel.assembled_duration_ms / 60000)}:
                        {String(Math.floor((reel.assembled_duration_ms % 60000) / 1000)).padStart(
                          2,
                          '0'
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                    {reel.name || 'Untitled Reel'}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {reel.clip_count} clips
                  </p>
                </Link>
              ))}
            </div>
          </div>
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
