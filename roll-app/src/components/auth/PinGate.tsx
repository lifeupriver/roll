'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const CORRECT_PIN = '1999';
const PIN_LENGTH = 4;

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if already unlocked this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('roll-demo-unlocked') === 'true') {
      setUnlocked(true);
    }
  }, []);

  // Auto-focus the hidden input on mount
  useEffect(() => {
    if (!unlocked) {
      inputRef.current?.focus();
    }
  }, [unlocked]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setError(false);
    setPin(value);

    if (value.length === PIN_LENGTH) {
      if (value === CORRECT_PIN) {
        sessionStorage.setItem('roll-demo-unlocked', 'true');
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          inputRef.current?.focus();
        }, 600);
      }
    }
  }, []);

  if (unlocked) return <>{children}</>;

  const digits = pin.split('');

  return (
    <div
      className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-[var(--space-component)]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col items-center gap-[var(--space-section)] max-w-[360px] w-full text-center">
        {/* Logo */}
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-hero)] tracking-[0.2em] text-[var(--color-ink)]">
          ROLL
        </h1>

        <div className="flex flex-col gap-[var(--space-element)]">
          <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            Enter PIN to continue
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            This demo is invite-only
          </p>
        </div>

        {/* Digit boxes with invisible real input overlaid on top */}
        <div className="relative">
          {/* Real input — spans full width of digit boxes, transparent but focusable */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={handleChange}
            autoFocus
            className="absolute inset-0 w-full h-full z-10 bg-transparent border-none outline-none"
            style={{ fontSize: '16px', color: 'transparent', caretColor: 'transparent' }}
            aria-label="PIN input"
          />

          {/* Visual digit boxes */}
          <div className="flex items-center gap-[var(--space-element)]">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={[
                  'w-14 h-16 flex items-center justify-center font-[family-name:var(--font-mono)] text-[length:var(--text-title)] font-medium',
                  'bg-[var(--color-surface-sunken)] border-2 rounded-[var(--radius-card)]',
                  'transition-all duration-150',
                  error
                    ? 'border-[var(--color-error)] animate-[shake_300ms_ease-in-out] text-[var(--color-error)]'
                    : digits[i]
                      ? 'border-[var(--color-action)] text-[var(--color-ink)]'
                      : i === digits.length
                        ? 'border-[var(--color-action)] shadow-[0_0_0_3px_var(--color-action-subtle)]'
                        : 'border-[var(--color-border)] text-[var(--color-ink)]',
                ].join(' ')}
              >
                {digits[i] || ''}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-error)] font-medium">
            Incorrect PIN
          </p>
        )}

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            50% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
          }
        `}</style>
      </div>
    </div>
  );
}
