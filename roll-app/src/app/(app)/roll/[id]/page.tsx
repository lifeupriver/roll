'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { X, Film, Printer, Share, AlertCircle } from 'lucide-react';
import { useToast } from '@/stores/toastStore';
import type { Roll, RollPhoto } from '@/types/roll';
import { FILM_PROFILES as filmProfiles } from '@/types/roll';
import Link from 'next/link';

interface Photo {
  id: string;
  thumbnail_url: string;
  lqip_base64: string | null;
  date_taken: string | null;
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

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Processing poll state
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);

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
          // Refresh full roll data
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
  // Rename roll
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
        // Update local state
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
        // If the roll is in error, the valid transition is error -> processing.
        // Try that instead.
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
  // Helpers
  // ------------------------------------------------------------------
  const photoCount = photos.length;
  const maxPhotos = roll?.max_photos ?? 36;
  const isReady = roll?.status === 'ready';
  const isFull = photoCount >= maxPhotos;
  const canDevelop = photoCount >= 10;

  const filmProfile = roll?.film_profile
    ? filmProfiles.find((fp) => fp.id === roll.film_profile) ?? null
    : null;

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
            Back to Library
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
        {/* Header */}
        <div className="flex items-center gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        {/* Error content */}
        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: 'oklch(0.62 0.15 45 / 0.1)' }}
          >
            <AlertCircle
              size={32}
              strokeWidth={1.5}
              className="text-[var(--color-error)]"
            />
          </div>
          <div className="flex flex-col gap-[var(--space-tight)]">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
              Processing Failed
            </h2>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md">
              {roll.processing_error || 'An unexpected error occurred while developing your roll.'}
            </p>
          </div>
          <Button variant="primary" onClick={handleRetry}>
            Try Again
          </Button>
        </div>

        {/* Dimmed grid */}
        {photos.length > 0 && (
          <div className="opacity-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {photos.map((rp) => (
                <div key={rp.id} className="relative">
                  <img
                    src={rp.photos.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                  />
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
        {/* Header */}
        <div className="flex items-center gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        {/* Grid + overlay container */}
        <div className="relative">
          {/* Dimmed grid */}
          <div className="opacity-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {photos.map((rp) => (
                <div key={rp.id} className="relative">
                  <img
                    src={rp.photos.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Centered overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-component)]">
            <style>{`
              @keyframes film-reel-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .film-reel-rotate {
                animation: film-reel-spin 2s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .film-reel-rotate {
                  animation: none;
                }
              }
            `}</style>
            <Film
              size={48}
              strokeWidth={1.5}
              className="film-reel-rotate text-[var(--color-processing)]"
            />
            <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink)] tracking-[0.02em]">
              Processing photo {processed} of {total}...
            </p>
            <p className="text-[length:var(--text-label)] text-[var(--color-ink-tertiary)]">
              Estimated time: ~2 minutes
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
      <div className="flex flex-col gap-[var(--space-section)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
          {filmProfile && (
            <span className="inline-flex items-center gap-[var(--space-tight)] px-[var(--space-tight)] py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium bg-[var(--color-surface-raised)]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: filmProfile.stockColor }}
              />
              {filmProfile.name}
            </span>
          )}
        </div>

        {/* Developed photo grid with film profile filter */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {photos.map((rp) => (
            <div key={rp.id} className="relative overflow-hidden">
              <img
                src={rp.processed_storage_key || rp.photos.thumbnail_url}
                alt=""
                loading="lazy"
                className={[
                  'w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]',
                  filmProfile?.cssFilterClass ?? '',
                ].join(' ')}
              />
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-[var(--space-element)]">
          <Button
            variant="primary"
            size="lg"
            onClick={() => toast('Coming in Phase 3', 'info')}
          >
            <Printer size={18} className="mr-2" />
            Order Prints
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => toast('Coming in Phase 3', 'info')}
          >
            <Share size={18} className="mr-2" />
            Share to Circle
          </Button>
        </div>
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
        .develop-pulse {
          animation: develop-pulse 1.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .develop-pulse {
            animation: none;
            background-color: var(--color-action-subtle);
          }
        }
      `}</style>

      {/* Header: roll name + counter */}
      <div className="flex items-center justify-between gap-[var(--space-element)]">
        {isEditingName ? (
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleNameKeyDown}
            className="flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] px-[var(--space-element)] py-[var(--space-tight)] font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2"
          />
        ) : (
          <button
            type="button"
            onClick={handleStartEditing}
            className="text-left cursor-pointer bg-transparent border-none p-0 hover:opacity-70 transition-opacity"
            title="Click to edit roll name"
          >
            <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
              {roll.name || 'Untitled Roll'}
            </h1>
          </button>
        )}
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] tracking-[0.02em] shrink-0">
          {photoCount} / {maxPhotos}
        </span>
      </div>

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
          {photos.map((rp) => (
            <div
              key={rp.id}
              className="relative group overflow-hidden bg-[var(--color-surface-sunken)]"
            >
              {/* Photo */}
              <img
                src={rp.photos.thumbnail_url}
                alt={`Position ${rp.position}`}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />

              {/* Position badge (top-left) */}
              <span
                className={[
                  'absolute top-[var(--space-tight)] left-[var(--space-tight)]',
                  'inline-flex items-center justify-center',
                  'min-w-[1.5rem] h-6 px-[var(--space-micro)]',
                  'rounded-[var(--radius-pill)]',
                  'bg-[var(--color-surface-overlay)]/70',
                  'text-[var(--color-ink-inverse)]',
                  'font-[family-name:var(--font-mono)]',
                  'text-[length:var(--text-caption)]',
                  'tracking-[0.02em]',
                ].join(' ')}
              >
                {rp.position}
              </span>

              {/* Remove button (top-right, visible on hover) */}
              {(roll.status === 'building' || roll.status === 'ready') && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(rp.photo_id)}
                  aria-label={`Remove photo ${rp.position} from roll`}
                  className={[
                    'absolute top-[var(--space-tight)] right-[var(--space-tight)]',
                    'w-7 h-7 rounded-full',
                    'flex items-center justify-center',
                    'bg-[var(--color-surface-overlay)]/70',
                    'text-[var(--color-ink-inverse)]',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity duration-150',
                    'cursor-pointer border-none',
                    'hover:bg-[var(--color-error)]',
                  ].join(' ')}
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
            <Button
              variant="primary"
              size="lg"
              className={isFull ? 'develop-pulse' : ''}
            >
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
    </div>
  );
}
