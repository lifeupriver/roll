'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const CORRECT_PIN = '1999';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already unlocked this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('roll-demo-unlocked') === 'true') {
      setUnlocked(true);
    }
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    setError(false);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;

      // Auto-advance to next input
      if (digit && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }

      // Check PIN when all 4 digits are entered
      const pin = next.join('');
      if (pin.length === 4) {
        if (pin === CORRECT_PIN) {
          sessionStorage.setItem('roll-demo-unlocked', 'true');
          setUnlocked(true);
        } else {
          setError(true);
          // Clear after a short delay
          setTimeout(() => {
            setDigits(['', '', '', '']);
            inputsRef.current[0]?.focus();
          }, 600);
        }
      }

      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      if (pasted === CORRECT_PIN) {
        sessionStorage.setItem('roll-demo-unlocked', 'true');
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(['', '', '', '']);
          inputsRef.current[0]?.focus();
        }, 600);
      }
    }
  }, []);

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center px-[var(--space-component)]">
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

        {/* PIN inputs */}
        <div className="flex items-center gap-[var(--space-element)]" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={[
                'w-14 h-16 text-center font-[family-name:var(--font-mono)] text-[length:var(--text-title)] font-medium',
                'bg-[var(--color-surface-sunken)] border-2 rounded-[var(--radius-card)]',
                'focus:outline-none transition-all duration-150',
                error
                  ? 'border-[var(--color-error)] animate-[shake_300ms_ease-in-out] text-[var(--color-error)]'
                  : digit
                    ? 'border-[var(--color-action)] text-[var(--color-ink)]'
                    : 'border-[var(--color-border)] text-[var(--color-ink)]',
                'focus:border-[var(--color-action)] focus:shadow-[0_0_0_3px_var(--color-action-subtle)]',
              ].join(' ')}
            />
          ))}
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
