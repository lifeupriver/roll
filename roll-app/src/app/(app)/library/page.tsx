'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Heart } from 'lucide-react';
import { RollCard } from '@/components/roll/RollCard';
import { HeartButton } from '@/components/roll/HeartButton';
import { Empty } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { useToast } from '@/stores/toastStore';
import type { Roll } from '@/types/roll';
import type { Photo } from '@/types/photo';

type LibrarySection = 'rolls' | 'favorites';

const SECTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'rolls', label: 'Rolls' },
  { value: 'favorites', label: 'Favorites' },
];

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  roll_id: string;
  created_at: string;
  photos: Photo;
  rolls: { name: string | null; film_profile: string | null };
}

export default function LibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<LibrarySection>('rolls');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rolls
  useEffect(() => {
    async function fetchRolls() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/rolls');
        if (!res.ok) throw new Error('Failed to load rolls');
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

  // Fetch favorites when switching to favorites tab
  useEffect(() => {
    if (activeSection !== 'favorites') return;
    async function fetchFavorites() {
      setFavoritesLoading(true);
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) throw new Error('Failed to load favorites');
        const json = await res.json();
        setFavorites(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setFavoritesLoading(false);
      }
    }
    fetchFavorites();
  }, [activeSection]);

  // Unfavorite handler
  const handleUnfavorite = useCallback(
    async (photoId: string) => {
      // Optimistic removal
      setFavorites((prev) => prev.filter((f) => f.photo_id !== photoId));
      try {
        const res = await fetch(`/api/favorites/${photoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove favorite');
      } catch {
        // Revert and refetch
        toast('Failed to remove favorite', 'error');
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const json = await res.json();
          setFavorites(json.data ?? []);
        }
      }
    },
    [toast]
  );

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
              <Spinner size="md" />
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

      {/* Favorites section */}
      {activeSection === 'favorites' && (
        <section>
          {favoritesLoading && (
            <div className="flex items-center justify-center py-[var(--space-hero)]">
              <Spinner size="md" />
            </div>
          )}

          {!favoritesLoading && favorites.length === 0 && (
            <Empty
              icon={Heart}
              title="No favorites yet"
              description="Heart your favorite photos after developing a roll. They'll collect here."
            />
          )}

          {!favoritesLoading && favorites.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-micro)]">
              {favorites.map((fav) => (
                <div key={fav.id} className="relative group">
                  <img
                    src={fav.photos.thumbnail_url}
                    alt={`Favorited photo from ${fav.rolls?.name || 'roll'}`}
                    loading="lazy"
                    className="w-full aspect-[3/4] object-cover bg-[var(--color-surface-sunken)]"
                  />
                  {/* Heart overlay - always visible (filled) */}
                  <div className="absolute top-[var(--space-tight)] right-[var(--space-tight)]">
                    <HeartButton
                      isHearted={true}
                      onChange={() => handleUnfavorite(fav.photo_id)}
                    />
                  </div>
                  {/* Roll name badge */}
                  {fav.rolls?.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-[var(--space-tight)] py-[var(--space-tight)]">
                      <span className="text-[length:var(--text-caption)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)]">
                        {fav.rolls.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
