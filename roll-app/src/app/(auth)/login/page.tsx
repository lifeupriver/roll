'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/types/auth';
import { Check } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { login, loginWithMagicLink, loading, error } = useAuth();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    await loginWithMagicLink(email);
    if (!error) setMagicLinkSent(true);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    await login(email, password);
  }

  if (magicLinkSent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-[var(--space-component)] text-center animate-[fadeIn_250ms_ease-out]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-developed)]/10 flex items-center justify-center">
            <Check size={24} className="text-[var(--color-developed)]" />
          </div>
          <p className="text-[length:var(--text-body)] text-[var(--color-ink)]">
            Check your email for a magic link
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            We sent a sign-in link to {email}
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {mode === 'magic' ? (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-[var(--space-component)]">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={validationError || error || undefined}
            autoFocus
          />
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
          <div className="flex items-center gap-[var(--space-element)]">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">or</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          <Button type="button" variant="ghost" onClick={() => setMode('password')}>
            Sign in with password
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-[var(--space-component)]">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={validationError || undefined}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error || undefined}
          />
          <Button type="submit" variant="primary" size="lg" isLoading={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode('magic')}>
            Use magic link instead
          </Button>
        </form>
      )}
      <div className="text-center">
        <Link
          href="/signup"
          className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
        >
          New here? We&apos;ll create your account automatically.
        </Link>
      </div>
    </AuthLayout>
  );
}
