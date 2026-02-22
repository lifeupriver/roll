'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToastStore } from '@/stores/toastStore';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItemInternalProps extends ToastProps {
  id: string;
  onDismiss: (id: string) => void;
}

function ToastItem({ id, message, type, duration = 3000, action, onDismiss }: ToastItemInternalProps) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    const timer = setTimeout(() => onDismiss(id), 150);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, [duration, dismiss]);

  const borderColors = {
    success: 'border-l-[var(--color-developed)]',
    error: 'border-l-[var(--color-error)]',
    info: 'border-l-[var(--color-fixer)]',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto',
        'flex items-center gap-[var(--space-element)]',
        'w-full max-w-sm',
        'bg-[var(--color-surface-raised)]',
        'shadow-[var(--shadow-floating)]',
        'rounded-[var(--radius-card)]',
        'border-l-[3px]',
        borderColors[type],
        'px-[var(--space-component)] py-[var(--space-element)]',
        exiting ? 'toast-exit' : 'toast-enter',
      ].join(' ')}
    >
      <p className="flex-1 text-[var(--color-ink)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-normal leading-snug m-0">
        {message}
      </p>

      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            dismiss();
          }}
          className="shrink-0 bg-transparent border-none text-[var(--color-action)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium cursor-pointer hover:underline p-0"
        >
          {action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => dismiss()}
        aria-label="Dismiss notification"
        className="shrink-0 bg-transparent border-none text-[var(--color-ink-tertiary)] cursor-pointer p-1 hover:text-[var(--color-ink)] transition-colors duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          0% {
            opacity: 0;
            transform: translateY(-100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes toast-slide-out {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%);
          }
        }

        .toast-enter {
          animation: toast-slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-exit {
          animation: toast-slide-out 150ms ease-in forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .toast-enter {
            animation: none;
          }
          .toast-exit {
            animation: none;
          }
        }
      `}</style>

      <div
        aria-label="Notifications"
        className={[
          'fixed z-50 pointer-events-none',
          'top-[var(--space-section)]',
          'flex flex-col gap-[var(--space-tight)]',
          // Mobile: top-center
          'left-[var(--space-component)] right-[var(--space-component)] items-center',
          // Desktop: top-right
          'md:left-auto md:right-[var(--space-section)] md:items-end md:w-auto',
        ].join(' ')}
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            action={t.action}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </>
  );
}

export type { ToastProps };
