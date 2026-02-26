'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Book, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { MagazineCover } from '@/components/magazine/MagazineCover';
import { CreateBookModal } from '@/components/book/CreateBookModal';
import { NudgeBanner } from '@/components/shared/NudgeBanner';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';

type DesignSection = 'magazines' | 'books';

const SECTION_OPTIONS = [
  { value: 'magazines', label: 'Magazines' },
  { value: 'books', label: 'Books' },
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

export default function DesignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<DesignSection>('magazines');
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBook, setShowCreateBook] = useState(false);

  // Fetch magazines and books
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [magRes, bookRes] = await Promise.all([
          fetch('/api/magazines'),
          fetch('/api/projects/albums'),
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
      router.push(`/projects/magazines/${bookId}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)]">
          Designs
        </h1>
        {activeSection === 'magazines' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/projects/magazines/create')}
          >
            <Plus size={16} className="mr-1" />
            New Magazine
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setShowCreateBook(true)}>
            <Plus size={16} className="mr-1" />
            New Book
          </Button>
        )}
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
                <button
                  key={book.id}
                  type="button"
                  onClick={() => router.push(`/projects/magazines/${book.id}`)}
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
                </button>
              ))}
            </div>
          )}
        </>
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
