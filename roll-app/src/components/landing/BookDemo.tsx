'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Pencil,
  Eye,
  ShoppingCart,
  Check,
} from 'lucide-react';

/**
 * Fully interactive book demo for the landing page.
 * Shows a hardcover photo book compiled from magazine issues,
 * with all settings (format, font, table of contents) and real photos.
 */

// Real photos from the library — different set from magazine demo
const DEMO_PHOTOS = [
  '/photos/IMG_3791 Large.jpeg',
  '/photos/IMG_9751 Large.jpeg',
  '/photos/IMG_0320 Large.jpeg',
  '/photos/IMG_1570 Large.jpeg',
  '/photos/IMG_3360 Large.jpeg',
  '/photos/IMG_0491 Large.jpeg',
  '/photos/IMG_1591 Large.jpeg',
  '/photos/IMG_3410 Large.jpeg',
  '/photos/IMG_2988 Large.jpeg',
  '/photos/IMG_5503 Large.jpeg',
  '/photos/IMG_3879 Large.jpeg',
  '/photos/IMG_1424 Large.jpeg',
  '/photos/IMG_4498 Large.jpeg',
  '/photos/IMG_5630 Large.jpeg',
  '/photos/IMG_1600 Large.jpeg',
  '/photos/IMG_2543 Large.jpeg',
  '/photos/IMG_1686 Large.jpeg',
  '/photos/IMG_3403 Large.jpeg',
  '/photos/76BBD8D2-D7D1-4A75-8207-794B07FFD1D1 Large.jpeg',
  '/photos/801FB7C1-4CBE-469A-B3E4-91785923EE33 Large.jpeg',
  '/photos/842FF6DB-19ED-4E40-8201-E742D0D84C59 Large.jpeg',
  '/photos/9ADD0AF2-5D7B-417D-830A-A29868DE7733 Large.jpeg',
  '/photos/CD59C42D-DD27-4AD8-8CDA-1B858B9FB4A2 Large.jpeg',
  '/photos/DB7BD432-EDDD-4B44-8CD1-945BF4B26EAB Large.jpeg',
];

interface DemoBookPage {
  type: 'book-cover' | 'toc' | 'magazine-title' | 'photo' | 'photo-spread' | 'back-cover';
  photos: string[];
  title?: string;
  subtitle?: string;
  caption?: string;
  tocEntries?: { title: string; startPage: number }[];
}

const DEMO_TOC = [
  { title: 'January — New Beginnings', startPage: 3 },
  { title: 'February — Winter Light', startPage: 9 },
  { title: 'March — First Signs of Spring', startPage: 15 },
];

// Pre-built book pages
const DEMO_PAGES: DemoBookPage[] = [
  // Cover
  { type: 'book-cover', photos: [DEMO_PHOTOS[0]], title: '2025: A Year in Photos' },
  // Table of contents
  { type: 'toc', photos: [], title: 'Contents', tocEntries: DEMO_TOC },
  // Section 1: January
  { type: 'magazine-title', photos: [DEMO_PHOTOS[1]], title: 'January', subtitle: 'New Beginnings' },
  { type: 'photo', photos: [DEMO_PHOTOS[2]], caption: 'The first morning of the year' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[3], DEMO_PHOTOS[4]] },
  { type: 'photo', photos: [DEMO_PHOTOS[5]], caption: 'Frozen lake at sunrise' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[6], DEMO_PHOTOS[7]], caption: 'Cozy afternoons' },
  { type: 'photo', photos: [DEMO_PHOTOS[8]] },
  // Section 2: February
  { type: 'magazine-title', photos: [DEMO_PHOTOS[9]], title: 'February', subtitle: 'Winter Light' },
  { type: 'photo', photos: [DEMO_PHOTOS[10]], caption: 'Golden hour through bare branches' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[11], DEMO_PHOTOS[12]] },
  { type: 'photo', photos: [DEMO_PHOTOS[13]], caption: 'Snow day with the kids' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[14], DEMO_PHOTOS[15]], caption: 'Valentine\'s weekend' },
  { type: 'photo', photos: [DEMO_PHOTOS[16]] },
  // Section 3: March
  { type: 'magazine-title', photos: [DEMO_PHOTOS[17]], title: 'March', subtitle: 'First Signs of Spring' },
  { type: 'photo', photos: [DEMO_PHOTOS[18]], caption: 'First crocuses in the yard' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[19], DEMO_PHOTOS[20]] },
  { type: 'photo', photos: [DEMO_PHOTOS[21]], caption: 'Backyard exploration' },
  { type: 'photo-spread', photos: [DEMO_PHOTOS[22], DEMO_PHOTOS[23]] },
  // Back cover
  { type: 'back-cover', photos: [], title: 'Made with Roll' },
];

const FONTS = [
  { id: 'default', name: 'System UI', family: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'garamond', name: 'EB Garamond', family: "'Georgia', serif" },
  { id: 'playfair', name: 'Playfair Display', family: "'Georgia', serif" },
  { id: 'baskerville', name: 'Libre Baskerville', family: "'Georgia', serif" },
];

