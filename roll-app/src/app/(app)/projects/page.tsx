'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Film,
  Plus,
  Play,
  MoreHorizontal,
  Trash2,
  Copy,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { Spinner } from '@/components/ui/Spinner';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { GridSizeSelector } from '@/components/ui/GridSizeSelector';
import { CreateBookModal } from '@/components/book/CreateBookModal';
import { NudgeBanner } from '@/components/shared/NudgeBanner';
import { useToast } from '@/stores/toastStore';
type ProjectSection = 'albums' | 'reels';

const SECTION_OPTIONS = [
  { value: 'albums', label: 'Books' },
  { value: 'reels', label: 'Reels' },
];

interface Album {
  id: string;
  name: string;
  description?: string | null;
  cover_url: string | null;
  photo_count: number;
  captions?: Record<string, string>;
  created_at: string;
  updated_at?: string;
}

interface ProjectReel {
  id: string;
  name: string;
  poster_url: string | null;
  clip_count: number;
  duration_ms: number | null;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
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
  const [gridColumns, setGridColumns] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialPhotoIds, setInitialPhotoIds] = useState<string[]>([]);

  // Load projects
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const albumsRes = await fetch('/api/projects/albums');
        if (albumsRes.ok) {
          const json = await albumsRes.json();
          const apiAlbums = json.data ?? [];
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          const apiIds = new Set(apiAlbums.map((a: Album) => a.id));
          const localAlbums = stored
            .filter((a: Album) => !apiIds.has(a.id))
            .map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || 'Untitled Book',
              description: (a.description as string) || null,
              cover_url: (a.cover_url as string) || null,
              photo_count: (a.photo_count as number) || 0,
              captions: (a.captions as Record<string, string>) || {},
              created_at: (a.created_at as string) || new Date().toISOString(),
              updated_at:
                (a.updated_at as string) || (a.created_at as string) || new Date().toISOString(),
            }));
          setAlbums([...localAlbums, ...apiAlbums]);
        } else {
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          setAlbums(
            stored.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || 'Untitled Book',
              description: (a.description as string) || null,
              cover_url: (a.cover_url as string) || null,
              photo_count: (a.photo_count as number) || 0,
              captions: (a.captions as Record<string, string>) || {},
              created_at: (a.created_at as string) || new Date().toISOString(),
              updated_at: (a.updated_at as string) || new Date().toISOString(),
            }))
          );
        }
      } catch {
        try {
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          setAlbums(
            stored.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || 'Untitled Book',
              description: (a.description as string) || null,
              cover_url: (a.cover_url as string) || null,
              photo_count: (a.photo_count as number) || 0,
              captions: (a.captions as Record<string, string>) || {},
              created_at: (a.created_at as string) || new Date().toISOString(),
              updated_at: (a.updated_at as string) || new Date().toISOString(),
            }))
          );
        } catch {
          // Albums not available
        }
      }

      try {
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

  // Auto-open create modal from query params
  useEffect(() => {
    const createParam = searchParams.get('create');
    const photoIdsParam = searchParams.get('photoIds');
    if (createParam === 'album') {
      if (photoIdsParam) setInitialPhotoIds(photoIdsParam.split(','));
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const handleBookCreated = useCallback(
    (bookId: string) => {
      setShowCreateModal(false);
      router.push(`/projects/albums/${bookId}`);
    },
    [router]
  );

  const handleDeleteBook = useCallback(
    async (albumId: string) => {
      try {
        await fetch(`/api/projects/albums/${albumId}`, { method: 'DELETE' });
      } catch {
        // Continue with local delete
      }
      const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
      localStorage.setItem(
        'roll-albums',
        JSON.stringify(stored.filter((a: Record<string, unknown>) => a.id !== albumId))
      );
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      setContextMenuId(null);
      toast('Book deleted', 'info');
    },
    [toast]
  );

  const handleDuplicateBook = useCallback(
    async (album: Album) => {
      const newId = `local-${Date.now()}`;
      const duplicate: Album = {
        ...album,
        id: newId,
        name: `${album.name} (copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
      stored.unshift(duplicate);
      localStorage.setItem('roll-albums', JSON.stringify(stored));
      setAlbums((prev) => [duplicate, ...prev]);
      setContextMenuId(null);
      toast('Book duplicated', 'success');
    },
    [toast]
  );

  // Filter albums by search
  const filteredAlbums = searchQuery
    ? albums.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : albums;

  const filteredReels = searchQuery
    ? reels.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : reels;

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Page header */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-[var(--space-tight)]">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInitialPhotoIds([]);
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            New Book
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]"
          />
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full h-10 pl-9 pr-3 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[length:var(--text-label)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]"
          />
        </div>
      )}

      {/* Nudge banner */}
      <NudgeBanner context="projects" />

      {/* Section toggle + grid toggle */}
      <div className="flex items-center justify-between">
        <ContentModePills
          activeMode={activeSection}
          onChange={(mode) => setActiveSection(mode as ProjectSection)}
          options={SECTION_OPTIONS}
          variant="primary"
        />
        <GridSizeSelector value={gridColumns} onChange={setGridColumns} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="md" />
        </div>
      )}

      {/* Books section */}
      {!loading && activeSection === 'albums' && (
        <section className="tab-content-enter">
          {filteredAlbums.length === 0 ? (
            <Empty
              icon={BookOpen}
              title={searchQuery ? 'No books found' : 'No books yet'}
              description={
                searchQuery
                  ? `No books match "${searchQuery}".`
                  : 'Create your first photo book from your favorite photos. Add captions, reorder pages, and order a printed copy.'
              }
              action={
                !searchQuery ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setInitialPhotoIds([]);
                      setShowCreateModal(true);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Create Your First Book
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              className="grid gap-[var(--space-component)]"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
              {filteredAlbums.map((album) => (
                <div key={album.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/albums/${album.id}`)}
                    className="text-left w-full"
                  >
                    {/* Book cover card */}
                    <div className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)] shadow-[var(--shadow-raised)] group-hover:shadow-[var(--shadow-floating)] transition-shadow duration-200">
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-tight)] bg-[var(--color-surface-sunken)]">
                          <BookOpen size={24} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                      )}

                      {/* Gradient + title overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-3">
                        <p className="font-[family-name:var(--font-display)] font-medium text-white text-[length:var(--text-label)] leading-tight truncate drop-shadow-sm">
                          {album.name}
                        </p>
                        {album.description && (
                          <p className="text-white/60 text-[length:var(--text-caption)] mt-0.5 line-clamp-1">
                            {album.description}
                          </p>
                        )}
                      </div>

                      {/* Spine decoration */}
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/20 to-transparent" />

                      {/* Page count badge */}
                      <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm rounded-[var(--radius-pill)] px-2 py-0.5">
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-white/80">
                          {album.photo_count} pg
                        </span>
                      </div>
                    </div>

                    {/* Metadata below card */}
                    <div className="flex items-center justify-between">
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {formatRelativeDate(album.updated_at || album.created_at)}
                      </p>
                      {album.captions &&
                        Object.values(album.captions).filter(Boolean).length > 0 && (
                          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            {Object.values(album.captions).filter(Boolean).length} caption
                            {Object.values(album.captions).filter(Boolean).length !== 1 ? 's' : ''}
                          </span>
                        )}
                    </div>
                  </button>

                  {/* Context menu trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(contextMenuId === album.id ? null : album.id);
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-[var(--radius-sharp)] bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {/* Context menu dropdown */}
                  {contextMenuId === album.id && (
                    <div className="absolute top-10 left-2 z-20 bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] py-1 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => {
                          setContextMenuId(null);
                          router.push(`/projects/albums/${album.id}?edit=true`);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateBook(album)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(album.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-[length:var(--text-label)] text-[var(--color-error)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Reels section */}
      {!loading && activeSection === 'reels' && (
        <section className="tab-content-enter">
          {filteredReels.length === 0 ? (
            <Empty
              icon={Film}
              title={searchQuery ? 'No reels found' : 'No reels yet'}
              description={
                searchQuery
                  ? `No reels match "${searchQuery}".`
                  : 'Create a reel from your favorite clips. Reels are chronological — the only editing is trimming clip length.'
              }
            />
          ) : (
            <div
              className="grid gap-[var(--space-element)]"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
              {filteredReels.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => router.push(`/projects/reels/${reel.id}`)}
                  className="text-left group cursor-pointer"
                >
                  <div className="relative aspect-video bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mb-[var(--space-tight)]">
                    {reel.poster_url ? (
                      <img
                        src={reel.poster_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={24} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                        <Play
                          size={18}
                          className="text-white ml-0.5"
                          fill="white"
                          fillOpacity={0.9}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-action)] transition-colors">
                    {reel.name}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''} &middot;{' '}
                    {formatDate(reel.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Close context menu on click outside */}
      {contextMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setContextMenuId(null)} />
      )}

      {/* Create book modal */}
      <CreateBookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleBookCreated}
        initialPhotoIds={initialPhotoIds}
      />
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
