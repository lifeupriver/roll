'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight, X, Pencil, Eye, ShoppingCart, Type } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MagazineCover } from '@/components/magazine/MagazineCover';
import { SpreadPageView, type DemoPage } from '@/components/magazine/SpreadPageView';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';

// Demo photos for the pre-built magazine
const DEMO_PHOTOS = [
  '/photos/IMG_3528%20Large.jpeg',
  '/photos/IMG_1071%20Large.jpeg',
  '/photos/IMG_3801%20Large.jpeg',
  '/photos/IMG_5443%20Large.jpeg',
  '/photos/IMG_0296%20Large.jpeg',
  '/photos/IMG_3372%20Large.jpeg',
  '/photos/IMG_1603%20Large.jpeg',
  '/photos/IMG_2650%20Large.jpeg',
  '/photos/IMG_3914%20Large.jpeg',
  '/photos/IMG_0489%20Large.jpeg',
  '/photos/IMG_6724%20Large.jpeg',
  '/photos/IMG_3068%20Large.jpeg',
  '/photos/IMG_1585%20Large.jpeg',
  '/photos/IMG_0358%20Large.jpeg',
  '/photos/IMG_3142%20Large.jpeg',
  '/photos/IMG_9946%20Large.jpeg',
  '/photos/IMG_3235%20Large.jpeg',
  '/photos/IMG_4963%20Large.jpeg',
  '/photos/IMG_1648%20Large.jpeg',
  '/photos/IMG_3601%20Large.jpeg',
  '/photos/IMG_5527%20Large.jpeg',
  '/photos/IMG_3520%20Large.jpeg',
  '/photos/IMG_7779%20Large.jpeg',
  '/photos/IMG_0283%20Large.jpeg',
];

const DEMO_PAGES: DemoPage[] = [
  { layout: 'cover', photos: [DEMO_PHOTOS[0]], title: 'February 2026', caption: 'A Monthly Magazine' },
  { layout: 'section_divider', photos: [], title: 'Early February', caption: 'The first week of the month' },
  { layout: 'full_bleed', photos: [DEMO_PHOTOS[1]], caption: 'Morning light through the kitchen window' },
  { layout: 'two_up_vertical', photos: [DEMO_PHOTOS[2], DEMO_PHOTOS[3]] },
  { layout: 'four_up_grid', photos: [DEMO_PHOTOS[4], DEMO_PHOTOS[5], DEMO_PHOTOS[6], DEMO_PHOTOS[7]], caption: 'Weekend adventures' },
  { layout: 'full_bleed', photos: [DEMO_PHOTOS[8]], caption: 'The golden hour walk' },
  { layout: 'section_divider', photos: [], title: 'Mid February', caption: "Valentine's week and beyond" },
  { layout: 'two_up_horizontal', photos: [DEMO_PHOTOS[9], DEMO_PHOTOS[10]] },
  { layout: 'three_up_top_heavy', photos: [DEMO_PHOTOS[11], DEMO_PHOTOS[12], DEMO_PHOTOS[13]], caption: 'Exploring the neighborhood' },
  { layout: 'caption_heavy', photos: [DEMO_PHOTOS[14]], caption: 'She picked these flowers from the garden and insisted on carrying them all the way home. Three blocks, no help.' },
  { layout: 'four_up_grid', photos: [DEMO_PHOTOS[15], DEMO_PHOTOS[16], DEMO_PHOTOS[17], DEMO_PHOTOS[18]] },
  { layout: 'full_bleed', photos: [DEMO_PHOTOS[19]], caption: 'Until next month' },
];

const DEMO_MAGAZINE: Magazine = {
  id: 'demo-magazine-001',
  user_id: 'demo',
  title: 'February 2026',
  status: 'review',
  template: 'monthly',
  cover_photo_id: null,
  date_range_start: '2026-02-01',
  date_range_end: '2026-02-28',
  page_count: DEMO_PAGES.length,
  format: '6x9',
  font: 'default',
  roll_ids: null,
  is_public: false,
  public_slug: null,
  pages: [],
  prodigi_order_id: null,
  price_cents: 1499,
  created_at: '2026-02-20T00:00:00Z',
  updated_at: '2026-02-20T00:00:00Z',
};

