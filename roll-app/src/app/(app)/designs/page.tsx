'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  BookOpen,
  Book,
  Settings,
  X,
  Type,
  Palette,
  Wand2,
  Hash,
  MessageSquare,
  Maximize,
  Globe,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { Badge } from '@/components/ui/Badge';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { MagazineCover } from '@/components/magazine/MagazineCover';
import { CreateBookModal } from '@/components/book/CreateBookModal';
import { NudgeBanner } from '@/components/shared/NudgeBanner';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';
import type { BlogPost } from '@/types/blog';

type DesignSection = 'magazines' | 'books' | 'posts';

const SECTION_OPTIONS = [
  { value: 'magazines', label: 'Magazines' },
  { value: 'books', label: 'Books' },
  { value: 'posts', label: 'Posts' },
];

interface BookItem {
  id: string;
  name: string;
  description?: string | null;
  cover_url: string | null;
  photo_count: number;
  magazine_ids?: string[];
  created_at: string;
}

// Design settings stored in localStorage
interface DesignSettings {
  preferredFonts: string;
  stylePreference: 'minimal' | 'classic' | 'bold' | 'editorial';
  autoDesign: boolean;
  autoMagazineEvery: number; // 0 = off, otherwise number of rolls
  useCaptions: boolean;
  accentColor: string;
  whiteSpacePreference: 'compact' | 'balanced' | 'generous';
  defaultFormat: '6x9' | '8x10';
  coverStyle: 'photo' | 'minimal' | 'typographic';
}

const DEFAULT_SETTINGS: DesignSettings = {
  preferredFonts: '',
  stylePreference: 'classic',
  autoDesign: false,
  autoMagazineEvery: 0,
  useCaptions: true,
  accentColor: '#C45D3E',
  whiteSpacePreference: 'balanced',
  defaultFormat: '6x9',
  coverStyle: 'photo',
};

