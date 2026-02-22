'use client';

import { useEffect } from 'react';
import { Upload } from 'lucide-react';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { usePhotos } from '@/hooks/usePhotos';
import { useRollStore } from '@/stores/rollStore';
import Link from 'next/link';

export default function FeedPage() {
  const {
    photos,
    contentMode,
    setContentMode,
    loading,
    hasMore,
    loadMore,
    hidePhoto,
  } = usePhotos();

  const { checkedPhotoIds, checkPhoto, uncheckPhoto, isChecked } = useRollStore();

  useEffect(() => {
    // Initial load
    setContentMode('all');
  }, []);

  const contentModeOptions = [
    { value: 'all', label: 'All' },
    { value: 'people', label: 'People' },
    { value: 'landscapes', label: 'Landscapes' },
  ];

  function handleCheck(photoId: string) {
    if (isChecked(photoId)) {
      uncheckPhoto(photoId);
    } else {
      checkPhoto(photoId);
    }
  }

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
    <div>
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
          onChange={(mode) => setContentMode(mode as 'all' | 'people' | 'landscapes')}
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
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
      />
    </div>
  );
}
