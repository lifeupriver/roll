'use client';

import type { EssayFont } from '@/types/blog';

const ESSAY_FONTS: {
  id: EssayFont;
  name: string;
  style: string;
  sampleTitle: string;
  sampleBody: string;
  displayClass: string;
  bodyClass: string;
}[] = [
  {
    id: 'default',
    name: 'System',
    style: 'Clean & modern',
    sampleTitle: 'The Light Between',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-[family-name:var(--font-display)]',
    bodyClass: 'font-[family-name:var(--font-body)]',
  },
  {
    id: 'garamond',
    name: 'Garamond',
    style: 'Classic serif',
    sampleTitle: 'The Light Between',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-serif',
    bodyClass: 'font-serif',
  },
  {
    id: 'futura',
    name: 'Futura',
    style: 'Geometric sans',
    sampleTitle: 'THE LIGHT BETWEEN',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-sans tracking-widest uppercase',
    bodyClass: 'font-sans',
  },
  {
    id: 'playfair',
    name: 'Playfair',
    style: 'Elegant display',
    sampleTitle: 'The Light Between',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-serif italic',
    bodyClass: 'font-serif',
  },
  {
    id: 'lora',
    name: 'Lora',
    style: 'Warm serif',
    sampleTitle: 'The Light Between',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-serif',
    bodyClass: 'font-serif',
  },
  {
    id: 'jakarta',
    name: 'Jakarta Sans',
    style: 'Friendly humanist',
    sampleTitle: 'The Light Between',
    sampleBody: 'A quiet afternoon by the water.',
    displayClass: 'font-sans',
    bodyClass: 'font-sans',
  },
];

interface EssayFontSelectorProps {
  selected: EssayFont;
  onSelect: (font: EssayFont) => void;
}

export function EssayFontSelector({ selected, onSelect }: EssayFontSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-[var(--space-element)]">
      {ESSAY_FONTS.map((font) => {
        const isSelected = selected === font.id;
        return (
          <button
            key={font.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(font.id)}
            className={`flex flex-col gap-[var(--space-tight)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 text-left transition-all ${
              isSelected
                ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)] bg-[var(--color-surface)]'
            }`}
          >
            <p className={`text-[length:var(--text-lead)] text-[var(--color-ink)] leading-tight ${font.displayClass}`}>
              {font.sampleTitle}
            </p>
            <p className={`text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] ${font.bodyClass}`}>
              {font.sampleBody}
            </p>
            <div className="mt-auto pt-[var(--space-tight)] border-t border-[var(--color-border)]">
              <p className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink)]">
                {font.name}
              </p>
              <p className="text-[10px] text-[var(--color-ink-tertiary)]">{font.style}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
