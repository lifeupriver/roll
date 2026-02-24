'use client';

import { AudioWaveform, Volume2, VolumeX, Wind } from 'lucide-react';
import type { AudioMood } from '@/types/reel';

interface AudioMoodSelectorProps {
  selected: AudioMood;
  onChange: (mood: AudioMood) => void;
  userTier: 'free' | 'plus';
}

const MOOD_CONFIG: Array<{
  id: AudioMood;
  label: string;
  icon: typeof AudioWaveform;
  tier: 'free' | 'plus';
}> = [
  { id: 'original', label: 'Original', icon: Volume2, tier: 'free' },
  { id: 'quiet_film', label: 'Quiet Film', icon: AudioWaveform, tier: 'plus' },
  { id: 'silent_film', label: 'Silent Film', icon: VolumeX, tier: 'plus' },
  { id: 'ambient', label: 'Ambient', icon: Wind, tier: 'plus' },
];

export function AudioMoodSelector({ selected, onChange, userTier }: AudioMoodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Audio mood"
      className="flex gap-[var(--space-tight)] overflow-x-auto no-scrollbar"
    >
      {MOOD_CONFIG.map((mood) => {
        const isActive = selected === mood.id;
        const isLocked = userTier === 'free' && mood.tier === 'plus';
        const Icon = mood.icon;

        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${mood.label}${isLocked ? ' (Roll+ required)' : ''}`}
            disabled={isLocked}
            onClick={() => onChange(mood.id)}
            className={[
              'flex items-center gap-[var(--space-micro)] px-[var(--space-element)] py-[var(--space-tight)]',
              'rounded-[var(--radius-pill)] text-[length:var(--text-label)]',
              'font-[family-name:var(--font-body)] font-medium whitespace-nowrap',
              'transition-all duration-150 ease-out',
              isActive
                ? 'bg-[var(--color-ink)] text-[var(--color-ink-inverse)]'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]',
              isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={1.5} />
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}
