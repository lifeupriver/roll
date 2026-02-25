'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { HeartButton } from '@/components/roll/HeartButton';
import { X, Film, Printer, Share2, AlertCircle, Wand2, MessageSquare, ArrowLeft } from 'lucide-react';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import { useToast } from '@/stores/toastStore';
import type { Roll, RollPhoto } from '@/types/roll';
import Link from 'next/link';

interface Photo {
  id: string;
  thumbnail_url: string;
  storage_key: string;
  lqip_base64: string | null;
  date_taken: string | null;
  camera_make: string | null;
  camera_model: string | null;
  latitude: number | null;
  longitude: number | null;
  media_type?: 'photo' | 'video';
  preview_storage_key?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

interface RollPhotoWithPhoto extends RollPhoto {
  photos: Photo;
}

interface ProcessStatus {
  status: string;
  photos_processed: number;
  photo_count: number;
  processing_error: string | null;
}

export default function RollDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [roll, setRoll] = useState<Roll | null>(null);
  const [photos, setPhotos] = useState<RollPhotoWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites tracking
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  // Inline name editing (caption for the roll)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Photo caption editing
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [photoCaptions, setPhotoCaptions] = useState<Map<string, string>>(new Map());

  // Processing poll state
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const rollId = params.id;

  // ------------------------------------------------------------------
  // Fetch roll data
  // ------------------------------------------------------------------
  const fetchRoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/rolls/${rollId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load roll');
      }
      const { data } = await res.json();
      setRoll(data.roll);
      setPhotos(data.photos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roll');
    } finally {
      setLoading(false);
    }
  }, [rollId]);

  useEffect(() => {
    fetchRoll();
  }, [fetchRoll]);

  // Load favorites for this roll's photos
  useEffect(() => {
    if (!roll || roll.status !== 'developed') return;
    async function loadFavorites() {
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const { data } = await res.json();
          const ids = new Set<string>((data ?? []).map((f: { photo_id: string }) => f.photo_id));
          setFavoritedIds(ids);
        }
      } catch {
        // Non-critical
      }
    }
    loadFavorites();
  }, [roll?.status, roll?.id]);

  // ------------------------------------------------------------------
  // Poll processing status
  // ------------------------------------------------------------------
  useEffect(() => {
    if (roll?.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/process/status/${rollId}`);
        if (!res.ok) return;
        const { data } = await res.json();
        setProcessStatus(data);

        if (data.status === 'developed') {
          clearInterval(interval);
          fetchRoll();
        }

        if (data.status === 'error') {
          clearInterval(interval);
          fetchRoll();
        }
      } catch {
        // Silently ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roll?.status, rollId, fetchRoll]);

  // ------------------------------------------------------------------
  // Rename roll (roll caption)
  // ------------------------------------------------------------------
  const handleStartEditing = useCallback(() => {
    setEditName(roll?.name || '');
    setIsEditingName(true);
  }, [roll?.name]);

  const handleSaveName = useCallback(async () => {
    if (!roll) return;
    const trimmed = editName.trim();
    if (!trimmed || trimmed === roll.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/rolls/${rollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      const { data } = await res.json();
      setRoll(data);
      setIsEditingName(false);
    } catch {
      toast('Failed to rename roll', 'error');
    }
  }, [roll, editName, rollId, toast]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveName();
      if (e.key === 'Escape') setIsEditingName(false);
    },
    [handleSaveName]
  );

  // ------------------------------------------------------------------
  // Photo caption
  // ------------------------------------------------------------------
  const handleStartCaptionEdit = useCallback((photoId: string) => {
    setCaptionText(photoCaptions.get(photoId) || '');
    setEditingCaptionId(photoId);
  }, [photoCaptions]);

  const handleSaveCaption = useCallback(async () => {
    if (!editingCaptionId) return;
    const trimmed = captionText.trim();
    setPhotoCaptions((prev) => {
      const next = new Map(prev);
      if (trimmed) {
        next.set(editingCaptionId, trimmed);
      } else {
        next.delete(editingCaptionId);
      }
      return next;
    });
    setEditingCaptionId(null);
    // Persist to backend (best-effort)
    try {
      await fetch(`/api/photos/${editingCaptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: trimmed || null }),
      });
    } catch {
      // Non-critical
    }
  }, [editingCaptionId, captionText]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveCaption();
      if (e.key === 'Escape') setEditingCaptionId(null);
    },
    [handleSaveCaption]
  );

  // ------------------------------------------------------------------
  // Remove photo from roll
  // ------------------------------------------------------------------
  const handleRemovePhoto = useCallback(
    async (photoId: string) => {
      try {
        const res = await fetch(`/api/rolls/${rollId}/photos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) throw new Error('Failed to remove photo');
        setPhotos((prev) => {
          const filtered = prev.filter((p) => p.photo_id !== photoId);
          return filtered.map((p, i) => ({ ...p, position: i + 1 }));
        });
        setRoll((prev) =>
          prev
            ? {
                ...prev,
                photo_count: Math.max(0, prev.photo_count - 1),
                status: prev.status === 'ready' ? 'building' : prev.status,
              }
            : prev
        );
      } catch {
        toast('Failed to remove photo', 'error');
      }
    },
    [rollId, toast]
  );

  // ------------------------------------------------------------------
  // Reset roll to ready (from error state)
  // ------------------------------------------------------------------
  const handleRetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/rolls/${rollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      });
      if (!res.ok) {
        const res2 = await fetch(`/api/rolls/${rollId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'processing' }),
        });
        if (!res2.ok) throw new Error('Failed to reset roll');
        const { data } = await res2.json();
        setRoll(data);
        setError(null);
        return;
      }
      const { data } = await res.json();
      setRoll(data);
      setError(null);
    } catch {
      toast('Failed to reset roll. Please try again.', 'error');
    }
  }, [rollId, toast]);

  // ------------------------------------------------------------------
  // Heart toggle (favorites)
  // ------------------------------------------------------------------
  const handleHeartToggle = useCallback(
    async (photoId: string, hearted: boolean) => {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (hearted) next.add(photoId);
        else next.delete(photoId);
        return next;
      });

      try {
        if (hearted) {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, rollId }),
          });
          if (!res.ok) throw new Error('Failed to favorite');
        } else {
          const res = await fetch(`/api/favorites/${photoId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to unfavorite');
        }
      } catch {
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (hearted) next.delete(photoId);
          else next.add(photoId);
          return next;
        });
        toast('Failed to update favorite', 'error');
      }
    },
    [rollId, toast]
  );

  // ------------------------------------------------------------------
  // Archive roll (only developed rolls can be archived)
  // ------------------------------------------------------------------
  const handleArchive = useCallback(async () => {
    if (!roll || roll.status !== 'developed') return;
    try {
      const res = await fetch(`/api/rolls/${rollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (!res.ok) throw new Error('Failed to archive');
      toast('Roll archived', 'success');
      router.push('/library');
    } catch {
      toast('Failed to archive roll', 'error');
    }
  }, [roll, rollId, toast, router]);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const photoCount = photos.length;
  const maxPhotos = roll?.max_photos ?? 36;
  const isReady = roll?.status === 'ready';
  const isFull = photoCount >= maxPhotos;
  const canDevelop = photoCount >= 10;
  const favoriteCount = favoritedIds.size;

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Not found / fetch error
  // ------------------------------------------------------------------
  if (!roll) {
    return (
      <Empty
        icon={Film}
        title="Roll not found"
        description={error || 'This roll does not exist or you do not have access.'}
        action={
          <Button variant="secondary" onClick={() => router.push('/library')}>
            Back to Shelf
          </Button>
        }
      />
    );
  }

  // ------------------------------------------------------------------
  // Error state (status: 'error')
  // ------------------------------------------------------------------
  if (roll.status === 'error') {
    return (
      <div className="flex flex-col gap-[var(--space-section)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <button onClick={() => router.push('/library')} className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: 'oklch(0.62 0.15 45 / 0.1)' }}>
            <AlertCircle size={32} strokeWidth={1.5} className="text-[var(--color-error)]" />
          </div>
          <div className="flex flex-col gap-[var(--space-tight)]">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
              Processing Failed
            </h2>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md">
              {roll.processing_error || 'An unexpected error occurred while developing your roll.'}
            </p>
          </div>
          <Button variant="primary" onClick={handleRetry}>Try Again</Button>
        </div>

        {photos.length > 0 && (
          <div className="opacity-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {photos.map((rp) => (
                <div key={rp.id} className="relative">
                  <img src={rp.photos.thumbnail_url} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Processing state (status: 'processing')
  // ------------------------------------------------------------------
  if (roll.status === 'processing') {
    const processed = processStatus?.photos_processed ?? roll.photos_processed ?? 0;
    const total = processStatus?.photo_count ?? roll.photo_count ?? photoCount;

    return (
      <div className="flex flex-col gap-[var(--space-section)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <button onClick={() => router.push('/library')} className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        <div className="relative">
          <div className="opacity-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {photos.map((rp) => (
                <div key={rp.id} className="relative">
                  <img src={rp.photos.thumbnail_url} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-component)]">
            <style>{`
              @keyframes film-reel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .film-reel-rotate { animation: film-reel-spin 2s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .film-reel-rotate { animation: none; } }
            `}</style>
            <Film size={48} strokeWidth={1.5} className="film-reel-rotate text-[var(--color-processing)]" />
            <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink)] tracking-[0.02em]">
              Developing photo {processed} of {total}...
            </p>
            <p className="text-[length:var(--text-label)] text-[var(--color-ink-tertiary)]">
              AI is color correcting your photos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Post-development state (status: 'developed')
  // ------------------------------------------------------------------
  if (roll.status === 'developed') {
    return (
      <div className="flex flex-col gap-[var(--space-section)] pb-8">
        {/* Header */}
        <div className="flex items-center gap-[var(--space-element)]">
          <button onClick={() => router.push('/library')} className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                placeholder="Caption this roll..."
                className="w-full bg-transparent border-b border-[var(--color-border)] pb-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-action)]"
              />
            ) : (
              <button type="button" onClick={handleStartEditing} className="text-left w-full">
                <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] truncate">
                  {roll.name || <span className="text-[var(--color-ink-tertiary)]">Add a caption...</span>}
                </h1>
              </button>
            )}
          </div>
          <span className="inline-flex items-center gap-[var(--space-tight)] px-[var(--space-tight)] py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium bg-[var(--color-developed)]/10 text-[var(--color-developed)] shrink-0">
            <Wand2 size={12} />
            Developed
          </span>
        </div>

        {/* Order Prints — prominent CTA at top */}
        <Link href={`/roll/${rollId}/order`} className="block">
          <div className="bg-[var(--color-action)] text-white rounded-[var(--radius-card)] p-[var(--space-component)] flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-[var(--space-element)]">
              <Printer size={24} />
              <div>
                <p className="text-[length:var(--text-body)] font-medium">
                  Order Prints
                </p>
                <p className="text-[length:var(--text-caption)] opacity-80">
                  High-quality prints delivered to your door
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-white/20 rounded-[var(--radius-pill)] px-3 py-1.5 text-[length:var(--text-label)] font-medium">
              Print
            </div>
          </div>
        </Link>

        {/* Share to circle */}
        <Button variant="secondary" size="md" onClick={() => router.push('/circle')}>
          <Share2 size={18} className="mr-2" />
          Share to Circle
        </Button>

        {/* Favorites summary */}
        {favoriteCount > 0 && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
            {favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''} selected
          </p>
        )}

        {/* Developed photo grid with hearts and captions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {photos.map((rp, index) => (
            <div key={rp.id} className="relative overflow-hidden group cursor-pointer" onClick={() => setLightboxIndex(index)}>
              <img
                src={rp.processed_storage_key || rp.photos.thumbnail_url}
                alt=""
                loading="lazy"
                className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)] pointer-events-none"
              />
              {/* Heart overlay */}
              <div className="absolute top-[var(--space-tight)] right-[var(--space-tight)]">
                <HeartButton
                  isHearted={favoritedIds.has(rp.photo_id)}
                  onChange={(hearted) => handleHeartToggle(rp.photo_id, hearted)}
                />
              </div>

              {/* Caption overlay — always visible when caption exists */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent">
                {editingCaptionId === rp.photo_id ? (
                  <input
                    autoFocus
                    type="text"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    onBlur={handleSaveCaption}
                    onKeyDown={handleCaptionKeyDown}
                    placeholder="Write a caption..."
                    maxLength={200}
                    className="w-full px-2 py-1.5 bg-transparent text-[length:var(--text-caption)] text-white placeholder:text-white/50 focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartCaptionEdit(rp.photo_id)}
                    className={`w-full text-left px-2 py-1.5 transition-opacity ${
                      photoCaptions.get(rp.photo_id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <span className="text-[length:var(--text-caption)] text-white/80">
                      {photoCaptions.get(rp.photo_id) || (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={10} /> Write a caption
                        </span>
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Archive */}
        <button
          type="button"
          onClick={handleArchive}
          className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors text-center py-[var(--space-element)]"
        >
          Archive this roll
        </button>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos.map((rp) => ({
              ...rp.photos,
              thumbnail_url: rp.processed_storage_key || rp.photos.thumbnail_url,
            }))}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            mode="roll"
            onHeart={(photoId) => {
              const isFav = favoritedIds.has(photoId);
              handleHeartToggle(photoId, !isFav);
            }}
            isHearted={(photoId) => favoritedIds.has(photoId)}
          />
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Pre-development state (status: 'building' | 'ready')
  // ------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <style>{`
        @keyframes develop-pulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: var(--color-action-subtle); }
        }
        .develop-pulse { animation: develop-pulse 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .develop-pulse { animation: none; background-color: var(--color-action-subtle); }
        }
      `}</style>

      {/* Header: back + counter */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button onClick={() => router.push('/library')} className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          {isFull ? (
            // Only allow naming when roll is full (ready to develop)
            isEditingName ? (
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                placeholder="Name this roll..."
                className="w-full bg-transparent border-b border-[var(--color-border)] pb-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-action)]"
              />
            ) : (
              <button type="button" onClick={handleStartEditing} className="text-left w-full hover:opacity-70 transition-opacity" title="Name this roll before developing">
                <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
                  {roll.name || <span className="text-[var(--color-ink-tertiary)]">Name this roll...</span>}
                </h1>
              </button>
            )
          ) : (
            <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
              Your Roll
            </h1>
          )}
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] tracking-[0.02em] shrink-0">
          {photoCount} / {maxPhotos}
        </span>
      </div>

      {/* Instructions */}
      {!isFull && photoCount > 0 && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {maxPhotos - photoCount} more photo{maxPhotos - photoCount !== 1 ? 's' : ''} needed to fill your roll. Go back to your feed to select more.
        </p>
      )}

      {/* Photo grid (contact sheet) */}
      {photos.length === 0 ? (
        <Empty
          icon={Film}
          title="No photos yet"
          description="Head to your feed to select photos for this roll."
          action={
            <Link href="/feed">
              <Button variant="secondary">Browse Photos</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {photos.map((rp, index) => (
            <div key={rp.id} className="relative group overflow-hidden bg-[var(--color-surface-sunken)] cursor-pointer" onClick={() => setLightboxIndex(index)}>
              <img
                src={rp.photos.thumbnail_url}
                alt={`Position ${rp.position}`}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover pointer-events-none"
              />

              {/* Position badge */}
              <span className="absolute top-[var(--space-tight)] left-[var(--space-tight)] inline-flex items-center justify-center min-w-[1.5rem] h-6 px-[var(--space-micro)] rounded-[var(--radius-pill)] bg-[var(--color-surface-overlay)]/70 text-[var(--color-ink-inverse)] font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] tracking-[0.02em]">
                {rp.position}
              </span>

              {/* Remove button */}
              {(roll.status === 'building' || roll.status === 'ready') && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(rp.photo_id)}
                  aria-label={`Remove photo ${rp.position} from roll`}
                  className="absolute top-[var(--space-tight)] right-[var(--space-tight)] w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface-overlay)]/70 text-[var(--color-ink-inverse)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border-none hover:bg-[var(--color-error)]"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Develop CTA */}
      <div className="relative">
        {!canDevelop && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center mb-[var(--space-tight)]">
            Add at least 10 photos to develop this roll
          </p>
        )}
        {isReady ? (
          <Link href={`/roll/develop?rollId=${rollId}`} className="block">
            <Button variant="primary" size="lg" className={isFull ? 'develop-pulse' : ''}>
              <Film size={18} className="mr-2" />
              Develop
            </Button>
          </Link>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!canDevelop}
            className={isFull ? 'develop-pulse' : ''}
            title={!canDevelop ? 'Add at least 10 photos to develop this roll' : undefined}
            onClick={() => {
              if (canDevelop) {
                router.push(`/roll/develop?rollId=${rollId}`);
              }
            }}
          >
            <Film size={18} className="mr-2" />
            Develop
          </Button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((rp) => rp.photos)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          mode="roll"
        />
      )}
    </div>
  );
}
