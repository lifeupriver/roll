'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

interface AlbumData {
  id: string;
  name: string;
  cover_url: string | null;
  photo_count: number;
  photo_ids: string[];
  created_at: string;
}

interface PhotoData {
  id: string;
  thumbnail_url: string;
  storage_key: string;
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const albumId = params.id;

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchAlbum = useCallback(async () => {
    try {
      // Try to load from local storage (for virtual albums created without DB)
      const storedAlbums = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('roll-albums') || '[]')
        : [];
      const localAlbum = storedAlbums.find((a: AlbumData) => a.id === albumId);

      if (localAlbum) {
        setAlbum(localAlbum);
        // Fetch photo details
        const photoDetails: PhotoData[] = [];
        for (const photoId of localAlbum.photo_ids) {
          try {
            const res = await fetch(`/api/photos/${photoId}`);
            if (res.ok) {
              const { data } = await res.json();
              if (data) photoDetails.push(data);
            }
          } catch {
            // Skip failed photos
          }
        }
        setPhotos(photoDetails);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const totalPages = photos.length;
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">Album not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          onClick={() => router.push('/projects')}
          className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] truncate">
            {album.name}
          </h1>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {album.photo_count} page{album.photo_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Order Book CTA */}
      <Link href="/account" className="block">
        <div className="bg-[var(--color-action)] text-white rounded-[var(--radius-card)] p-[var(--space-component)] flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-[var(--space-element)]">
            <ShoppingBag size={24} />
            <div>
              <p className="text-[length:var(--text-body)] font-medium">Order This Book</p>
              <p className="text-[length:var(--text-caption)] opacity-80">
                8&times;8 hardcover &middot; $29.99 + shipping
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white/20 rounded-[var(--radius-pill)] px-3 py-1.5 text-[length:var(--text-label)] font-medium">
            Buy
          </div>
        </div>
      </Link>

      {/* Book proof viewer — one page at a time */}
      {photos.length > 0 ? (
        <div className="flex flex-col items-center gap-[var(--space-component)]">
          {/* Page display */}
          <div className="relative w-full max-w-md aspect-square bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-raised)]">
            <img
              src={photos[currentPage]?.thumbnail_url}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-full object-contain bg-white"
            />
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-[var(--space-component)]">
            <button
              type="button"
              disabled={!canGoBack}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-full hover:bg-[var(--color-surface-raised)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={24} className="text-[var(--color-ink)]" />
            </button>

            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-ink-secondary)] tabular-nums min-w-[80px] text-center">
              {currentPage + 1} / {totalPages}
            </span>

            <button
              type="button"
              disabled={!canGoForward}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-full hover:bg-[var(--color-surface-raised)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={24} className="text-[var(--color-ink)]" />
            </button>
          </div>

          {/* Page strip */}
          <div className="flex gap-1 overflow-x-auto pb-2 max-w-full">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setCurrentPage(i)}
                className={`relative w-12 h-12 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 transition-all ${
                  i === currentPage
                    ? 'ring-2 ring-[var(--color-action)] scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo.thumbnail_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
          <BookOpen size={40} className="text-[var(--color-ink-tertiary)]" />
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            This album has no pages yet
          </p>
        </div>
      )}
    </div>
  );
}
