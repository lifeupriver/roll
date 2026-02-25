'use client';

import { Calendar, Layers, Star, Heart, MapPin, Palette } from 'lucide-react';
import { MAGAZINE_TEMPLATES, type MagazineTemplateConfig } from '@/lib/magazine/templates';
import type { MagazineTemplate } from '@/types/magazine';

const ICON_MAP: Record<string, typeof Calendar> = {
  Calendar,
  Layers,
  Star,
  Heart,
  MapPin,
  Palette,
};

interface TemplateSelectorProps {
  selected: MagazineTemplate | null;
  onSelect: (template: MagazineTemplate) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-element)]">
      {MAGAZINE_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selected === template.id}
          onSelect={() => onSelect(template.id)}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: MagazineTemplateConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = ICON_MAP[template.icon] || Calendar;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-[var(--space-tight)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-all text-left ${
        isSelected
          ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
          : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]'
      }`}
    >
      <Icon
        size={24}
        className={isSelected ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'}
      />
      <div>
        <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
          {template.name}
        </p>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-0.5 line-clamp-2">
          {template.description}
        </p>
      </div>
      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)]">
        ~{template.suggestedPageCount} pages
      </span>
    </button>
  );
}
