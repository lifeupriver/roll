'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Film, Plus, Play, Image as ImageIcon, ChevronRight, Grid2x2, Grid3x3, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { Spinner } from '@/components/ui/Spinner';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/stores/toastStore';
import type { Photo } from '@/types/photo';

type ProjectSection = 'albums' | 'reels';

const SECTION_OPTIONS = [
  { value: 'albums', label: 'Albums' },
  { value: 'reels', label: 'Reels' },
];

interface Album {
  id: string;
  name: string;
  cover_url: string | null;
  photo_count: number;
  created_at: string;
}

interface ProjectReel {
  id: string;
  name: string;
  poster_url: string | null;
  clip_count: number;
  duration_ms: number | null;
  created_at: string;
}

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  photos: Photo;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ProjectSection>('albums');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [reels, setReels] = useState<ProjectReel[]>([]);
  const [loading, setLoading] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'album' | 'reel'>('album');
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  // Photo/clip selector state
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  const [gridColumns, setGridColumns] = useState(3);

  // Load projects
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load albums from API
        const albumsRes = await fetch('/api/projects/albums');
        if (albumsRes.ok) {
          const json = await albumsRes.json();
          const apiAlbums = json.data ?? [];

          // Merge with local albums from localStorage
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          const apiIds = new Set(apiAlbums.map((a: Album) => a.id));
          const localAlbums = stored
            .filter((a: Album) => !apiIds.has(a.id))
            .map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || 'Untitled Album',
              cover_url: (a.cover_url as string) || null,
              photo_count: (a.photo_count as number) || 0,
              created_at: (a.created_at as string) || new Date().toISOString(),
            }));

          setAlbums([...localAlbums, ...apiAlbums]);
        } else {
          // Fallback to localStorage only
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          setAlbums(stored.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            name: (a.name as string) || 'Untitled Album',
            cover_url: (a.cover_url as string) || null,
            photo_count: (a.photo_count as number) || 0,
            created_at: (a.created_at as string) || new Date().toISOString(),
          })));
        }
      } catch {
        // Fallback to localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          setAlbums(stored.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            name: (a.name as string) || 'Untitled Album',
            cover_url: (a.cover_url as string) || null,
            photo_count: (a.photo_count as number) || 0,
            created_at: (a.created_at as string) || new Date().toISOString(),
          })));
        } catch {
          // Albums not available
        }
      }

      try {
        // Load project reels
        const reelsRes = await fetch('/api/reels?status=developed');
        if (reelsRes.ok) {
          const json = await reelsRes.json();
          setReels(
            (json.data ?? []).map((r: Record<string, unknown>) => ({
              id: r.id,
              name: r.name || 'Untitled Reel',
              poster_url: r.poster_storage_key
                ? `/api/photos/serve?key=${encodeURIComponent(r.poster_storage_key as string)}`
                : null,
              clip_count: r.clip_count ?? 0,
              duration_ms: r.assembled_duration_ms ?? null,
              created_at: r.created_at as string,
            }))
          );
        }
      } catch {
        // Reels not available
      }

      setLoading(false);
    }
    load();
  }, []);

  // Fetch favorites when opening create modal
  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const json = await res.json();
        setFavorites(json.data ?? []);
      }
    } catch {
      toast('Failed to load favorites', 'error');
    } finally {
      setFavoritesLoading(false);
    }
  }, [toast]);

  const handleOpenCreate = useCallback(
    (type: 'album' | 'reel') => {
      setCreateType(type);
      setProjectName('');
      setSelectedPhotoIds(new Set());
      setShowCreateModal(true);
      loadFavorites();
    },
    [loadFavorites]
  );

  // Auto-open create modal from query params (e.g. from favorites selection)
  useEffect(() => {
    const createParam = searchParams.get('create');
    const photoIdsParam = searchParams.get('photoIds');
    if (createParam === 'album' || createParam === 'reel') {
      setCreateType(createParam);
      setProjectName('');
      if (photoIdsParam) {
        setSelectedPhotoIds(new Set(photoIdsParam.split(',')));
      }
      setShowCreateModal(true);
      loadFavorites();
    }
  }, [searchParams, loadFavorites]);

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (selectedPhotoIds.size === 0) {
      toast('Select at least one photo', 'error');
      return;
    }

    setCreating(true);
    try {
      if (createType === 'album') {
        const albumName = projectName.trim() || 'Untitled Album';
        const photoIds = Array.from(selectedPhotoIds);

        // Create album via API
        const res = await fetch('/api/projects/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: albumName, photoIds }),
        });

        let albumData: Record<string, unknown> | null = null;
        if (res.ok) {
          const json = await res.json();
          albumData = json.data;
        }

        if (!albumData) {
          // Fallback: create a local album
          albumData = {
            id: `local-${Date.now()}`,
            name: albumName,
            cover_url: null,
            photo_count: photoIds.length,
            photo_ids: photoIds,
            created_at: new Date().toISOString(),
          };
        }

        // Also store in localStorage for the album detail page to read
        const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
        stored.unshift(albumData);
        localStorage.setItem('roll-albums', JSON.stringify(stored));

        setAlbums((prev) => [{
          id: albumData!.id as string,
          name: albumData!.name as string,
          cover_url: (albumData!.cover_url as string) || null,
          photo_count: albumData!.photo_count as number,
          created_at: albumData!.created_at as string,
        }, ...prev]);

        toast('Album created!', 'success');
        setShowCreateModal(false);
        router.push(`/projects/albums/${albumData.id}`);
      } else {
        // Create reel from selected clips/favorites
        toast('Reel creation coming soon!', 'info');
        setShowCreateModal(false);
      }
    } catch {
      toast('Something went wrong', 'error');
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  }, [createType, projectName, selectedPhotoIds, toast, router]);

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
          Projects
        </h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleOpenCreate(activeSection === 'albums' ? 'album' : 'reel')}
        >
          <Plus size={16} className="mr-1" />
          New {activeSection === 'albums' ? 'Album' : 'Reel'}
        </Button>
      </div>

      {/* Section toggle + grid slider */}
      <div className="flex items-center justify-between">
        <ContentModePills
          activeMode={activeSection}
          onChange={(mode) => setActiveSection(mode as ProjectSection)}
          options={SECTION_OPTIONS}
        />
        <div className="flex items-center gap-[var(--space-tight)]">
          <Grid2x2 size={14} className="text-[var(--color-ink-tertiary)]" />
          <input
            type="range"
            min={2}
            max={4}
            value={gridColumns}
            onChange={(e) => setGridColumns(Number(e.target.value))}
            className="w-16 accent-[var(--color-action)]"
            aria-label="Grid columns"
          />
          <Grid3x3 size={14} className="text-[var(--color-ink-tertiary)]" />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="md" />
        </div>
      )}

      {/* Albums section */}
      {!loading && activeSection === 'albums' && (
        <section>
          {albums.length === 0 ? (
            <Empty
              icon={BookOpen}
              title="No albums yet"
              description="Create your first album from your favorite photos. Each album is a simple book with one photo per page. Use the + New Album button above to get started."
            />
          ) : (
            <div className="grid gap-[var(--space-element)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
              {albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => router.push(`/projects/albums/${album.id}`)}
                  className="text-left group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                    {album.cover_url ? (
                      <img
                        src={album.cover_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-tight)]">
                        <BookOpen size={24} className="text-[var(--color-ink-tertiary)]" />
                        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                          {album.photo_count} pages
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                    {album.name}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {album.photo_count} page{album.photo_count !== 1 ? 's' : ''} &middot; {formatDate(album.created_at)}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[length:var(--text-caption)] font-medium text-[var(--color-action)]">
                    <ShoppingBag size={12} /> Buy Book
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Reels section */}
      {!loading && activeSection === 'reels' && (
        <section>
          {reels.length === 0 ? (
            <Empty
              icon={Film}
              title="No reels yet"
              description="Create a reel from your favorite clips. Reels are chronological — the only editing is trimming clip length."
              action={
                <Button variant="primary" size="md" onClick={() => handleOpenCreate('reel')}>
                  <Plus size={16} className="mr-1" />
                  New Reel
                </Button>
              }
            />
          ) : (
            <div className="grid gap-[var(--space-element)]" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
              {reels.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => router.push(`/projects/reels/${reel.id}`)}
                  className="text-left group cursor-pointer"
                >
                  <div className="relative aspect-video bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                    {reel.poster_url ? (
                      <img src={reel.poster_url} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                  </div>
                  <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                    {reel.name}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''} &middot; {formatDate(reel.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Create project modal — select favorites */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="flex flex-col gap-[var(--space-component)]">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
              New {createType === 'album' ? 'Album' : 'Reel'}
            </h2>

            <Input
              label="Name"
              placeholder={createType === 'album' ? 'My Photo Book' : 'My Reel'}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {createType === 'album'
                ? 'Select your favorite photos. Each will be one page in the book.'
                : 'Select clips to include. They will play in chronological order.'}
            </p>

            {/* Favorites/photo grid */}
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-[var(--space-section)]">
                <Spinner size="sm" />
              </div>
            ) : favorites.length === 0 ? (
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-section)]">
                No favorites yet. Heart photos in your developed rolls first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1 max-h-[320px] overflow-y-auto rounded-[var(--radius-card)]">
                {favorites.map((fav) => {
                  const isSelected = selectedPhotoIds.has(fav.photo_id);
                  return (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => togglePhotoSelection(fav.photo_id)}
                      className="relative aspect-square overflow-hidden bg-[var(--color-surface-sunken)] group"
                    >
                      <img
                        src={fav.photos.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[var(--color-action)]/20 ring-2 ring-inset ring-[var(--color-action)]" />
                      )}
                      <div
                        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? 'bg-[var(--color-action)] scale-100'
                            : 'bg-[var(--color-surface-overlay)]/40 border border-white/60 scale-90 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected && (
                          <span className="text-white text-[10px] font-bold">
                            {Array.from(selectedPhotoIds).indexOf(fav.photo_id) + 1}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPhotoIds.size > 0 && (
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {selectedPhotoIds.size} {createType === 'album' ? 'page' : 'clip'}{selectedPhotoIds.size !== 1 ? 's' : ''} selected
              </p>
            )}

            <div className="flex items-center justify-end gap-[var(--space-element)]">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                isLoading={creating}
                disabled={selectedPhotoIds.size === 0}
              >
                Create {createType === 'album' ? 'Album' : 'Reel'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsContent />
    </Suspense>
  );
}