type BookFormat = '8x10' | '10x10';

const DEMO_MAGAZINES = [
  { id: '1', title: 'January 2025', pages: 8, selected: true },
  { id: '2', title: 'February 2025', pages: 6, selected: true },
  { id: '3', title: 'March 2025', pages: 6, selected: true },
];

export function BookDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [selectedFont, setSelectedFont] = useState(0);
  const [format, setFormat] = useState<BookFormat>('8x10');
  const [isPublic, setIsPublic] = useState(false);

  const totalSpreads = Math.ceil(DEMO_PAGES.length / 2);
  const leftPage = DEMO_PAGES[currentSpread * 2] ?? null;
  const rightPage = DEMO_PAGES[currentSpread * 2 + 1] ?? null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-center flex flex-col items-center gap-[var(--space-element)] group"
      >
        {/* Book cover preview — with spine and shadow effect */}
        <div className="w-full aspect-[3/4] relative">
          <div className="w-full h-full rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-overlay)] transition-shadow relative">
            <Image
              src={DEMO_PHOTOS[0]}
              alt="Book cover preview"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* Spine effect */}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
            {/* Title */}
            <div className="absolute bottom-0 inset-x-0 p-4">
              <p className="font-[family-name:var(--font-display)] font-semibold text-white text-[length:var(--text-lead)] leading-tight">
                2025: A Year in Photos
              </p>
              <p className="text-white/60 text-[length:var(--text-caption)] mt-1 font-[family-name:var(--font-mono)]">
                {DEMO_PAGES.length} pages · 8×10 Hardcover
              </p>
            </div>
            {/* Hover prompt */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/20 backdrop-blur-sm rounded-[var(--radius-pill)] px-4 py-2">
                <span className="text-white text-[length:var(--text-label)] font-medium">
                  Open Book
                </span>
              </div>
            </div>
          </div>
        </div>
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
          Books
        </h3>
        <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
          Turn your magazines into a hardcover photo book. Choose your format, pick a font,
          and flip through it in the app — then order a printed copy.
        </p>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-modal)] shadow-[var(--shadow-overlay)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-[var(--color-action)]" />
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
                2025: A Year in Photos
              </h2>
              <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                {DEMO_PAGES.length} pages · {format} Hardcover · 3 magazines
              </p>
            </div>
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
              onClick={() => { setIsOpen(false); setCurrentSpread(0); setMode('read'); }}
              className="p-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-sunken)] transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Main book viewer */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            {/* Book spread */}
            <div className="flex bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] w-full max-w-2xl">
              {/* Left page */}
              <div className="flex-1 flex items-center justify-center border-r border-[var(--color-border)]">
                {leftPage ? (
                  <BookPageRender page={leftPage} pageIndex={currentSpread * 2} font={FONTS[selectedFont].family} bookTitle="2025: A Year in Photos" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[var(--color-surface-sunken)]" />
                )}
              </div>
              {/* Spine */}
              <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0" />
              {/* Right page */}
              <div className="flex-1 flex items-center justify-center">
                {rightPage ? (
                  <BookPageRender page={rightPage} pageIndex={currentSpread * 2 + 1} font={FONTS[selectedFont].family} bookTitle="2025: A Year in Photos" />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center">
                    <BookOpen size={24} className="text-[var(--color-ink-tertiary)]" />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
                disabled={currentSpread === 0}
                className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {currentSpread + 1} / {totalSpreads}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSpread(Math.min(totalSpreads - 1, currentSpread + 1))}
                disabled={currentSpread >= totalSpreads - 1}
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
                    onClick={() => setCurrentSpread(i)}
                    className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors relative ${
                      i === currentSpread
                        ? 'border-[var(--color-action)]'
                        : 'border-transparent hover:border-[var(--color-border)]'
                    }`}
                  >
                    {photoUrl ? (
                      <Image src={photoUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
                        <BookOpen size={8} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings sidebar (edit mode) */}
          {mode === 'edit' && (
            <div className="w-72 border-l border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-y-auto p-4 flex flex-col gap-5">
              {/* Included magazines */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Magazines Included
                </label>
                <div className="flex flex-col gap-1.5">
                  {DEMO_MAGAZINES.map((mag) => (
                    <div
                      key={mag.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sharp)] border-2 border-[var(--color-action)] bg-[var(--color-action)]/5"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block text-[length:var(--text-label)] text-[var(--color-ink)] font-medium truncate">{mag.title}</span>
                        <span className="block text-[10px] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">{mag.pages} pages</span>
                      </div>
                      <div className="w-5 h-5 rounded-[var(--radius-sharp)] bg-[var(--color-action)] flex items-center justify-center shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-[var(--color-ink-tertiary)] mt-1.5">
                  3 selected · {DEMO_MAGAZINES.reduce((s, m) => s + m.pages, 0)} photo pages
                </p>
              </div>

              {/* Format */}
              <div>
                <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] uppercase tracking-[0.06em] text-[var(--color-ink-secondary)] mb-2 block">
                  Format
                </label>
                <div className="flex gap-2">
                  {(['8x10', '10x10'] as BookFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2.5 rounded-[var(--radius-sharp)] border-2 text-center transition-colors ${
                        format === f
                          ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <span className="block font-[family-name:var(--font-mono)] text-[length:var(--text-label)] text-[var(--color-ink)] font-medium">
                        {f === '8x10' ? '8×10' : '10×10'}
                      </span>
                      <span className="block text-[9px] text-[var(--color-ink-tertiary)]">
                        {f === '8x10' ? 'From $39.99' : 'From $49.99'}
                      </span>
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
                        A Year in Photos
                      </span>
                      <span className="text-[10px] text-[var(--color-ink-tertiary)]">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-action)] rounded"
                  />
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink)]">
                    Make available on my public page
                  </span>
                </label>
              </div>

              {/* Price */}
              <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">Estimated price</span>
                  <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-lead)] text-[var(--color-ink)]">
                    {format === '8x10' ? '$39.99' : '$49.99'}
                  </span>
                </div>
                <p className="text-[9px] text-[var(--color-ink-tertiary)] mt-1">+ shipping · {DEMO_PAGES.length} pages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookPageRender({
  page,
  pageIndex,
  font,
  bookTitle,
}: {
  page: DemoBookPage;
  pageIndex: number;
  font: string;
  bookTitle: string;
}) {
  switch (page.type) {
    case 'book-cover':
      return (
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          <Image src={page.photos[0]} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
            <h2
              className="text-white font-semibold text-[clamp(0.875rem,2.5vw,1.5rem)] leading-tight drop-shadow-md"
              style={{ fontFamily: font }}
            >
              {page.title || bookTitle}
            </h2>
          </div>
        </div>
      );

    case 'toc':
      return (
        <div className="w-full aspect-[3/4] bg-[var(--color-surface)] p-5 md:p-8 flex flex-col justify-center" style={{ fontFamily: font }}>
          <h2 className="text-[clamp(0.75rem,1.8vw,1rem)] font-medium text-[var(--color-ink)] mb-4">
            Contents
          </h2>
          <div className="flex flex-col gap-3">
            {(page.tocEntries || []).map((entry, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <span className="text-[clamp(0.6rem,1.2vw,0.75rem)] text-[var(--color-ink)]">{entry.title}</span>
                <span className="flex-1 border-b border-dotted border-[var(--color-border)] mx-1" />
                <span className="font-[family-name:var(--font-mono)] text-[clamp(0.55rem,1vw,0.7rem)] text-[var(--color-ink-tertiary)]">{entry.startPage}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'magazine-title':
      return (
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {page.photos[0] ? (
            <>
              <Image src={page.photos[0]} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </>
          ) : (
            <div className="w-full h-full bg-[var(--color-surface-raised)]" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h3
              className="text-white font-medium text-[clamp(1rem,2.5vw,1.5rem)] leading-tight drop-shadow-md"
              style={{ fontFamily: font }}
            >
              {page.title}
            </h3>
            {page.subtitle && (
              <p className="text-white/70 text-[clamp(0.6rem,1.2vw,0.75rem)] mt-1" style={{ fontFamily: font }}>
                {page.subtitle}
              </p>
            )}
            <div className="w-6 h-px bg-white/40 mt-3" />
          </div>
        </div>
      );

    case 'photo':
      return (
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[var(--color-surface-sunken)]">
          <Image src={page.photos[0]} alt="" fill className="object-cover" />
          {page.caption && (
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
              <p
                className="text-white text-[clamp(0.55rem,1vw,0.7rem)] leading-relaxed italic"
                style={{ fontFamily: font }}
              >
                {page.caption}
              </p>
            </div>
          )}
          <span className="absolute bottom-1.5 right-2 font-[family-name:var(--font-mono)] text-[10px] text-white/50">
            {pageIndex + 1}
          </span>
        </div>
      );

    case 'photo-spread':
      return (
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[var(--color-surface-sunken)] grid grid-rows-2 gap-0.5">
          {page.photos.map((url, i) => (
            <div key={i} className="overflow-hidden relative">
              <Image src={url} alt="" fill className="object-cover" />
            </div>
          ))}
          {page.caption && (
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/40 to-transparent">
              <p className="text-white text-[10px] text-center italic" style={{ fontFamily: font }}>
                {page.caption}
              </p>
            </div>
          )}
          <span className="absolute bottom-1.5 right-2 font-[family-name:var(--font-mono)] text-[10px] text-white/50">
            {pageIndex + 1}
          </span>
        </div>
      );

    case 'back-cover':
      return (
        <div className="w-full aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-2">
          <BookOpen size={20} className="text-[var(--color-ink-tertiary)]" />
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]" style={{ fontFamily: font }}>
            {page.title}
          </p>
        </div>
      );

    default:
      return null;
  }
}
