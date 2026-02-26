'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmailSubscribeFormProps {
  authorSlug: string;
  compact?: boolean;
}

export function EmailSubscribeForm({ authorSlug, compact = false }: EmailSubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/blog/${authorSlug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Check your email to confirm');
        setEmail('');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="flex items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
        <Mail size={14} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="subscribe" className={compact ? '' : 'max-w-sm'}>
      <div className="flex gap-[var(--space-tight)]">
        <input
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-caption)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors min-h-[44px]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={loading}
          disabled={!email.trim()}
        >
          Subscribe
        </Button>
      </div>
      {error && (
        <p className="text-[length:var(--text-caption)] text-red-500 mt-[var(--space-tight)]">{error}</p>
      )}
    </form>
  );
}
