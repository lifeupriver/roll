'use client';

import type { MagazineFont } from '@/types/magazine';

interface FontOption {
  id: MagazineFont;
  name: string;
  style: string;
  fontFamily: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: 'default', name: 'System UI', style: 'Clean, neutral', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'garamond', name: 'EB Garamond', style: 'Classic editorial serif', fontFamily: "'EB Garamond', Georgia, serif" },
  { id: 'futura', name: 'Jost', style: 'Modern geometric sans', fontFamily: "'Jost', sans-serif" },
  { id: 'courier', name: 'Courier Prime', style: 'Typewriter feel', fontFamily: "'Courier Prime', 'Courier New', monospace" },
  { id: 'playfair', name: 'Playfair Display', style: 'Elegant editorial', fontFamily: "'Playfair Display', Georgia, serif" },
  { id: 'lora', name: 'Lora', style: 'Warm, readable serif', fontFamily: "'Lora', Georgia, serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', style: 'Contemporary sans', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  { id: 'baskerville', name: 'Libre Baskerville', style: 'Timeless, bookish', fontFamily: "'Libre Baskerville', Georgia, serif" },
];

interface FontSelectorProps {
  selectedFont: MagazineFont;
  onFontChange: (font: MagazineFont) => void;
  sampleTitle?: string;
}

export function FontSelector({ selectedFont, onFontChange, sampleTitle = 'My Magazine' }: FontSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-element)]">
      {FONT_OPTIONS.map((font) => (
        <button
          key={font.id}
          type="button"
          onClick={() => onFontChange(font.id)}
          className={`p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-colors text-left min-h-[44px] ${
            selectedFont === font.id
              ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
          }`}
        >
          <p
            className="text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-tight)] leading-tight"
            style={{ fontFamily: font.fontFamily }}
          >
            {sampleTitle}
          </p>
          <p
            className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-tight)]"
            style={{ fontFamily: font.fontFamily }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {font.name} &middot; {font.style}
          </p>
        </button>
      ))}
    </div>
  );
}

export { FONT_OPTIONS };
