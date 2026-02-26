'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-[var(--space-tight)]">
        {label && (
          <label
            htmlFor={inputId}
            className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full h-12 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2 ${
            error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-error)] animate-[slideDown_150ms_ease-out]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
