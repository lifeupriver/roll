'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const albumId = params.id;

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Touch/swipe handling
  const touchStartX = useRef(0);
  const bookRef = useRef<HTMLDivElement>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      const storedAlbums = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('roll-albums') || '[]')
        : [];
      const localAlbum = storedAlbums.find((a: AlbumData) => a.id === albumId);

      if (localAlbum) {
        setAlbum(localAlbum);
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

  const goToPage = useCallback(
    (page: number) => {
      if (isFlipping || page < 0 || page >= totalPages) return;
      setFlipDirection(page > currentPage ? 'left' : 'right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(page);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 350);
    },
    [currentPage, isFlipping, totalPages]
  );

  const goNext = useCallback(() => {
    if (canGoForward) goToPage(currentPage + 1);
  }, [canGoForward, currentPage, goToPage]);

  const goPrev = useCallback(() => {
    if (canGoBack) goToPage(currentPage - 1);
  }, [canGoBack, currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') router.push('/projects');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, router]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

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
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">Book not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <style>{`
        @keyframes page-flip-left {
          0%   { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
          50%  { transform: perspective(1200px) rotateY(-90deg); opacity: 0.6; }
          100% { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
        }
        @keyframes page-flip-right {
          0%   { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
          50%  { transform: perspective(1200px) rotateY(90deg); opacity: 0.6; }
          100% { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
        }
        .page-flip-left  { animation: page-flip-left 350ms ease-in-out; transform-origin: left center; }
        .page-flip-right { animation: page-flip-right 350ms ease-in-out; transform-origin: right center; }
        @media (prefers-reduced-motion: reduce) {
          .page-flip-left, .page-flip-right { animation: none; }
        }
      `}</style>

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

      {/* Book viewer */}
      {photos.length > 0 ? (
        <div className="flex flex-col items-center gap-[var(--space-component)]">
          {/* Book container with shadow spine */}
          <div
            ref={bookRef}
            className="relative w-full max-w-lg"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Book shadow / spine decoration */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-[var(--color-border-strong)] z-10 pointer-events-none rounded-full" />

            {/* Page spread: left (current) and right (next) */}
            <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)]">
              {/* Left page */}
              <div
                className={`relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden ${
                  flipDirection === 'right' ? 'page-flip-right' : ''
                }`}
              >
                <img
                  src={photos[currentPage]?.thumbnail_url}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Page number */}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
                  {currentPage + 1}
                </span>
              </div>

              {/* Right page (next page or blank) */}
              <div
                className={`relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden ${
                  flipDirection === 'left' ? 'page-flip-left' : ''
                }`}
              >
                {currentPage + 1 < totalPages ? (
                  <>
                    <img
                      src={photos[currentPage + 1]?.thumbnail_url}
                      alt={`Page ${currentPage + 2}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
                      {currentPage + 2}
                    </span>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-[var(--space-tight)]">
                    <BookOpen size={28} className="text-[var(--color-ink-tertiary)]" />
                    <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] italic">
                      End of Book
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation arrows overlaid on book */}
            {canGoBack && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {canGoForward && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Page counter */}
          <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-label)] text-[var(--color-ink-secondary)] tabular-nums">
            Pages {currentPage + 1}–{Math.min(currentPage + 2, totalPages)} of {totalPages}
          </p>

          {/* Thumbnail strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full px-1">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => goToPage(i)}
                className={`relative w-12 h-16 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 transition-all duration-200 ${
                  i === currentPage || i === currentPage + 1
                    ? 'ring-2 ring-[var(--color-action)] scale-105 opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img src={photo.thumbnail_url} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center font-[family-name:var(--font-mono)]">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
          <BookOpen size={40} className="text-[var(--color-ink-tertiary)]" />
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            This book has no pages yet
          </p>
        </div>
      )}
    </div>
  );
}
