'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Database, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: Record<string, number>;
  } | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setResult({
          type: 'success',
          message: json.data?.message || 'Mock data seeded successfully',
          details: json.data?.created,
        });
      } else {
        setResult({ type: 'error', message: json.error || 'Failed to seed data' });
      }
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setResult({
          type: 'success',
          message: json.data?.message || 'Mock data cleared successfully',
        });
      } else {
        setResult({ type: 'error', message: json.error || 'Failed to clear data' });
      }
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
        Populate your account with realistic mock data to preview the full UI. This creates photos,
        rolls, favorites, circles, print orders, and referrals.
      </p>

      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          What gets created
        </h2>
        <ul className="flex flex-col gap-[var(--space-tight)] text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          <li>84 photos with varied dates, locations, cameras, and scenes</li>
          <li>8 auto-filtered photos (screenshots, blurry, duplicates)</li>
          <li>3 rolls: 2 developed (Warmth + Golden), 1 building</li>
          <li>~15 favorited photos across developed rolls</li>
          <li>2 circles with members, posts, reactions, and comments</li>
          <li>3 print orders (delivered, shipped, in production)</li>
          <li>5 referrals with mixed statuses</li>
          <li>Your profile set to Roll+ tier</li>
        </ul>
      </Card>

      <div className="flex flex-col gap-[var(--space-element)]">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSeed}
          isLoading={seeding}
          disabled={seeding || clearing}
        >
          <Database size={18} className="mr-2" />
          Seed Mock Data
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={handleClear}
          isLoading={clearing}
          disabled={seeding || clearing}
          className="text-[var(--color-error)]"
        >
          <Trash2 size={18} className="mr-2" />
          Clear All Data
        </Button>
      </div>

      {result && (
        <Card
          className={
            result.type === 'success'
              ? 'border-[var(--color-developed)]'
              : 'border-[var(--color-error)]'
          }
        >
          <div className="flex items-start gap-[var(--space-element)]">
            {result.type === 'success' ? (
              <CheckCircle2 size={20} className="text-[var(--color-developed)] mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-[var(--color-error)] mt-0.5 shrink-0" />
            )}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium">
                {result.message}
              </p>
              {result.details && (
                <div className="grid grid-cols-2 gap-x-[var(--space-component)] gap-y-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] font-[family-name:var(--font-mono)]">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}</span>
                      <span className="text-[var(--color-ink)]">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
