'use client';

import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { Magazine } from '@/types/magazine';

interface MagazineCoverProps {
  magazine: Magazine;
  coverUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function MagazineCover({ magazine, coverUrl, size = 'md', onClick }: MagazineCoverProps) {
  const sizeClasses = {
    sm: 'w-32 h-44',
    md: 'w-48 h-64',
    lg: 'w-64 h-88',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${sizeClasses[size]} bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] group transition-transform hover:scale-[1.02]`}
    >
      {coverUrl ? (
        <Image src={coverUrl} alt={magazine.title} fill className="object-cover" unoptimized />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-sunken)]">
          <BookOpen size={32} className="text-[var(--color-ink-tertiary)]" />
        </div>
      )}

      {/* Overlay with title */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="font-[family-name:var(--font-display)] font-medium text-white text-[length:var(--text-lead)] leading-tight truncate">
          {magazine.title}
        </p>
        <p className="text-white/70 text-[length:var(--text-caption)] mt-0.5">
          {magazine.page_count} pages · {magazine.format}
        </p>
      </div>

      {/* Status badge */}
      {magazine.status !== 'draft' && (
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-bold uppercase tracking-wider ${
              magazine.status === 'ordered'
                ? 'bg-blue-500/80 text-white'
                : magazine.status === 'shipped'
                  ? 'bg-amber-500/80 text-white'
                  : magazine.status === 'delivered'
                    ? 'bg-green-500/80 text-white'
                    : 'bg-black/40 text-white'
            }`}
          >
            {magazine.status}
          </span>
        </div>
      )}
    </button>
  );
}
