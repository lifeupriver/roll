'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Heart } from 'lucide-react';
import { RollCard } from '@/components/roll/RollCard';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ContentModePills } from '@/components/photo/ContentModePills';
import type { Roll } from '@/types/roll';

type LibrarySection = 'rolls' | 'favorites';

const SECTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'rolls', label: 'Rolls' },
  { value: 'favorites', label: 'Favorites' },
];

export default function LibraryPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<LibrarySection>('rolls');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRolls() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/rolls');
        if (!res.ok) {
          throw new Error('Failed to load rolls');
        }
        const json = await res.json();
        setRolls(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRolls();
  }, []);

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Page title */}
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
        Library
      </h1>

      {/* Section toggle */}
      <ContentModePills
        activeMode={activeSection}
        onChange={(mode) => setActiveSection(mode as LibrarySection)}
        options={SECTION_OPTIONS}
      />

      {/* Rolls section */}
      {activeSection === 'rolls' && (
        <section className="flex flex-col gap-[var(--space-element)]">
          {isLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <svg
                className="animate-spin h-6 w-6 text-[var(--color-ink-tertiary)]"
                viewBox="0 0 24 24"
                fill="none"
                aria-label="Loading rolls"
              >
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
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)] text-center">
              <p className="text-[length:var(--text-body)] text-[var(--color-error)]">
                {error}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && rolls.length === 0 && (
            <Empty
              icon={Image}
              title="No rolls yet"
              description="Build your first roll by selecting photos from your feed."
              action={
                <Link href="/feed">
                  <Button variant="primary" size="md">
                    Go to Feed
                  </Button>
                </Link>
              }
            />
          )}

          {!isLoading && !error && rolls.length > 0 && (
            <div className="flex flex-col gap-[var(--space-element)]">
              {rolls.map((roll) => (
                <RollCard
                  key={roll.id}
                  roll={{
                    id: roll.id,
                    name: roll.name,
                    status: roll.status,
                    film_profile: roll.film_profile,
                    photo_count: roll.photo_count,
                    max_photos: roll.max_photos,
                    created_at: roll.created_at,
                  }}
                  onClick={() => router.push(`/roll/${roll.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Favorites section — Phase 2 placeholder */}
      {activeSection === 'favorites' && (
        <section>
          <Empty
            icon={Heart}
            title="No favorites yet"
            description="Heart your favorite photos after developing a roll. They'll collect here."
          />
        </section>
      )}
    </div>
  );
}
