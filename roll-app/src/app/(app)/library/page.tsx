'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Heart, Film, Play, Share2, Wand2, MessageSquare, Check, X, Grid3X3, Grid2x2, Users, ChevronRight, BookOpen, CheckSquare, Printer } from 'lucide-react';
import { HeartButton } from '@/components/roll/HeartButton';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { BackupStatusBadge } from '@/components/photo/BackupStatusBadge';
import { ShareToCircleModal } from '@/components/circle/ShareToCircleModal';
import { useToast } from '@/stores/toastStore';
import type { Roll } from '@/types/roll';
import type { Reel } from '@/types/reel';
import type { Photo } from '@/types/photo';
import type { Circle } from '@/types/circle';

type LibrarySection = 'all' | 'rolls' | 'reels' | 'favorites';

const SECTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Photos' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'reels', label: 'Bins' },
  { value: 'favorites', label: 'Favorites' },
];

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  roll_id: string;
  created_at: string;
  photos: Photo;
  rolls: { name: string | null; film_profile: string | null };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  building: { label: 'Building', color: 'var(--color-processing)' },
  ready: { label: 'Ready', color: 'var(--color-processing)' },
  processing: { label: 'Processing', color: 'var(--color-processing)' },
  developed: { label: 'Developed', color: 'var(--color-developed)' },
  error: { label: 'Error', color: 'var(--color-error)' },
  archived: { label: 'Archived', color: 'var(--color-ink-tertiary)' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<LibrarySection>('rolls');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollCovers, setRollCovers] = useState<Map<string, string>>(new Map());

  // All-photos state: combined photos from all developed rolls
  const [allPhotos, setAllPhotos] = useState<Array<{ photo: Photo; rollName: string; rollId: string }>>([]);
  const [allPhotosLoading, setAllPhotosLoading] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch all photos from developed rolls
  useEffect(() => {
    if (activeSection !== 'all') return;
    async function fetchAllPhotos() {
      setAllPhotosLoading(true);
      try {
        const rollsRes = await fetch('/api/rolls');
        if (!rollsRes.ok) return;
        const { data: allRolls } = await rollsRes.json();
        const developedAndBuilding = (allRolls ?? []).filter(
          (r: Roll) => r.status === 'developed' || r.status === 'building' || r.status === 'ready'
        );

        const combined: Array<{ photo: Photo; rollName: string; rollId: string }> = [];
        for (const roll of developedAndBuilding) {
          try {
            const res = await fetch(`/api/rolls/${roll.id}`);
            if (res.ok) {
              const json = await res.json();
              const rollPhotos = json.data?.photos ?? [];
              for (const rp of rollPhotos) {
                if (rp.photos) {
                  combined.push({
                    photo: {
                      ...rp.photos,
                      // Use processed photo if available (developed roll)
                      thumbnail_url: rp.processed_storage_key || rp.photos.thumbnail_url,
                    },
                    rollName: roll.name || 'Untitled Roll',
                    rollId: roll.id,
                  });
                }
              }
            }
          } catch {
            // Skip this roll
          }
        }
        setAllPhotos(combined);
      } catch {
        // Non-critical
      } finally {
        setAllPhotosLoading(false);
      }
    }
    fetchAllPhotos();
  }, [activeSection]);

  // Fetch rolls
  useEffect(() => {
    async function fetchRolls() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/rolls');
        if (!res.ok) throw new Error('Failed to load rolls');
        const json = await res.json();
        setRolls(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }
    fetchRolls();
  }, []);

  // Fetch cover photos for rolls
  useEffect(() => {
    if (rolls.length === 0) return;
    async function fetchCovers() {
      const covers = new Map<string, string>();
      for (const roll of rolls) {
        try {
          const res = await fetch(`/api/rolls/${roll.id}`);
          if (res.ok) {
            const json = await res.json();
            const firstPhoto = json.data?.photos?.[0];
            if (firstPhoto) {
              covers.set(
                roll.id,
                firstPhoto.processed_storage_key || firstPhoto.photos?.thumbnail_url || ''
              );
            }
          }
        } catch {
          // Non-critical
        }
      }
      setRollCovers(covers);
    }
    fetchCovers();
  }, [rolls]);

  // Fetch reels when switching to reels tab
  useEffect(() => {
    if (activeSection !== 'reels') return;
    async function fetchReels() {
      setReelsLoading(true);
      try {
        const res = await fetch('/api/reels');
        if (!res.ok) throw new Error('Failed to load reels');
        const json = await res.json();
        setReels(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reels');
      } finally {
        setReelsLoading(false);
      }
    }
    fetchReels();
  }, [activeSection]);

  // Fetch favorites when switching to favorites tab
  useEffect(() => {
    if (activeSection !== 'favorites') return;
    async function fetchFavorites() {
      setFavoritesLoading(true);
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) throw new Error('Failed to load favorites');
        const json = await res.json();
        setFavorites(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setFavoritesLoading(false);
      }
    }
    fetchFavorites();
  }, [activeSection]);

  // Unfavorite handler
  const handleUnfavorite = useCallback(
    async (photoId: string) => {
      setFavorites((prev) => prev.filter((f) => f.photo_id !== photoId));
      try {
        const res = await fetch(`/api/favorites/${photoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove favorite');
      } catch {
        toast('Failed to remove favorite', 'error');
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const json = await res.json();
          setFavorites(json.data ?? []);
        }
      }
    },
    [toast]
  );

  // Favorite caption editing
  const [editingFavCaptionId, setEditingFavCaptionId] = useState<string | null>(null);
  const [favCaptionText, setFavCaptionText] = useState('');
  const [favCaptions, setFavCaptions] = useState<Map<string, string>>(new Map());

  const handleStartFavCaption = useCallback((photoId: string) => {
    setFavCaptionText(favCaptions.get(photoId) || '');
    setEditingFavCaptionId(photoId);
  }, [favCaptions]);

  const handleSaveFavCaption = useCallback(async () => {
    if (!editingFavCaptionId) return;
    const trimmed = favCaptionText.trim();
    setFavCaptions((prev) => {
      const next = new Map(prev);
      if (trimmed) next.set(editingFavCaptionId, trimmed);
      else next.delete(editingFavCaptionId);
      return next;
    });
    setEditingFavCaptionId(null);
    try {
      await fetch(`/api/photos/${editingFavCaptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: trimmed || null }),
      });
    } catch {
      // Non-critical
    }
  }, [editingFavCaptionId, favCaptionText]);

  const handleFavCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveFavCaption();
      if (e.key === 'Escape') setEditingFavCaptionId(null);
    },
    [handleSaveFavCaption]
  );

  // Selection mode for favorites
  const [selectedFavIds, setSelectedFavIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const isSelecting = selectMode || selectedFavIds.size > 0;

  // Lightbox for favorites
  const [favLightboxIndex, setFavLightboxIndex] = useState<number | null>(null);

  const toggleFavSelection = useCallback((photoId: string) => {
    setSelectedFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const [showArchived, setShowArchived] = useState(false);
  const [gridColumns, setGridColumns] = useState(3);

  // Circle picker state for sharing
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(false);
  const [shareCircleId, setShareCircleId] = useState<string | null>(null);

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

  // Separate rolls by state
  const archivedRolls = rolls.filter((r) => r.status === 'archived');
  const developedRolls = rolls.filter((r) => r.status === 'developed');
  const inProgressRolls = rolls.filter((r) => r.status !== 'developed' && r.status !== 'archived');
  const archivedReels = reels.filter((r) => r.status === 'archived');
  const activeReels = reels.filter((r) => r.status !== 'archived');

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Backup badge + Section toggle + grid slider */}
      <div className="flex items-center justify-end mb-[var(--space-tight)]">
        <BackupStatusBadge />
      </div>
      <div className="flex items-center justify-between">
        <ContentModePills
          activeMode={activeSection}
          onChange={(mode) => setActiveSection(mode as LibrarySection)}
          options={SECTION_OPTIONS}
        />
        <div className="flex items-center gap-[var(--space-tight)]">
          <Grid2x2 size={14} className="text-[var(--color-ink-tertiary)]" />
          <input
            type="range"
            min={2}
            max={6}
            value={gridColumns}
            onChange={(e) => setGridColumns(Number(e.target.value))}
            className="w-20 accent-[var(--color-action)]"
            aria-label="Grid columns"
          />
          <Grid3X3 size={14} className="text-[var(--color-ink-tertiary)]" />
        </div>
      </div>

      {/* All Photos section — continuous grid from all rolls */}
      {activeSection === 'all' && (
        <section>
          {allPhotosLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!allPhotosLoading && allPhotos.length === 0 && (
            <Empty
              icon={Grid3X3}
              title="No photos in the gallery yet"
              description="Build a roll from your feed, develop it, and all your photos will appear here."
              action={
                <Link href="/feed">
                  <Button variant="primary" size="md">
                    Go to Feed
                  </Button>
                </Link>
              }
            />
          )}

          {!allPhotosLoading && allPhotos.length > 0 && (
            <>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
                {allPhotos.length} photos across all rolls
              </p>
              <div className="grid gap-[var(--space-micro)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
                {allPhotos.map((item, i) => (
                  <button
                    key={`${item.rollId}-${item.photo.id}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative group overflow-hidden"
                  >
                    <img
                      src={item.photo.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)] pointer-events-none"
                    />
                    {/* Roll name overlay on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[length:var(--text-caption)] text-white truncate block">
                        {item.rollName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Lightbox for all-photos view */}
              {lightboxIndex !== null && (
                <PhotoLightbox
                  photos={allPhotos.map((item) => item.photo)}
                  initialIndex={lightboxIndex}
                  onClose={() => setLightboxIndex(null)}
                  mode="roll"
                />
              )}
            </>
          )}
        </section>
      )}

      {/* Rolls section — grid layout */}
      {activeSection === 'rolls' && (
        <section className="flex flex-col gap-[var(--space-section)]">
          {isLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
              <p className="text-[length:var(--text-body)] text-[var(--color-error)]">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && rolls.length === 0 && (
            <Empty
              icon={Image}
              title="No rolls yet"
              description="Build your first roll by selecting photos from your feed."
              action={
                <Link href="/feed">
                  <Button variant="primary" size="md">
                    Go to Feed
                  </Button>
                </Link>
              }
            />
          )}

          {/* Current roll — single active roll with fullness indicator */}
          {!isLoading && !error && inProgressRolls.length > 0 && (() => {
            const currentRoll = inProgressRolls[0];
            const fillPercent = Math.min(100, Math.round((currentRoll.photo_count / currentRoll.max_photos) * 100));
            return (
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                  Current
                </h2>
                <button
                  type="button"
                  onClick={() => router.push(`/roll/${currentRoll.id}`)}
                  className="flex items-center gap-[var(--space-component)] w-full text-left group cursor-pointer"
                >
                  {/* Cover thumbnail */}
                  <div className="relative w-32 h-[170px] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shrink-0">
                    {rollCovers.get(currentRoll.id) ? (
                      <img
                        src={rollCovers.get(currentRoll.id)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                  </div>
                  {/* Info + fullness bar */}
                  <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-tight)]">
                    <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {currentRoll.name || 'Current Roll'}
                    </p>
                    <p className="text-[length:var(--text-label)] text-[var(--color-ink)]">
                      {currentRoll.photo_count} of {currentRoll.max_photos} photos &middot; {formatDate(currentRoll.created_at)}
                    </p>
                    {/* Fullness bar */}
                    <div className="flex items-center gap-[var(--space-element)]">
                      <div className="flex-1 h-2 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${fillPercent}%`,
                            backgroundColor: fillPercent >= 90 ? 'var(--color-processing)' : 'var(--color-action)',
                          }}
                        />
                      </div>
                      <span className="text-[length:var(--text-caption)] font-[family-name:var(--font-mono)] text-[var(--color-ink-secondary)] tabular-nums shrink-0">
                        {fillPercent}%
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })()}

          {/* Developed rolls — the main library */}
          {!isLoading && !error && developedRolls.length > 0 && (
            <div>
              {inProgressRolls.length > 0 && (
                <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                  Developed
                </h2>
              )}
              <div className="grid gap-[var(--space-element)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
                {developedRolls.map((roll) => (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => router.push(`/roll/${roll.id}`)}
                    className="text-left group cursor-pointer"
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                      {rollCovers.get(roll.id) ? (
                        <img
                          src={rollCovers.get(roll.id)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Wand2 size={24} className="text-[var(--color-developed)]" />
                        </div>
                      )}
                      {/* No badge needed — section heading separates developed rolls */}
                    </div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {roll.name || 'Untitled Roll'}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {roll.photo_count} photo{roll.photo_count !== 1 ? 's' : ''}
                      {roll.film_profile && <> &middot; <span className="capitalize">{roll.film_profile}</span></>}
                      {' '}&middot; {formatDate(roll.created_at)}
                    </p>
                    <Link
                      href={`/roll/${roll.id}/order`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1 text-[length:var(--text-caption)] font-medium text-[var(--color-action)] hover:underline"
                    >
                      <Printer size={12} /> Order This Roll
                    </Link>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Archived rolls */}
          {!isLoading && !error && archivedRolls.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors mb-[var(--space-element)]"
              >
                <span>{showArchived ? 'Hide' : 'Show'} archived ({archivedRolls.length})</span>
              </button>
              {showArchived && (
                <div className="grid gap-[var(--space-element)] opacity-60" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
                  {archivedRolls.map((roll) => (
                    <button
                      key={roll.id}
                      type="button"
                      onClick={() => router.push(`/roll/${roll.id}`)}
                      className="text-left group cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Archived</span>
                        </div>
                      </div>
                      <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] truncate">
                        {roll.name || 'Untitled Roll'}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {roll.photo_count} photos &middot; {formatDate(roll.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Reels section — grid layout */}
      {activeSection === 'reels' && (
        <section className="flex flex-col gap-[var(--space-element)]">
          {reelsLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!reelsLoading && error && (
            <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
              <p className="text-[length:var(--text-body)] text-[var(--color-error)]">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}

          {!reelsLoading && !error && activeReels.length === 0 && reels.length === 0 && (
            <Empty
              icon={Film}
              title="No bins yet"
              description="Build your first bin by selecting clips from your feed."
              action={
                <Link href="/feed">
                  <Button variant="primary" size="md">
                    Go to Feed
                  </Button>
                </Link>
              }
            />
          )}

          {!reelsLoading && !error && activeReels.length > 0 && (
            <div className="grid gap-[var(--space-element)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
              {activeReels.map((reel) => {
                const isDeveloped = reel.status === 'developed';
                const status = STATUS_LABEL[reel.status] || STATUS_LABEL.building;
                return (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => router.push(`/library/reels/${reel.id}`)}
                    className="text-left group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                      {reel.poster_storage_key ? (
                        <img
                          src={`/api/photos/serve?key=${encodeURIComponent(reel.poster_storage_key)}`}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                      )}
                      {/* Play indicator */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <Play size={18} className="text-white ml-0.5" fill="white" fillOpacity={0.9} />
                        </div>
                      </div>
                      {/* Status badge */}
                      <span
                        className="absolute top-[var(--space-tight)] right-[var(--space-tight)] px-1.5 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-semibold"
                        style={{ backgroundColor: `color-mix(in oklch, ${status.color} 35%, transparent)`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {reel.name || 'Untitled Bin'}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''} &middot; {formatDate(reel.created_at)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Favorites section — grid */}
      {activeSection === 'favorites' && (
        <section>
          {/* Top bar: Select toggle + actions */}
          {favorites.length > 0 && (
            <div className="flex items-center justify-between mb-[var(--space-component)]">
              {!isSelecting ? (
                <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
                  <CheckSquare size={14} className="mr-1" /> Select
                </Button>
              ) : (
                <div className="flex items-center gap-[var(--space-element)]">
                  <button
                    type="button"
                    onClick={() => { setSelectMode(false); setSelectedFavIds(new Set()); }}
                    className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                  >
                    <X size={18} />
                  </button>
                  <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                    {selectedFavIds.size} selected
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Selection action bar */}
          {isSelecting && selectedFavIds.size > 0 && (
            <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-component)] p-[var(--space-element)] bg-[var(--color-action-subtle)] rounded-[var(--radius-card)] flex-wrap">
              <Button variant="secondary" size="sm" onClick={handleOpenCirclePicker}>
                <Share2 size={14} className="mr-1" /> Share to Circle
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const params = new URLSearchParams();
                params.set('photoIds', Array.from(selectedFavIds).join(','));
                params.set('type', 'album');
                router.push(`/projects?create=album&${params.toString()}`);
              }}>
                <BookOpen size={14} className="mr-1" /> New Book
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const params = new URLSearchParams();
                params.set('photoIds', Array.from(selectedFavIds).join(','));
                params.set('type', 'reel');
                router.push(`/projects?create=reel&${params.toString()}`);
              }}>
                <Film size={14} className="mr-1" /> New Reel
              </Button>
            </div>
          )}

          {favoritesLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!favoritesLoading && favorites.length === 0 && (
            <Empty
              icon={Heart}
              title="No favorites yet"
              description="Heart your favorite photos after developing a roll. They'll collect here."
            />
          )}

          {!favoritesLoading && favorites.length > 0 && (
            <>
              <div className="grid gap-[var(--space-micro)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
                {favorites.map((fav, index) => (
                  <div
                    key={fav.id}
                    className="relative group overflow-hidden cursor-pointer"
                    onClick={() => {
                      if (isSelecting) {
                        toggleFavSelection(fav.photo_id);
                      } else {
                        setFavLightboxIndex(index);
                      }
                    }}
                  >
                    <img
                      src={fav.photos.thumbnail_url}
                      alt={`Favorited photo from ${fav.rolls?.name || 'roll'}`}
                      loading="lazy"
                      className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                    />
                    {/* Selection overlay */}
                    {isSelecting && selectedFavIds.has(fav.photo_id) && (
                      <div className="absolute inset-0 bg-[var(--color-action)]/15 ring-2 ring-inset ring-[var(--color-action)] pointer-events-none" />
                    )}
                    {/* Selection checkmark — only in select mode */}
                    {isSelecting && (
                      <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 z-10 pointer-events-none ${
                          selectedFavIds.has(fav.photo_id)
                            ? 'bg-[var(--color-action)] scale-100'
                            : 'bg-black/30 border border-white/50 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                      >
                        <Check size={14} strokeWidth={2.5} className="text-white" />
                      </div>
                    )}
                    {/* Heart overlay */}
                    <div className="absolute -top-1 -right-1" onClick={(e) => e.stopPropagation()}>
                      <HeartButton
                        isHearted={true}
                        onChange={() => handleUnfavorite(fav.photo_id)}
                      />
                    </div>
                    {/* Caption + Roll name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
                      {editingFavCaptionId === fav.photo_id ? (
                        <input
                          autoFocus
                          type="text"
                          value={favCaptionText}
                          onChange={(e) => setFavCaptionText(e.target.value)}
                          onBlur={handleSaveFavCaption}
                          onKeyDown={handleFavCaptionKeyDown}
                          placeholder="Write a caption..."
                          maxLength={200}
                          className="w-full px-2 py-1.5 bg-transparent text-[length:var(--text-caption)] text-white placeholder:text-white/50 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="w-full text-left px-[var(--space-tight)] py-[var(--space-tight)]"
                          onClick={(e) => { e.stopPropagation(); handleStartFavCaption(fav.photo_id); }}
                        >
                          {favCaptions.get(fav.photo_id) ? (
                            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-inverse)] mb-0.5">
                              {favCaptions.get(fav.photo_id)}
                            </p>
                          ) : (
                            <p className="text-[length:var(--text-caption)] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-0.5">
                              <MessageSquare size={10} /> Write a caption
                            </p>
                          )}
                          {fav.rolls?.name && (
                            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-inverse)]/70 font-[family-name:var(--font-body)]">
                              {fav.rolls.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Favorites lightbox */}
              {favLightboxIndex !== null && (
                <PhotoLightbox
                  photos={favorites.map((fav) => fav.photos)}
                  initialIndex={favLightboxIndex}
                  onClose={() => setFavLightboxIndex(null)}
                  mode="favorites"
                  onHeart={(photoId) => handleUnfavorite(photoId)}
                  isHearted={() => true}
                />
              )}
            </>
          )}
        </section>
      )}

      {/* Circle picker modal */}
      {showCirclePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCirclePicker(false)}>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-modal)] shadow-[var(--shadow-overlay)] w-[min(90vw,380px)] max-h-[60vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
              <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                Share to Circle
              </h2>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-1">
                Choose which circle to share {selectedFavIds.size} photo{selectedFavIds.size !== 1 ? 's' : ''} to
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
                        {circle.cover_photo_url ? (
                          <img src={circle.cover_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users size={18} className="text-[var(--color-ink-tertiary)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
                          {circle.name}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                          {circle.member_count} member{circle.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-[var(--color-ink-tertiary)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-[var(--space-element)] border-t border-[var(--color-border)]">
              <Button variant="ghost" size="sm" onClick={() => setShowCirclePicker(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share to Circle modal (opened after selecting a circle) */}
      {shareCircleId && (
        <ShareToCircleModal
          isOpen={true}
          onClose={() => setShareCircleId(null)}
          circleId={shareCircleId}
        />
      )}
    </div>
  );
}
