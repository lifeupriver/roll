'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidPassword } from '@/types/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { signup, loading, error } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    await signup(email, password, displayName);
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-component)]">
        <Input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={validationError && validationError.includes('email') ? validationError : undefined}
        />
        <Input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={
            validationError && validationError.includes('Password') ? validationError : undefined
          }
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={validationError && validationError.includes('match') ? validationError : undefined}
        />
        {(error ||
          (validationError &&
            !validationError.includes('email') &&
            !validationError.includes('Password') &&
            !validationError.includes('match'))) && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-error)]">
            {error || validationError}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" isLoading={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        <div className="text-center">
          <Link
            href="/login"
            className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
