'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Smartphone, Film, ChevronRight, MousePointerClick, X, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import type { LightboxSourceRect } from '@/components/photo/PhotoLightbox';
import { PhotoStack } from '@/components/photo/PhotoStack';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Empty } from '@/components/ui/Empty';
import { StartHereCard } from '@/components/feed/StartHereCard';
import { MomentClusterCard } from '@/components/feed/MomentClusterCard';
import { usePhotos } from '@/hooks/usePhotos';
import { useRollStore } from '@/stores/rollStore';
import { GridSizeSelector } from '@/components/ui/GridSizeSelector';
import { useStackStore } from '@/stores/stackStore';
import { applyStacks } from '@/lib/stacking';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { track } from '@/lib/analytics';
import type { ContentMode } from '@/types/photo';

export default function FeedPage() {
  const router = useRouter();
  const { photos, contentMode, setContentMode, loading, hasMore, loadMore, hidePhoto, refresh } =
    usePhotos();

  const { currentRoll, checkedPhotoIds, rollCount, checkPhoto, uncheckPhoto, isChecked, setRoll } =
    useRollStore();

  const { mode: stackMode, sensitivity: stackSensitivity } = useStackStore();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxSourceRect, setLightboxSourceRect] = useState<LightboxSourceRect | null>(null);
  const [gridColumns, setGridColumns] = useState(3);
  const [selectMode, setSelectMode] = useState(false);
  const [clusters, setClusters] = useState<Array<{
    id: string;
    cover_photo: { id: string; thumbnail_url: string };
    date_range: string;
    count: number;
    location?: string;
  }>>([]);
  const [showMoments, setShowMoments] = useState(false);

  // Filter out videos — photos page only shows photos
  const photosOnly = useMemo(() => photos.filter((p) => p.media_type !== 'video'), [photos]);

  // Apply photo stacking when in auto mode
  const { displayPhotos, stackMap } = useMemo(() => {
    if (stackMode !== 'auto') {
      return { displayPhotos: photosOnly, stackMap: new Map() };
    }
    return applyStacks(photosOnly, stackSensitivity);
  }, [photosOnly, stackMode, stackSensitivity]);

  useEffect(() => {
    setContentMode('all');
  }, []);

  // Load photo clusters for Moments section
  useEffect(() => {
    async function loadClusters() {
      try {
        const res = await fetch('/api/photos/clusters');
        if (res.ok) {
          const { data } = await res.json();
          if (data?.clusters?.length > 0) {
            setClusters(data.clusters);
          }
        }
      } catch {
        // Non-critical
      }
    }
    loadClusters();
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

  // Photos only — All and People
  const contentModeOptions = [
    { value: 'all', label: 'All' },
    { value: 'people', label: 'People' },
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

  const handlePhotoTap = useCallback(
    (photoId: string, sourceRect?: LightboxSourceRect) => {
      const index = displayPhotos.findIndex((p) => p.id === photoId);
      if (index >= 0) {
        setLightboxSourceRect(sourceRect || null);
        setLightboxIndex(index);
      }
    },
    [displayPhotos]
  );

  // Render override for stacked photos
  const renderStackOverride = useCallback(
    (photoId: string) => {
      if (stackMode !== 'auto') return null;
      const stack = stackMap.get(photoId);
      if (!stack || stack.topPhoto.id !== photoId) return null;
      return (
        <PhotoStack
          key={stack.id}
          stack={stack}
          isChecked={isChecked}
          onCheck={handleCheck}
          onPhotoTap={handlePhotoTap}
        />
      );
    },
    [stackMode, stackMap, isChecked, handleCheck, handlePhotoTap]
  );

  // Roll status helpers
  const maxPhotos = 36;
  const rollIsFull = rollCount >= maxPhotos;
  const fillPercent = Math.min((rollCount / maxPhotos) * 100, 100);

  if (!loading && photos.length === 0) {
    return (
      <div>
          <Empty
          icon={Smartphone}
          title="No photos imported yet"
          description="Roll continuously imports and filters your camera roll. Great photos surface here — junk is hidden automatically."
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="pb-4">
      {/* First-time user suggestion */}
      <StartHereCard />

      {/* Moments clusters */}
      {clusters.length > 0 && (
        <div className="mb-[var(--space-component)]">
          <button
            type="button"
            onClick={() => setShowMoments(!showMoments)}
            className="flex items-center gap-[var(--space-tight)] mb-[var(--space-element)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]"
          >
            <Calendar size={14} />
            {clusters.length} moment{clusters.length !== 1 ? 's' : ''} this month
            <ChevronRight size={14} className={`transition-transform ${showMoments ? 'rotate-90' : ''}`} />
          </button>
          {showMoments && (
            <div className="flex flex-col gap-[var(--space-tight)]">
              {clusters.slice(0, 5).map((cluster) => (
                <MomentClusterCard
                  key={cluster.id}
                  coverPhoto={{ id: cluster.cover_photo.id, thumbnail_url: cluster.cover_photo.thumbnail_url } as import('@/types/photo').Photo}
                  dateRange={cluster.date_range}
                  locationName={cluster.location}
                  photoCount={cluster.count}
                  onExpand={() => {
                    track({ event: 'moment_cluster_expanded', properties: { clusterId: cluster.id } });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
        <GridSizeSelector value={gridColumns} onChange={setGridColumns} />
      </div>

      {/* Roll status banner — above the grid */}
      <div
        className={`mb-[var(--space-component)] rounded-[var(--radius-card)] p-[var(--space-component)] transition-all duration-300 ${
          rollIsFull
            ? 'bg-[var(--color-action)] text-white'
            : selectMode
              ? 'bg-[var(--color-action-subtle)] border border-[var(--color-action)]'
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
              setSelectMode(false);
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
        ) : selectMode ? (
          // Select mode active — show progress + done button
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-element)]">
              <Film size={16} className="text-[var(--color-action)]" />
              <div>
                <p className="text-[length:var(--text-label)] font-medium text-[var(--color-action)]">
                  Selecting for roll
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                  {rollCount > 0
                    ? `${rollCount}/${maxPhotos} — choose ${maxPhotos - rollCount} more`
                    : `Tap photos to add (up to ${maxPhotos})`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectMode(false)}
              className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium transition-colors hover:bg-[var(--color-action-hover)]"
            >
              Done
              <X size={14} />
            </button>
          </div>
        ) : rollCount > 0 ? (
          // Has photos in roll but browsing mode — show progress + select more button
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (currentRoll?.id) router.push(`/roll/${currentRoll.id}`);
              }}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-[var(--space-element)]">
                <Film size={16} className="text-[var(--color-ink-secondary)]" />
                <div>
                  <span className="text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                    Pick {maxPhotos - rollCount} more favorites to complete your roll of {maxPhotos}.
                  </span>
                  <div className="h-1.5 mt-1 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] overflow-hidden w-32">
                    <div
                      className="h-full rounded-[var(--radius-pill)] bg-[var(--color-action)] transition-[width] duration-300 ease-out"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium transition-colors hover:bg-[var(--color-action-hover)]"
            >
              <MousePointerClick size={14} />
              Select
            </button>
          </div>
        ) : (
          // No roll started — prompt to begin
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-element)]">
              <Film size={16} className="text-[var(--color-ink-tertiary)]" />
              <div>
                <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                  Build your first roll
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  A roll is 36 of your favorite photos — like a roll of film. Pick your best, choose a film stock, and we&apos;ll develop them into prints.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-action)] text-white text-[length:var(--text-label)] font-medium transition-colors hover:bg-[var(--color-action-hover)]"
            >
              <MousePointerClick size={14} />
              Select
            </button>
          </div>
        )}
      </div>

      {/* Photo grid — the contact sheet (photos only, no videos) */}
      <PhotoGrid
        photos={displayPhotos}
        mode="feed"
        selectMode={selectMode}
        checkedIds={checkedPhotoIds}
        checkedOrder={Array.from(checkedPhotoIds)}
        onCheck={handleCheck}
        onHide={hidePhoto}
        onPhotoTap={handlePhotoTap}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
        columns={gridColumns}
        renderOverride={stackMode === 'auto' ? renderStackOverride : undefined}
      />

      {/* Lightbox for full-screen photo viewing */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={displayPhotos}
          initialIndex={lightboxIndex}
          sourceRect={lightboxSourceRect}
          onClose={() => { setLightboxIndex(null); setLightboxSourceRect(null); }}
          mode="feed"
          onAddToRoll={!selectMode ? handleCheck : undefined}
          isInRoll={!selectMode ? isChecked : undefined}
          onCheck={selectMode ? handleCheck : undefined}
          isChecked={selectMode ? isChecked : undefined}
        />
      )}
    </div>
    </PullToRefresh>
  );
}
