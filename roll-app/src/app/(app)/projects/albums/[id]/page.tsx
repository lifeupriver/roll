'use client';

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Pencil,
  Eye,
  Maximize2,
  X,
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BookCover } from '@/components/book/BookCover';
import { BookSpread } from '@/components/book/BookSpread';
import { CaptionEditor } from '@/components/book/CaptionEditor';
import { useToast } from '@/stores/toastStore';
import type { BookPage, BookViewMode, BookLayout } from '@/types/book';
import Link from 'next/link';

interface PhotoData {
  id: string;
  thumbnail_url: string;
  storage_key: string;
  width: number;
  height: number;
}

interface AlbumData {
  id: string;
  name: string;
  description?: string | null;
  cover_url: string | null;
  photo_count: number;
  photo_ids: string[];
  captions?: Record<string, string>;
  created_at: string;
  updated_at?: string;
}

type BookView = 'cover' | 'pages' | 'lightbox';

function BookDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const albumId = params.id;

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Book state
  const [view, setView] = useState<BookView>('cover');
  const [mode, setMode] = useState<BookViewMode>('read');
  const [layout, setLayout] = useState<BookLayout>('spread');
  const [currentSpread, setCurrentSpread] = useState(0);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [bookName, setBookName] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Flip animation
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Touch/swipe
  const touchStartX = useRef(0);

  // Auto-open edit mode from URL params
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setMode('edit');
      setView('pages');
    }
  }, [searchParams]);

  // Build pages array
  const pages: BookPage[] = useMemo(() => {
    if (!album) return [];
    return album.photo_ids
      .map((photoId) => {
        const photo = photos.find((p) => p.id === photoId);
        return {
          photoId,
          thumbnailUrl: photo?.thumbnail_url ?? '',
          storageKey: photo?.storage_key ?? '',
          caption: captions[photoId] ?? '',
          width: photo?.width ?? 0,
          height: photo?.height ?? 0,
        };
      })
      .filter((p) => p.thumbnailUrl); // Only pages with loaded photos
  }, [album, photos, captions]);

  // Spread navigation
  const totalPages = pages.length;
  const totalSpreads = layout === 'spread' ? Math.ceil(totalPages / 2) : totalPages;
  const canGoPrev = currentSpread > 0;
  const canGoNext = currentSpread < totalSpreads - 1;

  const getSpreadPages = useCallback(
    (spreadIndex: number): [BookPage | null, BookPage | null] => {
      if (layout === 'single') {
        return [pages[spreadIndex] ?? null, null];
      }
      const leftIndex = spreadIndex * 2;
      return [pages[leftIndex] ?? null, pages[leftIndex + 1] ?? null];
    },
    [pages, layout]
  );

  const currentPages = getSpreadPages(currentSpread);
  const leftIndex = layout === 'spread' ? currentSpread * 2 : currentSpread;
  const rightIndex = layout === 'spread' ? currentSpread * 2 + 1 : -1;

  // Helper: apply loaded album data to state
  const applyAlbumData = useCallback((albumData: AlbumData, photosData: PhotoData[]) => {
    setAlbum(albumData);
    setPhotos(photosData);
    setCaptions(albumData.captions ?? {});
    setBookName(albumData.name ?? 'Untitled Book');
    setBookDescription(albumData.description ?? '');
  }, []);

  // Helper: fetch photo details for a list of IDs
  const fetchPhotoDetails = useCallback(async (photoIds: string[]): Promise<PhotoData[]> => {
    const details: PhotoData[] = [];
    for (const photoId of photoIds) {
      try {
        const res = await fetch(`/api/photos/${photoId}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data) details.push(data);
        }
      } catch {
        // Skip failed photos
      }
    }
    return details;
  }, []);

  // Fetch album data with three-tier fallback
  const fetchAlbum = useCallback(async () => {
    // 1. Try detail API
    try {
      const apiRes = await fetch(`/api/projects/albums/${albumId}`);
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.data) {
          applyAlbumData(json.data, json.photos ?? []);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through
    }

    // 2. Try localStorage
    try {
      const storedAlbums: AlbumData[] = JSON.parse(localStorage.getItem('roll-albums') || '[]');
      const localAlbum = storedAlbums.find((a) => a.id === albumId);
      if (localAlbum) {
        const photoDetails = await fetchPhotoDetails(localAlbum.photo_ids ?? []);
        applyAlbumData(localAlbum, photoDetails);
        setLoading(false);
        return;
      }
    } catch {
      // Fall through
    }

    // 3. Try list API as final fallback (handles DB schema mismatches)
    try {
      const listRes = await fetch('/api/projects/albums');
      if (listRes.ok) {
        const json = await listRes.json();
        const match = (json.data ?? []).find((a: AlbumData) => a.id === albumId);
        if (match) {
          const photoDetails = await fetchPhotoDetails(match.photo_ids ?? []);
          applyAlbumData(match, photoDetails);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through
    }

    setLoading(false);
  }, [albumId, applyAlbumData, fetchPhotoDetails]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (!album || !hasUnsavedChanges) return;
    setSaving(true);
    try {
      // Save to API
      await fetch(`/api/projects/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookName,
          description: bookDescription || null,
          captions,
          photo_ids: album.photo_ids,
        }),
      });
    } catch {
      // Continue - save locally
    }

    // Always save to localStorage
    const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
    const idx = stored.findIndex((a: AlbumData) => a.id === albumId);
    const updated = {
      ...album,
      name: bookName,
      description: bookDescription || null,
      captions,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) stored[idx] = updated;
    else stored.unshift(updated);
    localStorage.setItem('roll-albums', JSON.stringify(stored));

    setAlbum(updated);
    setHasUnsavedChanges(false);
    setSaving(false);
    toast('Changes saved', 'success');
  }, [album, albumId, bookName, bookDescription, captions, hasUnsavedChanges, toast]);

  // Auto-save on mode change from edit to read
  useEffect(() => {
    if (mode === 'read' && hasUnsavedChanges) {
      saveChanges();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page navigation
  const goToSpread = useCallback(
    (spread: number) => {
      if (isFlipping || spread < 0 || spread >= totalSpreads) return;
      setFlipDirection(spread > currentSpread ? 'left' : 'right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(spread);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 300);
    },
    [currentSpread, isFlipping, totalSpreads]
  );

  const goNext = useCallback(() => {
    if (canGoNext) goToSpread(currentSpread + 1);
  }, [canGoNext, currentSpread, goToSpread]);

  const goPrev = useCallback(() => {
    if (canGoPrev) goToSpread(currentSpread - 1);
  }, [canGoPrev, currentSpread, goToSpread]);

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'pages') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        if (lightboxPhotoId) setLightboxPhotoId(null);
        else setView('cover');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, goNext, goPrev, lightboxPhotoId]);

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

  // Caption change handler
  const handleCaptionChange = useCallback((photoId: string, caption: string) => {
    setCaptions((prev) => ({ ...prev, [photoId]: caption }));
    setHasUnsavedChanges(true);
  }, []);

  // Name/description change handlers
  const handleNameChange = useCallback((name: string) => {
    setBookName(name);
    setHasUnsavedChanges(true);
  }, []);

  const handleDescriptionChange = useCallback((desc: string) => {
    setBookDescription(desc);
    setHasUnsavedChanges(true);
  }, []);

  // Page reorder
  const handleMovePage = useCallback(
    (pageIndex: number, direction: 'up' | 'down') => {
      if (!album) return;
      const newIds = [...album.photo_ids];
      const target = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
      if (target < 0 || target >= newIds.length) return;
      [newIds[pageIndex], newIds[target]] = [newIds[target], newIds[pageIndex]];
      setAlbum({ ...album, photo_ids: newIds });
      setHasUnsavedChanges(true);
    },
    [album]
  );

  // Remove page
  const handleRemovePage = useCallback(
    (photoId: string) => {
      if (!album) return;
      const newIds = album.photo_ids.filter((id) => id !== photoId);
      if (newIds.length === 0) {
        toast('A book must have at least one page', 'error');
        return;
      }
      setAlbum({ ...album, photo_ids: newIds, photo_count: newIds.length });
      const newCaptions = { ...captions };
      delete newCaptions[photoId];
      setCaptions(newCaptions);
      setHasUnsavedChanges(true);
      // Adjust spread if needed
      const newTotalSpreads = layout === 'spread' ? Math.ceil(newIds.length / 2) : newIds.length;
      if (currentSpread >= newTotalSpreads) {
        setCurrentSpread(Math.max(0, newTotalSpreads - 1));
      }
    },
    [album, captions, currentSpread, layout, toast]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found
  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
        <BookOpen size={40} className="text-[var(--color-ink-tertiary)]" />
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          Book not found
        </p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  // Cover view
  if (view === 'cover') {
    return (
      <div className="flex flex-col gap-[var(--space-section)]">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <BackButton href="/projects" label="Back to projects" />
          <div className="flex items-center gap-[var(--space-tight)]">
            {hasUnsavedChanges && (
              <Button variant="primary" size="sm" onClick={saveChanges} isLoading={saving}>
                Save
              </Button>
            )}
            <button
              type="button"
              onClick={() => setMode(mode === 'edit' ? 'read' : 'edit')}
              className={`p-2 rounded-[var(--radius-sharp)] transition-colors ${
                mode === 'edit'
                  ? 'bg-[var(--color-action)] text-white'
                  : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]'
              }`}
              title={mode === 'edit' ? 'Switch to reading mode' : 'Switch to edit mode'}
            >
              {mode === 'edit' ? <Eye size={18} /> : <Pencil size={18} />}
            </button>
          </div>
        </div>

        {/* Book cover */}
        <BookCover
          name={bookName}
          description={bookDescription}
          coverUrl={album.cover_url}
          pageCount={pages.length}
          editable={mode === 'edit'}
          onNameChange={handleNameChange}
          onDescriptionChange={handleDescriptionChange}
          onOpenBook={() => {
            setView('pages');
            setCurrentSpread(0);
          }}
        />

        {/* Quick info */}
        <div className="flex items-center justify-center gap-[var(--space-section)] text-[var(--color-ink-tertiary)]">
          <div className="flex flex-col items-center">
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] font-medium text-[var(--color-ink)]">
              {pages.length}
            </span>
            <span className="text-[length:var(--text-caption)]">Pages</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="flex flex-col items-center">
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] font-medium text-[var(--color-ink)]">
              {Object.values(captions).filter(Boolean).length}
            </span>
            <span className="text-[length:var(--text-caption)]">Captions</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="flex flex-col items-center">
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] font-medium text-[var(--color-ink)]">
              {layout === 'spread' ? Math.ceil(pages.length / 2) : pages.length}
            </span>
            <span className="text-[length:var(--text-caption)]">Spreads</span>
          </div>
        </div>

        {/* Order CTA */}
        <Link href="/account" className="block">
          <div className="bg-[var(--color-action)] text-white rounded-[var(--radius-card)] p-[var(--space-component)] flex items-center justify-between hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-[var(--space-element)]">
              <ShoppingBag size={20} />
              <div>
                <p className="text-[length:var(--text-label)] font-medium">Order Printed Book</p>
                <p className="text-[length:var(--text-caption)] opacity-80">
                  8&times;8 hardcover &middot; $29.99 + shipping
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="opacity-60" />
          </div>
        </Link>

        {/* Thumbnail grid preview */}
        {pages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-[var(--space-element)]">
              <h3 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)]">
                Pages
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView('pages');
                  setCurrentSpread(0);
                }}
              >
                View All
                <ChevronRight size={14} className="ml-0.5" />
              </Button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {pages.slice(0, 12).map((page, i) => (
                <button
                  key={page.photoId}
                  type="button"
                  onClick={() => {
                    setView('pages');
                    setCurrentSpread(layout === 'spread' ? Math.floor(i / 2) : i);
                  }}
                  className="relative aspect-[3/4] rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] group"
                >
                  <img
                    src={page.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] text-center font-[family-name:var(--font-mono)] py-0.5">
                    {i + 1}
                  </span>
                  {page.caption && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-action)]" />
                  )}
                </button>
              ))}
              {pages.length > 12 && (
                <button
                  type="button"
                  onClick={() => {
                    setView('pages');
                    setCurrentSpread(0);
                  }}
                  className="aspect-[3/4] rounded-[var(--radius-sharp)] bg-[var(--color-surface-sunken)] flex items-center justify-center"
                >
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-medium">
                    +{pages.length - 12}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pages view (book reader)
  return (
    <div className="flex flex-col gap-[var(--space-component)]">
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
        .page-flip-left  { animation: page-flip-left 300ms ease-in-out; }
        .page-flip-right { animation: page-flip-right 300ms ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .page-flip-left, .page-flip-right { animation: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <BackButton
          onClick={() => {
            if (hasUnsavedChanges) saveChanges();
            setView('cover');
          }}
        />

        <div className="flex items-center gap-[var(--space-tight)]">
          {/* Layout toggle */}
          <div className="flex items-center bg-[var(--color-surface-sunken)] rounded-[var(--radius-pill)] p-0.5">
            <button
              type="button"
              onClick={() => {
                setLayout('spread');
                setCurrentSpread(Math.floor(currentSpread * (layout === 'single' ? 0.5 : 1)));
              }}
              className={`px-2 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                layout === 'spread'
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-tertiary)]'
              }`}
            >
              Spread
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout('single');
                setCurrentSpread(layout === 'spread' ? currentSpread * 2 : currentSpread);
              }}
              className={`px-2 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                layout === 'single'
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-tertiary)]'
              }`}
            >
              Single
            </button>
          </div>

          {/* Save button */}
          {hasUnsavedChanges && (
            <Button variant="primary" size="sm" onClick={saveChanges} isLoading={saving}>
              Save
            </Button>
          )}

          {/* Edit/Read toggle */}
          <button
            type="button"
            onClick={() => setMode(mode === 'edit' ? 'read' : 'edit')}
            className={`p-2 rounded-[var(--radius-sharp)] transition-colors ${
              mode === 'edit'
                ? 'bg-[var(--color-action)] text-white'
                : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]'
            }`}
            title={mode === 'edit' ? 'Reading mode' : 'Edit mode'}
          >
            {mode === 'edit' ? <Eye size={16} /> : <Pencil size={16} />}
          </button>
        </div>
      </div>

      {/* Page counter */}
      <div className="text-center">
        <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tabular-nums">
          {layout === 'spread'
            ? `Pages ${leftIndex + 1}${rightIndex < totalPages ? `–${rightIndex + 1}` : ''} of ${totalPages}`
            : `Page ${currentSpread + 1} of ${totalPages}`}
        </p>
      </div>

      {/* Book content area */}
      {pages.length > 0 ? (
        <div className="flex flex-col items-center gap-[var(--space-component)]">
          <div
            className="relative w-full max-w-2xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {layout === 'spread' ? (
              <BookSpread
                leftPage={currentPages[0]}
                rightPage={currentPages[1]}
                leftIndex={leftIndex}
                rightIndex={rightIndex}
                totalPages={totalPages}
                editable={mode === 'edit'}
                onCaptionChange={handleCaptionChange}
                onMovePage={mode === 'edit' ? handleMovePage : undefined}
                onRemovePage={mode === 'edit' ? handleRemovePage : undefined}
                onPhotoTap={(id) => setLightboxPhotoId(id)}
                flipClass={
                  flipDirection === 'left'
                    ? 'page-flip-left'
                    : flipDirection === 'right'
                      ? 'page-flip-right'
                      : ''
                }
              />
            ) : (
              /* Single page view */
              <div className="flex flex-col gap-[var(--space-element)]">
                <div
                  className={`relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] mx-auto max-w-sm w-full ${
                    flipDirection === 'left'
                      ? 'page-flip-left'
                      : flipDirection === 'right'
                        ? 'page-flip-right'
                        : ''
                  }`}
                >
                  {currentPages[0] && (
                    <>
                      <img
                        src={currentPages[0].thumbnailUrl}
                        alt={`Page ${currentSpread + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
                        {currentSpread + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLightboxPhotoId(currentPages[0]!.photoId)}
                        className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-sharp)] bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                {currentPages[0] && (
                  <div className="max-w-sm mx-auto w-full">
                    <CaptionEditor
                      caption={currentPages[0].caption}
                      editable={mode === 'edit'}
                      onSave={(c) => handleCaptionChange(currentPages[0]!.photoId, c)}
                      placeholder="Add caption..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Navigation arrows */}
            {canGoPrev && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {canGoNext && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 max-w-full px-1">
            {pages.map((page, i) => {
              const isActive =
                layout === 'spread' ? i === leftIndex || i === rightIndex : i === currentSpread;
              return (
                <button
                  key={page.photoId}
                  type="button"
                  onClick={() => {
                    const targetSpread = layout === 'spread' ? Math.floor(i / 2) : i;
                    goToSpread(targetSpread);
                  }}
                  className={`relative w-10 h-14 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'ring-2 ring-[var(--color-action)] scale-105 opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <img src={page.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center font-[family-name:var(--font-mono)]">
                    {i + 1}
                  </span>
                  {page.caption && (
                    <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-[var(--color-action)]" />
                  )}
                </button>
              );
            })}
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

      {/* Lightbox */}
      {lightboxPhotoId && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-[fadeIn_200ms_ease-out]"
          onClick={() => setLightboxPhotoId(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxPhotoId(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
          >
            <X size={24} />
          </button>
          {(() => {
            const page = pages.find((p) => p.photoId === lightboxPhotoId);
            if (!page) return null;
            return (
              <div
                className="flex flex-col items-center gap-[var(--space-component)] max-w-3xl w-full px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={page.thumbnailUrl}
                  alt=""
                  className="max-h-[70vh] w-auto rounded-[var(--radius-card)] shadow-2xl"
                />
                {page.caption && (
                  <p className="text-white/80 text-[length:var(--text-body)] text-center max-w-md font-[family-name:var(--font-body)] italic">
                    {page.caption}
                  </p>
                )}
                <p className="text-white/40 text-[length:var(--text-caption)] font-[family-name:var(--font-mono)]">
                  Page {pages.findIndex((p) => p.photoId === lightboxPhotoId) + 1} of {pages.length}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function BookDetailPage() {
  return (
    <Suspense>
      <BookDetailContent />
    </Suspense>
  );
}
