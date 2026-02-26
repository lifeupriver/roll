'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export function BackButton({ href, label, onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ?? 'Go back'}
      className="inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-sharp)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 touch-target"
    >
      <ChevronLeft size={22} strokeWidth={1.5} />
    </button>
  );
}