function MagazineViewer({ pages, onClose }: { pages: DemoPage[]; onClose: () => void }) {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const font = '-apple-system, BlinkMacSystemFont, sans-serif';

  const totalSpreads = Math.ceil(pages.length / 2);
  const leftIndex = spreadIndex * 2;
  const rightIndex = spreadIndex * 2 + 1;
  const leftPage = pages[leftIndex] ?? null;
  const rightPage = pages[rightIndex] ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-modal)] shadow-[var(--shadow-overlay)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center gap-3">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
              February 2026
            </h2>
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {pages.length} pages · 6×9 · Monthly
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'read' ? (
              <>
                <button type="button" onClick={() => setMode('edit')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-[var(--color-ink-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors">
                  <Pencil size={14} /> Edit
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-white bg-[var(--color-action)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-action-hover)] transition-colors">
                  <ShoppingCart size={14} /> Order Print
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('read')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-[var(--color-ink-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors">
                <Eye size={14} /> Preview
              </button>
            )}
            <button type="button" onClick={onClose} className="p-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-sunken)] transition-colors ml-2">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 gap-4">
          {/* Spread */}
          <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] w-full max-w-2xl">
            <SpreadPageView page={leftPage} pageIndex={leftIndex} font={font} />
            <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />
            <SpreadPageView page={rightPage} pageIndex={rightIndex} font={font} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setSpreadIndex(Math.max(0, spreadIndex - 1))}
              disabled={spreadIndex === 0}
              className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {leftIndex + 1}–{Math.min(rightIndex + 1, pages.length)} of {pages.length}
            </span>
            <button
              type="button"
              onClick={() => setSpreadIndex(Math.min(totalSpreads - 1, spreadIndex + 1))}
              disabled={spreadIndex >= totalSpreads - 1}
              className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 w-full max-w-2xl">
            {Array.from({ length: totalSpreads }, (_, i) => {
              const page = pages[i * 2];
              const photoUrl = page?.photos[0];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSpreadIndex(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                    i === spreadIndex ? 'border-[var(--color-action)]' : 'border-transparent hover:border-[var(--color-border)]'
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
                      <Type size={8} className="text-[var(--color-ink-tertiary)]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Price info */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)] w-full max-w-2xl justify-center">
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">Estimated price:</span>
            <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-body)] text-[var(--color-ink)]">$14.99</span>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">+ shipping · Free for Roll+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MagazinesPage() {
  const router = useRouter();
  const { toast: _toast } = useToast();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    async function fetchMagazines() {
      try {
        const res = await fetch('/api/magazines');
        if (res.ok) {
          const json = await res.json();
          setMagazines(json.data ?? []);
        }
      } catch {
        // Silently fail — demo magazine is always available
      } finally {
        setLoading(false);
      }
    }
    fetchMagazines();
  }, []);

  // Combine API magazines with the demo magazine
  const allMagazines = [DEMO_MAGAZINE, ...magazines];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)]">
          Designs
        </h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/projects/magazines/create')}
        >
          <Plus size={16} className="mr-1" />
          New Magazine
        </Button>
      </div>

      {/* Magazine grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--space-component)]">
        {allMagazines.map((mag) => (
          <MagazineCover
            key={mag.id}
            magazine={mag}
            coverUrl={mag.id === 'demo-magazine-001' ? DEMO_PHOTOS[0] : undefined}
            onClick={() => {
              if (mag.id === 'demo-magazine-001') {
                setViewerOpen(true);
              } else {
                router.push(`/projects/magazines/${mag.id}`);
              }
            }}
          />
        ))}
      </div>

      {/* Magazine viewer modal */}
      {viewerOpen && (
        <MagazineViewer pages={DEMO_PAGES} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}
