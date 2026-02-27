'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { HeartButton } from '@/components/roll/HeartButton';
import {
  X,
  Film,
  Printer,
  AlertCircle,
  Wand2,
  MessageSquare,
  Users,
  ChevronRight,
  BookOpen,
  UserRound,
  Images,
  Globe,
  Palette,
} from 'lucide-react';
import { GridSizeSelector } from '@/components/ui/GridSizeSelector';
import { BackButton } from '@/components/ui/BackButton';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
// Before/after comparison temporarily disabled — will re-enable later
// import { BeforeAfterCompare } from '@/components/photo/BeforeAfterCompare';
import { VoiceCaptionButton } from '@/components/shared/VoiceCaptionButton';
import { ShareToCircleModal } from '@/components/circle/ShareToCircleModal';
import { PublishModal } from '@/components/blog/PublishModal';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/stores/toastStore';
import type { Roll, RollPhoto } from '@/types/roll';
import type { Circle } from '@/types/circle';
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
  const heartInFlight = useRef<Set<string>>(new Set());

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
  const [gridColumns, setGridColumns] = useState(3);

  // Circle picker state for sharing
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(false);
  const [shareCircleId, setShareCircleId] = useState<string | null>(null);

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [savedStory, setSavedStory] = useState('');

  // Magazine design state
  const [creatingMagazine, setCreatingMagazine] = useState(false);

  // Filter toggles
  const [peopleFilter, setPeopleFilter] = useState<'all' | 'people'>('all');

  const rollId = params.id;

  // Stable reference for PublishModal — avoids re-creating on every render
  const rollPhotosForPublish = useMemo(
    () =>
      photos.map((rp) => ({
        photo_id: rp.photo_id,
        photos: rp.photos ? { thumbnail_url: rp.photos.thumbnail_url } : null,
      })),
    [photos]
  );

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
  const handleStartCaptionEdit = useCallback(
    (photoId: string) => {
      setCaptionText(photoCaptions.get(photoId) || '');
      setEditingCaptionId(photoId);
    },
    [photoCaptions]
  );

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
      // Prevent concurrent requests for the same photo (race-condition guard)
      if (heartInFlight.current.has(photoId)) return;
      heartInFlight.current.add(photoId);

      // Optimistic UI update
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
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Failed to favorite (${res.status})`);
          }
        } else {
          const res = await fetch(`/api/favorites/${photoId}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Failed to unfavorite (${res.status})`);
          }
        }
      } catch (err) {
        // Revert optimistic update on error
        setFavoritedIds((prev) => {
          const next = new Set(prev);
          if (hearted) next.delete(photoId);
          else next.add(photoId);
          return next;
        });
        const message = err instanceof Error ? err.message : 'Failed to update favorite';
        console.error('[Heart] Failed to update favorite:', message);
        toast(message, 'error');
      } finally {
        heartInFlight.current.delete(photoId);
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
  // Share to Circle — open circle picker
  // ------------------------------------------------------------------
  const handleOpenCirclePicker = useCallback(async () => {
    setShowCirclePicker(true);
    setCirclesLoading(true);
    try {
      const res = await fetch('/api/circles');
      if (res.ok) {
        const json = await res.json();
        setCircles(json.data ?? []);
      }
    } catch {
      toast('Failed to load circles', 'error');
    } finally {
      setCirclesLoading(false);
    }
  }, [toast]);

  const handleSelectCircle = useCallback((circleId: string) => {
    setShowCirclePicker(false);
    setShareCircleId(circleId);
  }, []);

  // ------------------------------------------------------------------
  // Send to Magazine Design
  // ------------------------------------------------------------------
  const handleCreateMagazine = useCallback(async () => {
    if (!roll || creatingMagazine) return;
    setCreatingMagazine(true);
    try {
      const res = await fetch('/api/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roll.theme_name || roll.name || 'Untitled Magazine',
          rollIds: [rollId],
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to create magazine');
      }
      const json = await res.json();
      const magazineId = json.data?.id;
      if (magazineId) {
        router.push(`/projects/magazines/${magazineId}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create magazine design', 'error');
    } finally {
      setCreatingMagazine(false);
    }
  }, [roll, creatingMagazine, rollId, router, toast]);

  // ------------------------------------------------------------------
  // Save story
  // ------------------------------------------------------------------
  const handleSaveStory = useCallback(async () => {
    const trimmed = storyText.trim();
    setSavedStory(trimmed);
    setShowStoryModal(false);
    if (trimmed) {
      try {
        await fetch(`/api/rolls/${rollId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: trimmed }),
        });
        toast('Story saved', 'success');
      } catch {
        // Non-critical
      }
    }
  }, [storyText, rollId, toast]);

  // ------------------------------------------------------------------
  // Caption handler for lightbox
  // ------------------------------------------------------------------
  const handleLightboxCaption = useCallback((photoId: string, caption: string) => {
    setPhotoCaptions((prev) => {
      const next = new Map(prev);
      if (caption) next.set(photoId, caption);
      else next.delete(photoId);
      return next;
    });
    // Persist to backend
    fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: caption || null }),
    }).catch(() => {});
  }, []);

  const getLightboxCaption = useCallback(
    (photoId: string) => {
      return photoCaptions.get(photoId) || '';
    },
    [photoCaptions]
  );

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const photoCount = photos.length;
  const maxPhotos = roll?.max_photos ?? 36;
  const isReady = roll?.status === 'ready';
  const isFull = photoCount >= maxPhotos;
  const canDevelop = photoCount >= 10;
  const favoriteCount = favoritedIds.size;

  // Filter photos by media type and people presence
  const filteredPhotos = photos.filter((rp) => {
    if (peopleFilter === 'people') {
      // Filter for photos that likely contain people (heuristic: check for face-related metadata)
      // Since face detection data isn't always available, we use latitude/camera as a proxy
      // for "real" photos (not screenshots/documents) which more likely contain people
      return rp.photos.camera_make !== null;
    }
    return true;
  });

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
            Back to Gallery
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
          <BackButton href="/library" />
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: 'oklch(0.62 0.15 45 / 0.1)' }}
          >
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
          <Button variant="primary" onClick={handleRetry}>
            Try Again
          </Button>
        </div>

        {photos.length > 0 && (
          <div className="opacity-50">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
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
        <div className="flex items-center gap-[var(--space-element)]">
          <BackButton href="/library" />
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
        </div>

        <div className="relative">
          <div className="opacity-50">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
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

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-component)]">
            <style>{`
              @keyframes film-reel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .film-reel-rotate { animation: film-reel-spin 2s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .film-reel-rotate { animation: none; } }
            `}</style>
            <Film
              size={48}
              strokeWidth={1.5}
              className="film-reel-rotate text-[var(--color-processing)]"
            />
            <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink)] tracking-[0.02em]">
              Developing photo {processed} of {total}...
            </p>
            <p className="text-[length:var(--text-label)] text-[var(--color-ink-tertiary)]">
              Color correcting your photos
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
          <BackButton href="/library" />
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
                className="w-full bg-transparent border-b border-[var(--color-border)] pb-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-action)]"
              />
            ) : (
              <button type="button" onClick={handleStartEditing} className="text-left w-full">
                <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] truncate">
                  {roll.name || (
                    <span className="text-[var(--color-ink-tertiary)]">Add a caption...</span>
                  )}
                </h1>
              </button>
            )}
          </div>
          <span className="inline-flex items-center gap-[var(--space-tight)] px-[var(--space-tight)] py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium bg-[var(--color-developed)]/10 text-[var(--color-developed)] shrink-0">
            <Wand2 size={12} />
            Developed
          </span>
        </div>

        {/* Roll actions — compact icon bar */}
        <div className="flex items-center justify-between">
          {[
            { icon: Users, label: 'Circle', onClick: handleOpenCirclePicker },
            { icon: Globe, label: 'Publish', onClick: () => setShowPublishModal(true) },
            {
              icon: BookOpen,
              label: savedStory ? 'Edit Story' : 'Story',
              onClick: () => {
                setStoryText(savedStory);
                setShowStoryModal(true);
              },
            },
            {
              icon: Palette,
              label: creatingMagazine ? 'Creating…' : 'Magazine',
              onClick: handleCreateMagazine,
              disabled: creatingMagazine,
            },
            { icon: Printer, label: 'Print', href: `/roll/${rollId}/order`, accent: true },
          ].map(({ icon: Icon, label, onClick, disabled, href, accent }) => {
            const content = (
              <div className="flex flex-col items-center gap-1 group">
                <span
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                    accent
                      ? 'bg-[var(--color-action)] text-white group-hover:bg-[var(--color-action-hover)]'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] group-hover:bg-[var(--color-border)]'
                  } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Icon size={18} />
                </span>
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] font-medium leading-tight">
                  {label}
                </span>
              </div>
            );
            if (href) {
              return (
                <Link key={label} href={href} className="flex-1 flex justify-center">
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="flex-1 flex justify-center disabled:cursor-not-allowed"
              >
                {content}
              </button>
            );
          })}
        </div>

        {/* Display saved story */}
        {savedStory && (
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)]">
            <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-[family-name:var(--font-body)] italic leading-relaxed">
              &ldquo;{savedStory}&rdquo;
            </p>
          </div>
        )}

        {/* Before/after comparison temporarily disabled — will re-enable later */}

        {/* Favorites summary */}
        {favoriteCount > 0 && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
            {favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''} selected
          </p>
        )}

        {/* Filter toggles + grid size slider */}
        <div className="flex items-center justify-between gap-[var(--space-element)] flex-wrap">
          <div className="flex items-center gap-[var(--space-tight)]">
            {/* People toggle: All / People */}
            <div className="flex items-center bg-[var(--color-surface-sunken)] rounded-[var(--radius-pill)] p-0.5">
              {(
                [
                  { value: 'all', icon: Images, label: 'All' },
                  { value: 'people', icon: UserRound, label: 'People' },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeopleFilter(value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                    peopleFilter === value
                      ? 'bg-[var(--color-action)] text-white'
                      : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid size toggle */}
          <GridSizeSelector value={gridColumns} onChange={setGridColumns} />
        </div>

        {/* Photo count info */}
        {peopleFilter !== 'all' && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Showing {filteredPhotos.length} of {photos.length} photos
          </p>
        )}

        {/* Developed photo grid with hearts and captions */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
          {filteredPhotos.map((rp, index) => (
            <div
              key={rp.id}
              className="relative overflow-hidden group cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={rp.processed_storage_key || rp.photos.thumbnail_url}
                alt=""
                loading="lazy"
                className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)] pointer-events-none"
              />
              {/* Heart overlay */}
              <div className="absolute -top-1 -right-1" onClick={(e) => e.stopPropagation()}>
                <HeartButton
                  isHearted={favoritedIds.has(rp.photo_id)}
                  onChange={(hearted) => handleHeartToggle(rp.photo_id, hearted)}
                />
              </div>

              {/* Caption overlay — always visible when caption exists */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent">
                {editingCaptionId === rp.photo_id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      onBlur={handleSaveCaption}
                      onKeyDown={handleCaptionKeyDown}
                      placeholder="Write a caption..."
                      maxLength={200}
                      className="flex-1 px-2 py-1.5 bg-transparent text-[length:var(--text-caption)] text-white placeholder:text-white/50 focus:outline-none"
                    />
                    <VoiceCaptionButton
                      onTranscript={(text) =>
                        setCaptionText((prev) => (prev ? `${prev} ${text}` : text))
                      }
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartCaptionEdit(rp.photo_id)}
                    className={`w-full text-left px-2 py-1.5 transition-opacity ${
                      photoCaptions.get(rp.photo_id)
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
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
            photos={filteredPhotos.map((rp) => ({
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
            onCaption={handleLightboxCaption}
            getCaption={getLightboxCaption}
          />
        )}

        {/* Circle picker modal */}
        {showCirclePicker && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCirclePicker(false)}
          >
            <div
              className="bg-[var(--color-surface)] rounded-[var(--radius-modal)] shadow-[var(--shadow-overlay)] w-[min(90vw,380px)] max-h-[60vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                  Share to Circle
                </h2>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-1">
                  Choose which circle to share this roll to
                </p>
              </div>
              <div className="p-[var(--space-element)] overflow-y-auto max-h-[40vh]">
                {circlesLoading ? (
                  <div className="flex items-center justify-center py-[var(--space-section)]">
                    <Spinner size="sm" />
                  </div>
                ) : circles.length === 0 ? (
                  <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-section)]">
                    No circles yet. Create or join a circle first.
                  </p>
                ) : (
                  <div className="flex flex-col gap-[var(--space-tight)]">
                    {circles.map((circle) => (
                      <button
                        key={circle.id}
                        type="button"
                        onClick={() => handleSelectCircle(circle.id)}
                        className="flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] text-left hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center shrink-0">
                          <Users size={18} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
                            {circle.name}
                          </p>
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            {circle.member_count} member{circle.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-[var(--color-ink-tertiary)] shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-[var(--space-element)] border-t border-[var(--color-border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCirclePicker(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Share to Circle modal (after selecting a circle) */}
        {shareCircleId && (
          <ShareToCircleModal
            isOpen={true}
            onClose={() => setShareCircleId(null)}
            circleId={shareCircleId}
          />
        )}

        {/* Publish as Public Post modal */}
        {roll && (
          <PublishModal
            isOpen={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            rollId={roll.id}
            rollTitle={roll.theme_name || roll.name || 'Untitled'}
            rollStory={roll.story}
            rollPhotos={rollPhotosForPublish}
          />
        )}

        {/* Story modal */}
        {showStoryModal && (
          <Modal isOpen={showStoryModal} onClose={() => setShowStoryModal(false)}>
            <div className="flex flex-col gap-[var(--space-component)]">
              <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                {savedStory ? 'Edit Your Story' : 'Add a Story'}
              </h2>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                Write a brief paragraph about this roll — the moment, the memory, the feeling.
              </p>
              <textarea
                autoFocus
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Tell the story behind these photos..."
                maxLength={1000}
                rows={5}
                className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-[var(--space-element)] text-[length:var(--text-body)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-action)] resize-none"
              />
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-right">
                {storyText.length}/1000
              </p>
              <div className="flex items-center justify-end gap-[var(--space-element)]">
                <Button variant="ghost" onClick={() => setShowStoryModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveStory}>
                  Save Story
                </Button>
              </div>
            </div>
          </Modal>
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
        <BackButton href="/library" />
        <div className="flex-1 min-w-0">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            Your Roll
          </h1>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink)] tracking-[0.02em] shrink-0">
          {photoCount} / {maxPhotos}
        </span>
      </div>

      {/* Instructions */}
      {!isFull && photoCount > 0 && (
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {maxPhotos - photoCount} more photo{maxPhotos - photoCount !== 1 ? 's' : ''} needed to
          fill your roll. Go back to your feed to select more.
        </p>
      )}

      {/* Grid size toggle */}
      {photos.length > 0 && (
        <div className="flex items-center justify-end">
          <GridSizeSelector value={gridColumns} onChange={setGridColumns} />
        </div>
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
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
          {photos.map((rp, index) => (
            <div
              key={rp.id}
              className="relative group overflow-hidden bg-[var(--color-surface-sunken)] cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
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
      <div className="relative flex flex-col gap-[var(--space-element)]">
        {!canDevelop && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center mb-[var(--space-tight)]">
            Add at least 10 photos to develop this roll
          </p>
        )}
        {/* Name input — only shown when clicking develop */}
        {canDevelop && isEditingName && (
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              handleSaveName();
              if (editName.trim()) {
                router.push(`/roll/develop?rollId=${rollId}`);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveName();
                router.push(`/roll/develop?rollId=${rollId}`);
              }
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            placeholder="Name this roll before developing..."
            className="w-full bg-transparent border-b border-[var(--color-border)] pb-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-action)] text-center"
          />
        )}
        {isReady ? (
          <Button
            variant="primary"
            size="lg"
            className={isFull ? 'develop-pulse' : ''}
            onClick={() => {
              if (!roll.name) {
                setEditName('');
                setIsEditingName(true);
              } else {
                router.push(`/roll/develop?rollId=${rollId}`);
              }
            }}
          >
            <Film size={18} className="mr-2" />
            Develop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!canDevelop}
            className={isFull ? 'develop-pulse' : ''}
            title={!canDevelop ? 'Add at least 10 photos to develop this roll' : undefined}
            onClick={() => {
              if (canDevelop) {
                if (!roll.name) {
                  setEditName('');
                  setIsEditingName(true);
                } else {
                  router.push(`/roll/develop?rollId=${rollId}`);
                }
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
