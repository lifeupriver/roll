'use client';

import { useCallback, useRef, useState } from 'react';
import { Check } from 'lucide-react';

interface CheckmarkButtonProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean; // True when roll is full (36/36) and photo not already checked
}

export function CheckmarkButton({ isChecked, onChange, disabled = false }: CheckmarkButtonProps) {
  const [animating, setAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    if (disabled) return;

    // Trigger the spring animation
    setAnimating(true);

    // Animation lasts 200ms total
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 200);

    onChange(!isChecked);

    return () => clearTimeout(timer);
  }, [disabled, isChecked, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <>
      <style>{`
        @keyframes checkmark-spring {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1.0);
          }
        }

        .checkmark-animate {
          animation: checkmark-spring 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .checkmark-animate {
            animation: none;
          }
        }
      `}</style>

      <button
        ref={buttonRef}
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        aria-label={isChecked ? 'Remove photo from roll' : 'Select photo for roll'}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={handleKeyDown}
        className={[
          // Base layout: 28px circle, centered content
          'w-7 h-7 rounded-full flex items-center justify-center',
          // Remove default button styles
          'border-2 p-0 cursor-pointer',
          // Z-index above photo
          'relative z-10',
          // Spring animation class
          animating ? 'checkmark-animate' : '',
          // State-dependent styles
          isChecked
            ? ['bg-[var(--color-action)]', 'border-[var(--color-action)]'].join(' ')
            : ['bg-[oklch(0_0_0/0.3)]', 'border-white'].join(' '),
          // Background fill transition (80ms, simultaneous with press)
          'transition-[background-color,border-color] duration-[80ms] ease-in',
          // Disabled state
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          // Focus ring: var(--color-border-focus), 2px outline, 2px offset
          'outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
        ].join(' ')}
      >
        {isChecked && <Check size={16} strokeWidth={2} className="text-white" aria-hidden="true" />}
      </button>
    </>
  );
}
