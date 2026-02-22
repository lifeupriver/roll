'use client';

import { useEffect, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { FilmStripProgress } from '@/components/roll/FilmStripProgress';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { usePhotos } from '@/hooks/usePhotos';
import { useRollStore } from '@/stores/rollStore';
import { track } from '@/lib/analytics';
import Link from 'next/link';

export default function FeedPage() {
  const router = useRouter();
  const {
    photos,
    contentMode,
    setContentMode,
    loading,
    hasMore,
    loadMore,
    hidePhoto,
  } = usePhotos();

  const {
    currentRoll,
    checkedPhotoIds,
    rollCount,
    checkPhoto,
    uncheckPhoto,
    isChecked,
    setRoll,
  } = useRollStore();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
          const buildingRoll = data?.find((r: { status: string }) => r.status === 'building' || r.status === 'ready');
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

  const contentModeOptions = [
    { value: 'all', label: 'All' },
    { value: 'people', label: 'People' },
    { value: 'landscapes', label: 'Landscapes' },
  ];

  const handleCheck = useCallback(async (photoId: string) => {
    if (isChecked(photoId)) {
      uncheckPhoto(photoId);
      track({ event: 'photo_unchecked', properties: { rollId: currentRoll?.id || '', photoCount: rollCount - 1 } });
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
      track({ event: 'photo_checked', properties: { rollId: rollId || '', photoCount: rollCount + 1 } });
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
  }, [isChecked, currentRoll, checkPhoto, uncheckPhoto, setRoll]);

  const handlePhotoTap = useCallback((photoId: string) => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (index >= 0) setLightboxIndex(index);
  }, [photos]);

  if (!loading && photos.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-[var(--space-section)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
            Your Photos
          </h1>
        </div>
        <Empty
          icon={Upload}
          title="No photos yet"
          description="Upload your first photos to get started."
          action={
            <Link href="/upload">
              <Button variant="primary">Upload Photos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-component)]">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
          Your Photos
        </h1>
        <Link href="/upload">
          <Button variant="secondary" size="sm">
            <Upload size={16} className="mr-1" /> Upload
          </Button>
        </Link>
      </div>

      {/* Content mode pills */}
      <div className="mb-[var(--space-section)]">
        <ContentModePills
          activeMode={contentMode}
          onChange={(mode) => {
            setContentMode(mode as 'all' | 'people' | 'landscapes');
            track({ event: 'content_mode_changed', properties: { mode } });
          }}
          options={contentModeOptions}
        />
      </div>

      {/* Photo grid — the contact sheet */}
      <PhotoGrid
        photos={photos}
        mode="feed"
        checkedIds={checkedPhotoIds}
        onCheck={handleCheck}
        onHide={hidePhoto}
        onPhotoTap={handlePhotoTap}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
      />

      {/* Film strip progress bar — fixed above tab bar */}
      {rollCount > 0 && (
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
    </div>
  );
}
