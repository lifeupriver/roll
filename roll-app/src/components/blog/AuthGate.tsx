'use client';

import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface AuthGateProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
  returnUrl?: string;
}

export function AuthGate({ isOpen, onClose, action = 'continue', returnUrl }: AuthGateProps) {
  const signupUrl = returnUrl
    ? `/auth/signup?return=${encodeURIComponent(returnUrl)}&action=${encodeURIComponent(action)}`
    : '/auth/signup';
  const loginUrl = returnUrl
    ? `/login?return=${encodeURIComponent(returnUrl)}`
    : '/login';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[var(--space-component)]">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Join Roll for free to {action}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          Create a free account to {action}. No credit card required.
        </p>

        <div className="flex flex-col gap-[var(--space-element)]">
          <a
            href={signupUrl}
            className="w-full text-center px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-action)] text-white rounded-[var(--radius-card)] text-[length:var(--text-body)] font-medium hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center"
          >
            Sign Up Free
          </a>
        </div>

        <p className="text-center text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          Already have an account?{' '}
          <a href={loginUrl} className="text-[var(--color-action)] hover:underline">
            Log in
          </a>
        </p>
      </div>
    </Modal>
  );
}
