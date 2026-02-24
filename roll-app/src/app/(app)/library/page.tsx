'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Heart, Film, Play, Share2, Wand2 } from 'lucide-react';
import { HeartButton } from '@/components/roll/HeartButton';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { useToast } from '@/stores/toastStore';
import type { Roll } from '@/types/roll';
import type { Reel } from '@/types/reel';
import type { Photo } from '@/types/photo';

type LibrarySection = 'rolls' | 'reels' | 'favorites';

const SECTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'rolls', label: 'Rolls' },
  { value: 'reels', label: 'Reels' },
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

  const [showArchived, setShowArchived] = useState(false);

  // Separate rolls by state
  const archivedRolls = rolls.filter((r) => r.status === 'archived');
  const developedRolls = rolls.filter((r) => r.status === 'developed');
  const inProgressRolls = rolls.filter((r) => r.status !== 'developed' && r.status !== 'archived');
  const archivedReels = reels.filter((r) => r.status === 'archived');
  const activeReels = reels.filter((r) => r.status !== 'archived');

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Page title */}
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
        Library
      </h1>

      {/* Section toggle */}
      <ContentModePills
        activeMode={activeSection}
        onChange={(mode) => setActiveSection(mode as LibrarySection)}
        options={SECTION_OPTIONS}
      />

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

          {/* In-progress rolls (building/ready/processing) */}
          {!isLoading && !error && inProgressRolls.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                In Progress
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-element)]">
                {inProgressRolls.map((roll) => {
                  const status = STATUS_LABEL[roll.status] || STATUS_LABEL.building;
                  return (
                    <button
                      key={roll.id}
                      type="button"
                      onClick={() => router.push(`/roll/${roll.id}`)}
                      className="text-left group cursor-pointer"
                    >
                      {/* Cover placeholder */}
                      <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-tight)]">
                          <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] tabular-nums">
                            {roll.photo_count}/{roll.max_photos}
                          </span>
                        </div>
                        {/* Status badge */}
                        <span
                          className="absolute top-[var(--space-tight)] right-[var(--space-tight)] px-1.5 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium"
                          style={{ backgroundColor: `color-mix(in oklch, ${status.color} 15%, transparent)`, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                        {roll.name || 'Untitled Roll'}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {roll.photo_count} photo{roll.photo_count !== 1 ? 's' : ''} &middot; {formatDate(roll.created_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Developed rolls — the main library */}
          {!isLoading && !error && developedRolls.length > 0 && (
            <div>
              {inProgressRolls.length > 0 && (
                <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                  Developed
                </h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-element)]">
                {developedRolls.map((roll) => (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => router.push(`/roll/${roll.id}`)}
                    className="text-left group cursor-pointer"
                  >
                    {/* Cover image placeholder */}
                    <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 size={24} className="text-[var(--color-developed)]" />
                      </div>
                      <span className="absolute top-[var(--space-tight)] right-[var(--space-tight)] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium bg-[var(--color-developed)]/10 text-[var(--color-developed)]">
                        <Wand2 size={10} /> Developed
                      </span>
                    </div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {roll.name || 'Untitled Roll'}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {roll.photo_count} photo{roll.photo_count !== 1 ? 's' : ''}
                      {roll.film_profile && <> &middot; <span className="capitalize">{roll.film_profile}</span></>}
                      {' '}&middot; {formatDate(roll.created_at)}
                    </p>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-element)] opacity-60">
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
              title="No reels yet"
              description="Build your first reel by selecting clips from your feed."
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-element)]">
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
                        className="absolute top-[var(--space-tight)] right-[var(--space-tight)] px-1.5 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium"
                        style={{ backgroundColor: `color-mix(in oklch, ${status.color} 15%, transparent)`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {reel.name || 'Untitled Reel'}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-micro)]">
              {favorites.map((fav) => (
                <div key={fav.id} className="relative group">
                  <img
                    src={fav.photos.thumbnail_url}
                    alt={`Favorited photo from ${fav.rolls?.name || 'roll'}`}
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                  />
                  {/* Heart overlay */}
                  <div className="absolute top-[var(--space-tight)] right-[var(--space-tight)]">
                    <HeartButton
                      isHearted={true}
                      onChange={() => handleUnfavorite(fav.photo_id)}
                    />
                  </div>
                  {/* Roll name badge */}
                  {fav.rolls?.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-[var(--space-tight)] py-[var(--space-tight)]">
                      <span className="text-[length:var(--text-caption)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)]">
                        {fav.rolls.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
