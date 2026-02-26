'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Eye,
  ShoppingCart,
  Type,
  Calendar,
  BookOpen,
} from 'lucide-react';

/**
 * Fully interactive magazine demo for the landing page.
 * Uses real photos from the library, shows spreads, page editor,
 * font/template/format settings — everything the real product does.
 */

// Real photos from the library
const DEMO_PHOTOS = [
  '/photos/IMG_3528 Large.jpeg',
  '/photos/IMG_1071 Large.jpeg',
  '/photos/IMG_3801 Large.jpeg',
  '/photos/IMG_5443 Large.jpeg',
  '/photos/IMG_0296 Large.jpeg',
  '/photos/IMG_3372 Large.jpeg',
  '/photos/IMG_1603 Large.jpeg',
  '/photos/IMG_2650 Large.jpeg',
  '/photos/IMG_3914 Large.jpeg',
  '/photos/IMG_0489 Large.jpeg',
  '/photos/IMG_6724 Large.jpeg',
  '/photos/IMG_3068 Large.jpeg',
  '/photos/IMG_1585 Large.jpeg',
  '/photos/IMG_0358 Large.jpeg',
  '/photos/IMG_3142 Large.jpeg',
  '/photos/IMG_9946 Large.jpeg',
  '/photos/IMG_3235 Large.jpeg',
  '/photos/IMG_4963 Large.jpeg',
  '/photos/IMG_1648 Large.jpeg',
  '/photos/IMG_3601 Large.jpeg',
  '/photos/IMG_5527 Large.jpeg',
  '/photos/IMG_3520 Large.jpeg',
  '/photos/IMG_7779 Large.jpeg',
  '/photos/IMG_0283 Large.jpeg',
];

type DemoLayout = 'full_bleed' | 'two_up_vertical' | 'two_up_horizontal' | 'four_up_grid' | 'three_up_top_heavy' | 'caption_heavy';

interface DemoPage {
  layout: DemoLayout | 'section_divider' | 'cover';
  photos: string[]; // urls
  caption?: string;
  title?: string;
}

// Pre-built magazine pages with varied layouts
const DEMO_PAGES: DemoPage[] = [
  // Cover
  {
    layout: 'cover',
    photos: [DEMO_PHOTOS[0]],
    title: 'February 2026',
    caption: 'A Monthly Magazine',
  },
  // Section divider
  {
    layout: 'section_divider',
    photos: [],
    title: 'Early February',
    caption: 'The first week of the month',
  },
  // Full bleed hero shot
  {
    layout: 'full_bleed',
    photos: [DEMO_PHOTOS[1]],
    caption: 'Morning light through the kitchen window',
  },
  // Two-up vertical
  {
    layout: 'two_up_vertical',
    photos: [DEMO_PHOTOS[2], DEMO_PHOTOS[3]],
  },
  // Four-up grid
  {
    layout: 'four_up_grid',
    photos: [DEMO_PHOTOS[4], DEMO_PHOTOS[5], DEMO_PHOTOS[6], DEMO_PHOTOS[7]],
    caption: 'Weekend adventures',
  },
  // Full bleed
  {
    layout: 'full_bleed',
    photos: [DEMO_PHOTOS[8]],
    caption: 'The golden hour walk',
  },
  // Section divider
  {
    layout: 'section_divider',
    photos: [],
    title: 'Mid February',
    caption: 'Valentine\'s week and beyond',
  },
  // Two-up horizontal
  {
    layout: 'two_up_horizontal',
    photos: [DEMO_PHOTOS[9], DEMO_PHOTOS[10]],
  },
  // Three-up top heavy
  {
    layout: 'three_up_top_heavy',
    photos: [DEMO_PHOTOS[11], DEMO_PHOTOS[12], DEMO_PHOTOS[13]],
    caption: 'Exploring the neighborhood',
  },
  // Caption heavy
  {
    layout: 'caption_heavy',
    photos: [DEMO_PHOTOS[14]],
    caption: 'She picked these flowers from the garden and insisted on carrying them all the way home. Three blocks, no help.',
  },
  // Four-up grid
  {
    layout: 'four_up_grid',
    photos: [DEMO_PHOTOS[15], DEMO_PHOTOS[16], DEMO_PHOTOS[17], DEMO_PHOTOS[18]],
  },
  // Full bleed closing
  {
    layout: 'full_bleed',
    photos: [DEMO_PHOTOS[19]],
    caption: 'Until next month',
  },
];

const FONTS = [
  { id: 'default', name: 'System UI', family: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'garamond', name: 'EB Garamond', family: "'Georgia', serif" },
  { id: 'futura', name: 'Jost', family: "'sans-serif'" },
  { id: 'playfair', name: 'Playfair Display', family: "'Georgia', serif" },
];

