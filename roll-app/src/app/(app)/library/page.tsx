'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Film, Play, Wand2, Printer } from 'lucide-react';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FavoritesRollPrompt } from '@/components/roll/FavoritesRollPrompt';
import Link from 'next/link';
import type { Roll } from '@/types/roll';
import type { Reel } from '@/types/reel';

type GallerySection = 'rolls' | 'reels';

const SECTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'rolls', label: 'Rolls' },
  { value: 'reels', label: 'Reels' },
];

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

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const REEL_STATUS_BADGE: Record<string, 'developed' | 'processing' | 'action' | 'info'> = {
  ready: 'action',
  processing: 'processing',
  developed: 'developed',
  building: 'info',
};

export default function GalleryPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<GallerySection>('rolls');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollCovers, setRollCovers] = useState<Map<string, string>>(new Map());
  const [showArchived, setShowArchived] = useState(false);
  const [currentReelClips, setCurrentReelClips] = useState<
    Array<{ id: string; photo_id: string; thumbnail_url?: string }>
  >([]);

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
        const fetchedReels: Reel[] = json.data ?? [];
        setReels(fetchedReels);

        // Load clip thumbnails for the current (building/ready) reel
        const buildingReel = fetchedReels.find(
          (r) => r.status === 'building' || r.status === 'ready'
        );
        if (buildingReel) {
          try {
            const reelRes = await fetch(`/api/reels/${buildingReel.id}`);
            if (reelRes.ok) {
              const reelData = await reelRes.json();
              const clips = reelData.data?.clips ?? [];
              setCurrentReelClips(
                clips.map(
                  (c: { id: string; photo_id: string; photos?: { thumbnail_url?: string } }) => ({
                    id: c.id,
                    photo_id: c.photo_id,
                    thumbnail_url: c.photos?.thumbnail_url,
                  })
                )
              );
            } else {
              setCurrentReelClips([]);
            }
          } catch {
            setCurrentReelClips([]);
          }
        } else {
          setCurrentReelClips([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reels');
      } finally {
        setReelsLoading(false);
      }
    }
    fetchReels();
  }, [activeSection]);

  // Separate rolls by state
  const archivedRolls = rolls.filter((r) => r.status === 'archived');
  const developedRolls = rolls.filter((r) => r.status === 'developed');
  const inProgressRolls = rolls.filter((r) => r.status !== 'developed' && r.status !== 'archived');
  const activeReels = reels.filter((r) => r.status !== 'archived');

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Section toggle */}
      <ContentModePills
        activeMode={activeSection}
        onChange={(mode) => setActiveSection(mode as GallerySection)}
        options={SECTION_OPTIONS}
        variant="primary"
      />

      {/* Rolls section */}
      {activeSection === 'rolls' && (
        <section className="flex flex-col gap-[var(--space-section)] tab-content-enter">
          {/* Favorites roll prompt */}
          {!isLoading && !error && <FavoritesRollPrompt />}

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
                    Go to Photos
                  </Button>
                </Link>
              }
            />
          )}

          {/* Current roll — single active roll with fullness indicator */}
          {!isLoading &&
            !error &&
            inProgressRolls.length > 0 &&
            (() => {
              const currentRoll = inProgressRolls[0];
              const fillPercent = Math.min(
                100,
                Math.round((currentRoll.photo_count / currentRoll.max_photos) * 100)
              );
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
                    <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-tight)]">
                      <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                        {currentRoll.name || 'Current Roll'}
                      </p>
                      <p className="text-[length:var(--text-label)] text-[var(--color-ink)]">
                        {currentRoll.photo_count} of {currentRoll.max_photos} photos &middot;{' '}
                        {formatDate(currentRoll.created_at)}
                      </p>
                      <div className="flex items-center gap-[var(--space-element)]">
                        <div className="flex-1 h-2 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${fillPercent}%`,
                              backgroundColor:
                                fillPercent >= 90
                                  ? 'var(--color-processing)'
                                  : 'var(--color-action)',
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

          {/* Developed rolls */}
          {!isLoading && !error && developedRolls.length > 0 && (
            <div>
              {inProgressRolls.length > 0 && (
                <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                  Developed
                </h2>
              )}
              <div
                className="flex flex-row gap-[var(--space-element)] overflow-x-auto px-[var(--space-component)] -mx-[var(--space-component)] pb-[var(--space-tight)] scrollbar-hide"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {developedRolls.map((roll) => (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => router.push(`/roll/${roll.id}`)}
                    className="text-left group cursor-pointer shrink-0 w-72"
                    style={{ scrollSnapAlign: 'start' }}
                  >
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
                    </div>
                    <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                      {roll.name || 'Untitled Roll'}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {roll.photo_count} photo{roll.photo_count !== 1 ? 's' : ''}
                      {roll.film_profile && (
                        <>
                          {' '}
                          &middot; <span className="capitalize">{roll.film_profile}</span>
                        </>
                      )}{' '}
                      &middot; {formatDate(roll.created_at)}
                    </p>
                    <Link
                      href={`/roll/${roll.id}/order`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1 text-[length:var(--text-caption)] font-medium text-[var(--color-action)] hover:underline"
                    >
                      <Printer size={12} /> Print this roll
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
                <span>
                  {showArchived ? 'Hide' : 'Show'} archived ({archivedRolls.length})
                </span>
              </button>
              {showArchived && (
                <div
                  className="flex flex-row gap-[var(--space-element)] overflow-x-auto px-[var(--space-component)] -mx-[var(--space-component)] pb-[var(--space-tight)] opacity-60 scrollbar-hide"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {archivedRolls.map((roll) => (
                    <button
                      key={roll.id}
                      type="button"
                      onClick={() => router.push(`/roll/${roll.id}`)}
                      className="text-left group cursor-pointer shrink-0 w-72"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            Archived
                          </span>
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

      {/* Reels section */}
      {activeSection === 'reels' && (
        <section className="flex flex-col gap-[var(--space-section)] tab-content-enter">
          {reelsLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!reelsLoading && !error && activeReels.length === 0 && reels.length === 0 && (
            <Empty
              icon={Film}
              title="No reels yet"
              description="Create reels from your video clips on the Videos page."
              action={
                <Link href="/videos">
                  <Button variant="primary" size="md">
                    Go to Videos
                  </Button>
                </Link>
              }
            />
          )}

          {/* Current Reel — vertical thumbnail like rolls */}
          {!reelsLoading &&
            !error &&
            (() => {
              const currentReel = activeReels.find(
                (r) => r.status === 'building' || r.status === 'ready'
              );
              if (!currentReel) return null;
              const maxClips = 30;
              const clipFillPercent = Math.min(
                100,
                Math.round((currentReel.clip_count / maxClips) * 100)
              );
              const coverClip = currentReelClips[0];
              return (
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                    Current
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push(`/library/reels/${currentReel.id}`)}
                    className="flex items-center gap-[var(--space-component)] w-full text-left group cursor-pointer"
                  >
                    <div className="relative w-32 h-[170px] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shrink-0">
                      {coverClip?.thumbnail_url ? (
                        <img
                          src={coverClip.thumbnail_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play size={24} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                      )}
                      {/* Play overlay */}
                      {coverClip?.thumbnail_url && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Play size={14} className="text-white ml-0.5" fill="white" fillOpacity={0.8} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-tight)]">
                      <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                        {currentReel.name || 'Current Reel'}
                      </p>
                      <p className="text-[length:var(--text-label)] text-[var(--color-ink)]">
                        {currentReel.clip_count} of {maxClips} clips &middot;{' '}
                        {formatDate(currentReel.created_at)}
                      </p>
                      <div className="flex items-center gap-[var(--space-element)]">
                        <div className="flex-1 h-2 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${clipFillPercent}%`,
                              backgroundColor:
                                clipFillPercent >= 90
                                  ? 'var(--color-processing)'
                                  : 'var(--color-action)',
                            }}
                          />
                        </div>
                        <span className="text-[length:var(--text-caption)] font-[family-name:var(--font-mono)] text-[var(--color-ink-secondary)] tabular-nums shrink-0">
                          {clipFillPercent}%
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })()}

          {/* Developed Reels — vertical list of reel cards */}
          {!reelsLoading &&
            !error &&
            (() => {
              const developedReels = activeReels.filter(
                (r) => r.status === 'developed' || r.status === 'processing'
              );
              if (developedReels.length === 0) return null;
              const hasCurrentReel = activeReels.some(
                (r) => r.status === 'building' || r.status === 'ready'
              );
              return (
                <div>
                  {hasCurrentReel && (
                    <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                      Developed Reels
                    </h2>
                  )}
                  <div
                    className="flex flex-row gap-[var(--space-element)] overflow-x-auto px-[var(--space-component)] -mx-[var(--space-component)] pb-[var(--space-tight)] scrollbar-hide"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {developedReels.map((reel) => {
                      const duration = reel.assembled_duration_ms ?? reel.current_duration_ms;
                      const badgeVariant = REEL_STATUS_BADGE[reel.status] || 'info';
                      const statusLabel = STATUS_LABEL[reel.status] || STATUS_LABEL.building;
                      return (
                        <button
                          key={reel.id}
                          type="button"
                          onClick={() => router.push(`/library/reels/${reel.id}`)}
                          className="text-left shrink-0 w-72 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-floating)] transition-shadow duration-150 cursor-pointer"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-full aspect-video rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] mb-[var(--space-tight)]">
                            {reel.poster_storage_key ? (
                              <img
                                src={`/api/photos/serve?key=${encodeURIComponent(reel.poster_storage_key)}`}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film size={20} className="text-[var(--color-ink-tertiary)]" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <Play
                                  size={16}
                                  className="text-white ml-0.5"
                                  fill="white"
                                  fillOpacity={0.8}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex items-center justify-between gap-[var(--space-tight)] mb-[var(--space-micro)]">
                            <h3 className="font-[family-name:var(--font-display)] text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
                              {reel.name || 'Untitled Reel'}
                            </h3>
                            <Badge variant={badgeVariant}>{statusLabel.label}</Badge>
                          </div>
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''}
                            {' \u00B7 '}
                            <span className="font-[family-name:var(--font-mono)] tabular-nums">
                              {formatDuration(duration)}
                            </span>
                            {reel.film_profile && (
                              <>
                                {' \u00B7 '}
                                <span className="capitalize">{reel.film_profile}</span>
                              </>
                            )}
                            {' \u00B7 '}
                            {formatDate(reel.updated_at || reel.created_at)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </section>
      )}
    </div>
  );
}
