'use client';

import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] tracking-[0.02em] transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none touch-target focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2';

    const variants = {
      primary:
        'bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-action-hover)]',
      secondary:
        'bg-transparent border border-[var(--color-border-strong)] text-[var(--color-ink)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)]',
      ghost:
        'bg-transparent text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:underline',
    };

    const sizes = {
      sm: 'px-[var(--space-element)] py-[var(--space-tight)] text-[length:var(--text-caption)]',
      md: 'px-[var(--space-section)] py-[var(--space-element)]',
      lg: 'px-[var(--space-section)] py-[var(--space-component)] w-full',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 mr-2 text-current" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
