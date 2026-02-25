'use client';

import { BookOpen, Calendar, MapPin, Users, Baby } from 'lucide-react';
import type { BookTemplate } from '@/lib/book/templates';

const ICON_MAP: Record<string, typeof BookOpen> = {
  Baby,
  Calendar,
  MapPin,
  Users,
  BookOpen,
};

interface TemplateCardProps {
  template: BookTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const Icon = ICON_MAP[template.icon] || BookOpen;

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
      {template.sections.length > 0 && (
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)]">
          {template.sections.length} sections · ~{template.suggestedPageCount} pages
        </span>
      )}
    </button>
  );
}