const TEMPLATES = [
  { id: 'monthly', name: 'Monthly', icon: Calendar, pages: '~24' },
  { id: 'quarterly', name: 'Quarterly', icon: BookOpen, pages: '~36' },
];

type DemoViewMode = 'read' | 'edit';
type DemoFormat = '6x9' | '8x10';

export function MagazineDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [mode, setMode] = useState<DemoViewMode>('read');
  const [selectedFont, setSelectedFont] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [format, setFormat] = useState<DemoFormat>('6x9');

  const totalSpreads = Math.ceil(DEMO_PAGES.length / 2);
  const leftIndex = spreadIndex * 2;
  const rightIndex = spreadIndex * 2 + 1;
  const leftPage = DEMO_PAGES[leftIndex] ?? null;
  const rightPage = DEMO_PAGES[rightIndex] ?? null;

  if (!isOpen) {
    // Teaser card on the landing page
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-center flex flex-col items-center gap-[var(--space-element)] group"
      >
        {/* Magazine cover preview */}
        <div className="w-full aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] relative group-hover:shadow-[var(--shadow-overlay)] transition-shadow">
          <img
            src={DEMO_PHOTOS[0]}
            alt="Magazine cover preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="font-[family-name:var(--font-display)] font-semibold text-white text-[length:var(--text-lead)] leading-tight">
              February 2026
            </p>
            <p className="text-white/60 text-[length:var(--text-caption)] mt-1 font-[family-name:var(--font-mono)]">
              12 pages · 6×9 · Monthly
            </p>
          </div>
          {/* Hover prompt */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-sm rounded-[var(--radius-pill)] px-4 py-2">
              <span className="text-white text-[length:var(--text-label)] font-medium">
                Open Magazine
              </span>
            </div>
          </div>
        </div>
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
          Magazines
        </h3>
        <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
          Auto-designed from your favorites. Choose a template, pick a font, and we lay out every page.
          Order a printed copy delivered to your door.
        </p>
      </button>
    );
  }

  // Full interactive demo
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
              {DEMO_PAGES.length} pages · {format} · {TEMPLATES[selectedTemplate].name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'read' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-[var(--color-ink-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-white bg-[var(--color-action)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-action-hover)] transition-colors"
                >
                  <ShoppingCart size={14} /> Order Print
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMode('read')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-[var(--color-ink-secondary)] bg-[var(--color-surface)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-label)] text-white bg-[var(--color-action)] rounded-[var(--radius-sharp)]"
                >
                  Save Changes
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setIsOpen(false); setSpreadIndex(0); setMode('read'); }}
              className="p-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-sunken)] transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Main spread viewer */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            {/* Spread */}
            <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] w-full max-w-2xl">
              <SpreadPageView page={leftPage} pageIndex={leftIndex} font={FONTS[selectedFont].family} />
              <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />
              <SpreadPageView page={rightPage} pageIndex={rightIndex} font={FONTS[selectedFont].family} />
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
                {leftIndex + 1}–{Math.min(rightIndex + 1, DEMO_PAGES.length)} of {DEMO_PAGES.length}
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
                const page = DEMO_PAGES[i * 2];
                const photoUrl = page?.photos[0];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSpreadIndex(i)}
                    className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                      i === spreadIndex
                        ? 'border-[var(--color-action)]'
                        : 'border-transparent hover:border-[var(--color-border)]'
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
          </div>

          {/* Settings sidebar (visible in edit mode) */}
          {mode === 'edit' && (
            <div className="w-72 border-l border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-y-auto p-4 flex flex-col gap-5">
              {/* Template */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Template
                </label>
                <div className="flex flex-col gap-1.5">
                  {TEMPLATES.map((tmpl, i) => {
                    const Icon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(i)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sharp)] border-2 transition-colors text-left ${
                          i === selectedTemplate
                            ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <Icon size={16} className={i === selectedTemplate ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'} />
                        <div>
                          <span className="text-[length:var(--text-label)] text-[var(--color-ink)] font-medium block">{tmpl.name}</span>
                          <span className="text-[10px] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">{tmpl.pages} pages</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Format
                </label>
                <div className="flex gap-2">
                  {(['6x9', '8x10'] as DemoFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2 rounded-[var(--radius-sharp)] border-2 font-[family-name:var(--font-mono)] text-[length:var(--text-label)] transition-colors ${
                        format === f
                          ? 'border-[var(--color-action)] bg-[var(--color-action)]/5 text-[var(--color-ink)]'
                          : 'border-[var(--color-border)] text-[var(--color-ink-secondary)]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Font
                </label>
                <div className="flex flex-col gap-1.5">
                  {FONTS.map((font, i) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFont(i)}
                      className={`px-3 py-2 rounded-[var(--radius-sharp)] border-2 text-left transition-colors ${
                        i === selectedFont
                          ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <span
                        className="block text-[length:var(--text-body)] text-[var(--color-ink)] leading-tight"
                        style={{ fontFamily: font.family }}
                      >
                        February 2026
                      </span>
                      <span className="text-[10px] text-[var(--color-ink-tertiary)]">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page list */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Pages ({DEMO_PAGES.length})
                </label>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {DEMO_PAGES.map((page, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSpreadIndex(Math.floor(i / 2))}
                      className={`flex items-center gap-2 p-1.5 rounded-[var(--radius-sharp)] text-left transition-colors ${
                        i >= leftIndex && i <= rightIndex
                          ? 'bg-[var(--color-action)]/10'
                          : 'hover:bg-[var(--color-surface-sunken)]'
                      }`}
                    >
                      <div className="w-8 h-11 rounded-sm overflow-hidden flex-shrink-0 bg-[var(--color-surface-sunken)]">
                        {page.photos[0] ? (
                          <img src={page.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Type size={8} className="text-[var(--color-ink-tertiary)]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] text-[var(--color-ink)] font-medium truncate">
                          {page.layout === 'cover'
                            ? 'Cover'
                            : page.layout === 'section_divider'
                              ? page.title
                              : `Page ${i + 1}`}
                        </span>
                        <span className="block text-[9px] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                          {page.photos.length}p · {page.layout.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">Estimated price</span>
                  <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-lead)] text-[var(--color-ink)]">$14.99</span>
                </div>
                <p className="text-[9px] text-[var(--color-ink-tertiary)] mt-1">+ shipping · Free for Roll+ subscribers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpreadPageView({
  page,
  pageIndex,
  font,
}: {
  page: DemoPage | null;
  pageIndex: number;
  font: string;
}) {
  if (!page) {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center" />
    );
  }

  // Cover page
  if (page.layout === 'cover') {
    return (
      <div className="relative flex-1 aspect-[3/4] overflow-hidden">
        <img src={page.photos[0]} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
          <h3
            className="text-white font-medium text-[clamp(1rem,2.5vw,1.5rem)] leading-tight drop-shadow-md"
            style={{ fontFamily: font }}
          >
            {page.title}
          </h3>
          <p className="text-white/60 text-[length:var(--text-caption)] mt-1">{page.caption}</p>
        </div>
        {/* Magazine badge */}
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-[var(--radius-pill)] px-3 py-1">
          <span className="font-[family-name:var(--font-display)] text-white text-[10px] font-bold tracking-[0.1em] uppercase">
            Roll Magazine
          </span>
        </div>
      </div>
    );
  }

  // Section divider
  if (page.layout === 'section_divider') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-2">
        <span
          className="text-[clamp(0.875rem,2vw,1.25rem)] text-[var(--color-ink)] font-medium"
          style={{ fontFamily: font }}
        >
          {page.title}
        </span>
        {page.caption && (
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] max-w-[80%] text-center">
            {page.caption}
          </span>
        )}
        <div className="w-8 h-px bg-[var(--color-border-strong)] mt-1" />
      </div>
    );
  }

  // Caption heavy
  if (page.layout === 'caption_heavy') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden flex flex-col">
        <div className="flex-[2] overflow-hidden">
          <img src={page.photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-3 bg-[var(--color-surface)] flex items-center">
          <p
            className="text-[clamp(0.6rem,1.2vw,0.75rem)] text-[var(--color-ink-secondary)] leading-relaxed italic"
            style={{ fontFamily: font }}
          >
            {page.caption}
          </p>
        </div>
        <span className="absolute bottom-1.5 right-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)]">
          {pageIndex + 1}
        </span>
      </div>
    );
  }

  // Photo layouts
  const gridStyles = getGridStyles(page.layout);

  return (
    <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden">
      <div className="w-full h-full grid gap-0.5" style={gridStyles}>
        {page.photos.map((url, i) => (
          <div key={i} className="overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {/* Page number */}
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
        {pageIndex + 1}
      </span>
      {page.caption && (
        <div className="absolute bottom-6 inset-x-0 px-2">
          <p className="text-white text-[10px] text-center drop-shadow-sm line-clamp-1">{page.caption}</p>
        </div>
      )}
    </div>
  );
}

function getGridStyles(layout: string): React.CSSProperties {
  switch (layout) {
    case 'full_bleed':
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr' };
    case 'two_up_vertical':
      return { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr' };
    case 'two_up_horizontal':
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr 1fr' };
    case 'three_up_top_heavy':
      return { gridTemplateRows: '2fr 1fr', gridTemplateColumns: '1fr 1fr' };
    case 'four_up_grid':
      return { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr' };
    default:
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr' };
  }
}
