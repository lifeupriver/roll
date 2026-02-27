'use client';

import { Camera, MapPin, UserRound, Newspaper, Minus, BookOpen } from 'lucide-react';
import type { EssayTemplate } from '@/types/blog';

const ESSAY_TEMPLATES: {
  id: EssayTemplate;
  name: string;
  description: string;
  icon: typeof Camera;
  rhythm: string;
}[] = [
  {
    id: 'documentary',
    name: 'Documentary',
    description:
      'Story-driven with large hero images, text interludes, and pull quotes. Best for narrative photo essays.',
    icon: Camera,
    rhythm: 'hero → text → pair → quote → grid',
  },
  {
    id: 'travel',
    name: 'Travel Journal',
    description:
      'Immersive wide photos, panoramic views, and location-grouped sequences. Perfect for trips and adventures.',
    icon: MapPin,
    rhythm: 'panoramic → pair → text → triptych → hero',
  },
  {
    id: 'portrait',
    name: 'Portrait Series',
    description:
      'Generous spacing around individual portraits with intimate captioning. Ideal for people photography.',
    icon: UserRound,
    rhythm: 'hero → single → quote → single → pair',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description:
      'Magazine-style layouts with bold pacing, dramatic heroes, and varied grid structures. Maximum visual impact.',
    icon: Newspaper,
    rhythm: 'hero → grid → text → triptych → hero',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description:
      'Clean single-column flow with generous whitespace. Lets photos breathe. One image at a time.',
    icon: Minus,
    rhythm: 'single → single → text → single → single',
  },
  {
    id: 'narrative',
    name: 'Narrative',
    description:
      'Text-heavy with photos woven into the story. Best when you have a longer story to tell alongside your images.',
    icon: BookOpen,
    rhythm: 'hero → text → single → text → pair',
  },
];

interface EssayTemplateSelectorProps {
  selected: EssayTemplate | null;
  onSelect: (template: EssayTemplate) => void;
}

export function EssayTemplateSelector({ selected, onSelect }: EssayTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-element)]">
      {ESSAY_TEMPLATES.map((tmpl) => {
        const Icon = tmpl.icon;
        const isSelected = selected === tmpl.id;
        return (
          <button
            key={tmpl.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(tmpl.id)}
            className={`flex flex-col gap-[var(--space-tight)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 text-left transition-all ${
              isSelected
                ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)] bg-[var(--color-surface)]'
            }`}
          >
            <div className="flex items-center gap-[var(--space-element)]">
              <div
                className={`w-10 h-10 rounded-[var(--radius-sharp)] flex items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--color-action)] text-white'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3
                  className={`font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] ${
                    isSelected ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'
                  }`}
                >
                  {tmpl.name}
                </h3>
              </div>
            </div>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] leading-relaxed">
              {tmpl.description}
            </p>
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] tracking-wide">
              {tmpl.rhythm}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export { ESSAY_TEMPLATES };