const SETTINGS_KEY = 'roll-design-settings';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DesignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<DesignSection>('magazines');
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBook, setShowCreateBook] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [designSettings, setDesignSettings] = useState<DesignSettings>(DEFAULT_SETTINGS);

  // Load design settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setDesignSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  const saveSettings = useCallback((updates: Partial<DesignSettings>) => {
    setDesignSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Fetch magazines, books, and posts
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [magRes, bookRes, postsRes] = await Promise.all([
          fetch('/api/magazines'),
          fetch('/api/projects/albums'),
          fetch('/api/blog/posts'),
        ]);
        if (magRes.ok) {
          const json = await magRes.json();
          setMagazines(json.data ?? []);
        }
        if (bookRes.ok) {
          const json = await bookRes.json();
          const apiBooks = json.data ?? [];
          // Merge with locally-stored books
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          const apiIds = new Set(apiBooks.map((b: BookItem) => b.id));
          const localOnly = stored.filter((b: BookItem) => !apiIds.has(b.id));
          setBooks([...apiBooks, ...localOnly]);
        }
        if (postsRes.ok) {
          const json = await postsRes.json();
          setPosts((json.data ?? []).filter((p: BlogPost) => p.status === 'published'));
        }
      } catch {
        toast('Failed to load designs', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBookCreated = useCallback(
    (bookId: string) => {
      setShowCreateBook(false);
      toast('Book created!', 'success');
      // Refresh the books list
      setActiveSection('books');
      fetch('/api/projects/albums')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((json) => {
          const apiBooks = json.data ?? [];
          const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
          const apiIds = new Set(apiBooks.map((b: BookItem) => b.id));
          const localOnly = stored.filter((b: BookItem) => !apiIds.has(b.id));
          setBooks([...apiBooks, ...localOnly]);
        })
        .catch(() => {});
    },
    [toast]
  );

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)]">
          Designs
        </h1>
        <div className="flex items-center gap-[var(--space-tight)]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Design settings"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
          {activeSection === 'magazines' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/projects/magazines/create')}
            >
              <Plus size={16} className="mr-1" />
              New Magazine
            </Button>
          ) : activeSection === 'books' ? (
            <Button variant="primary" size="sm" onClick={() => setShowCreateBook(true)}>
              <Plus size={16} className="mr-1" />
              New Book
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <ContentModePills
        activeMode={activeSection}
        onChange={(mode) => setActiveSection(mode as DesignSection)}
        options={SECTION_OPTIONS}
        variant="primary"
      />

      <NudgeBanner context="projects" />

      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="md" />
        </div>
      )}

      {/* Magazines tab */}
      {!loading && activeSection === 'magazines' && (
        <>
          {magazines.length === 0 ? (
            <Empty
              icon={BookOpen}
              title="No magazines yet"
              description="Create your first photo magazine — auto-designed from your developed rolls."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/projects/magazines/create')}
                >
                  Create Magazine
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--space-component)]">
              {magazines.map((mag) => (
                <MagazineCover
                  key={mag.id}
                  magazine={mag}
                  onClick={() => router.push(`/projects/magazines/${mag.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Books tab */}
      {!loading && activeSection === 'books' && (
        <>
          {books.length === 0 ? (
            <Empty
              icon={Book}
              title="No books yet"
              description="Books are assembled from your magazine designs. Create a magazine first, then compile your favorites into a printed book."
              action={
                magazines.length > 0 ? (
                  <Button variant="primary" size="sm" onClick={() => setShowCreateBook(true)}>
                    Create Book
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/projects/magazines/create')}
                  >
                    Create a Magazine First
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--space-component)]">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="relative aspect-[3/4] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] group transition-transform hover:scale-[1.02] text-left"
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-sunken)]">
                      <Book size={32} className="text-[var(--color-ink-tertiary)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="font-[family-name:var(--font-display)] font-medium text-white text-[length:var(--text-lead)] leading-tight truncate">
                      {book.name || 'Untitled Book'}
                    </p>
                    <p className="text-white/70 text-[length:var(--text-caption)] mt-0.5">
                      {book.photo_count} pages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Published Posts tab */}
      {!loading && activeSection === 'posts' && (
        <>
          {posts.length === 0 ? (
            <Empty
              icon={Globe}
              title="No published posts yet"
              description="Publish a roll from the roll detail page to see it here."
            />
          ) : (
            <div className="flex flex-col gap-[var(--space-element)]">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-micro)]">
                      <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
                        {post.title}
                      </p>
                      <Badge variant="developed">published</Badge>
                    </div>
                    <div className="flex items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      <span>{formatDate(post.published_at || post.created_at)}</span>
                      {post.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {post.view_count}
                        </span>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <span>{post.tags.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-action)] transition-colors"
                    title="View post"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Design Settings Panel — slides in from right */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_150ms_ease-out]"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[var(--color-surface)] shadow-[var(--shadow-overlay)] flex flex-col animate-[slideInRight_200ms_ease-out] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-[var(--space-component)] py-[var(--space-element)] border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-[var(--space-element)]">
                <Settings size={18} className="text-[var(--color-ink-secondary)]" />
                <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                  Design Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-2 -mr-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Settings content */}
            <div className="flex-1 overflow-y-auto">
              {/* Preferred Fonts */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Type size={14} /> Preferred Fonts
                </h3>
                <input
                  type="text"
                  value={designSettings.preferredFonts}
                  onChange={(e) => saveSettings({ preferredFonts: e.target.value })}
                  placeholder="e.g. Garamond, Futura, Helvetica"
                  className="w-full h-10 px-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)]"
                />
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
                  Comma-separated list of fonts to use in your designs.
                </p>
              </div>

              {/* Style Preference */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Palette size={14} /> Style Preference
                </h3>
                <div className="flex flex-col gap-[var(--space-tight)]">
                  {(['minimal', 'classic', 'bold', 'editorial'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => saveSettings({ stylePreference: style })}
                      className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] transition-colors ${
                        designSettings.stylePreference === style
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <span className="text-[length:var(--text-body)] font-medium capitalize">
                        {style}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Design */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Wand2 size={14} /> Auto Design
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                      Automatically design magazines
                    </span>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      Generate a magazine design when rolls are developed
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveSettings({ autoDesign: !designSettings.autoDesign })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${designSettings.autoDesign ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${designSettings.autoDesign ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Auto Magazine Frequency */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Hash size={14} /> Auto Magazine Frequency
                </h3>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
                  Automatically create a magazine every X rolls. Set to 0 to disable.
                </p>
                <div className="flex items-center gap-[var(--space-element)]">
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Off
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={designSettings.autoMagazineEvery}
                    onChange={(e) => saveSettings({ autoMagazineEvery: Number(e.target.value) })}
                    className="flex-1 accent-[var(--color-action)]"
                  />
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] min-w-[2ch] text-right">
                    {designSettings.autoMagazineEvery || 'Off'}
                  </span>
                </div>
                {designSettings.autoMagazineEvery > 0 && (
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-[var(--space-tight)]">
                    A magazine will be created automatically every {designSettings.autoMagazineEvery} roll{designSettings.autoMagazineEvery !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {/* Captions */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <MessageSquare size={14} /> Captions
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                      Use captions in designs
                    </span>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      Include photo captions and stories in magazine layouts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveSettings({ useCaptions: !designSettings.useCaptions })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${designSettings.useCaptions ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${designSettings.useCaptions ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Palette size={14} /> Accent Color
                </h3>
                <div className="flex items-center gap-[var(--space-element)]">
                  <input
                    type="color"
                    value={designSettings.accentColor}
                    onChange={(e) => saveSettings({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-[var(--radius-sharp)] border border-[var(--color-border)] cursor-pointer"
                  />
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                    {designSettings.accentColor}
                  </span>
                </div>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
                  Used for headings, dividers, and decorative elements in your designs.
                </p>
              </div>

              {/* White Space */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <Maximize size={14} /> White Space
                </h3>
                <div className="flex flex-col gap-[var(--space-tight)]">
                  {(['compact', 'balanced', 'generous'] as const).map((ws) => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => saveSettings({ whiteSpacePreference: ws })}
                      className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] transition-colors ${
                        designSettings.whiteSpacePreference === ws
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <span className="text-[length:var(--text-body)] font-medium capitalize">
                        {ws}
                      </span>
                      <span className="text-[length:var(--text-caption)]">
                        {ws === 'compact' ? '— More photos per page' : ws === 'balanced' ? '— Default spacing' : '— Breathable layouts'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Format */}
              <div className="p-[var(--space-component)] border-b border-[var(--color-border)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <BookOpen size={14} /> Default Format
                </h3>
                <div className="flex items-center gap-[var(--space-element)]">
                  {(['6x9', '8x10'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => saveSettings({ defaultFormat: fmt })}
                      className={`px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-sharp)] border-2 transition-colors ${
                        designSettings.defaultFormat === fmt
                          ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                      }`}
                    >
                      <span className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                        {fmt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Style */}
              <div className="p-[var(--space-component)]">
                <h3 className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
                  <BookOpen size={14} /> Cover Style
                </h3>
                <div className="flex flex-col gap-[var(--space-tight)]">
                  {(['photo', 'minimal', 'typographic'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => saveSettings({ coverStyle: style })}
                      className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] transition-colors ${
                        designSettings.coverStyle === style
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <span className="text-[length:var(--text-body)] font-medium capitalize">
                        {style}
                      </span>
                      <span className="text-[length:var(--text-caption)]">
                        {style === 'photo' ? '— Full-bleed cover photo' : style === 'minimal' ? '— Clean with small image' : '— Text-focused design'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Book Modal */}
      <CreateBookModal
        isOpen={showCreateBook}
        onClose={() => setShowCreateBook(false)}
        onCreated={handleBookCreated}
      />
    </div>
  );
}
