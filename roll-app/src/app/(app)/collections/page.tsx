'use client';

import { useState, useEffect } from 'react';
import { Layers, MapPin, Users, Sun, Camera } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import type { SmartCollection } from '@/app/api/collections/route';

const typeIcons: Record<string, typeof Layers> = {
  trip: MapPin,
  people: Users,
  season: Sun,
  camera: Camera,
};

const typeColors: Record<string, string> = {
  trip: 'var(--color-action)',
  people: 'var(--color-stock-warmth)',
  season: 'var(--color-stock-golden)',
  camera: 'var(--color-ink-secondary)',
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch('/api/collections');
        if (res.ok) {
          const { data } = await res.json();
          setCollections(data ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] font-light text-[length:var(--text-page-title)] leading-[0.9] tracking-tight text-[var(--color-ink)] mb-[var(--space-section)]">
          Collections
        </h1>
        <Empty
          icon={Layers}
          title="No collections yet"
          description="Upload more photos and collections will be created automatically based on trips, seasons, and more."
        />
      </div>
    );
  }

  // Group by type
  const grouped: Record<string, SmartCollection[]> = {};
  for (const c of collections) {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push(c);
  }

  const sectionTitles: Record<string, string> = {
    trip: 'Trips',
    season: 'Seasons',
    people: 'People',
    camera: 'Cameras',
  };

  const sectionOrder = ['trip', 'season', 'people', 'camera'];

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <h1 className="font-[family-name:var(--font-display)] font-light text-[length:var(--text-page-title)] leading-[0.9] tracking-tight text-[var(--color-ink)]">
        Collections
      </h1>

      {sectionOrder.map((type) => {
        const items = grouped[type];
        if (!items || items.length === 0) return null;
        const Icon = typeIcons[type] || Layers;

        return (
          <section key={type} className="flex flex-col gap-[var(--space-component)]">
            <div className="flex items-center gap-[var(--space-tight)]">
              <Icon size={18} style={{ color: typeColors[type] }} />
              <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                {sectionTitles[type]}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--space-element)]">
              {items.map((collection) => (
                <div
                  key={collection.id}
                  className="relative rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)] group cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow duration-150"
                >
                  <div className="aspect-[4/3] relative">
                    <img
                      src={collection.coverThumbnailUrl}
                      alt={collection.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-[var(--space-element)]">
                      <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-white truncate">
                        {collection.title}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-white/70 font-[family-name:var(--font-body)]">
                        {collection.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
