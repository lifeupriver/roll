'use client';

import { useState, useCallback } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';

interface SearchResult {
  id: string;
  thumbnail_url: string;
  filename: string;
  date_taken: string | null;
  camera_make: string | null;
  camera_model: string | null;
  face_count: number;
  scene_classification: string[];
}

interface SearchFilters {
  scenes: string[];
  cameras: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({ scenes: [], cameras: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Active filters
  const [selectedScene, setSelectedScene] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [facesFilter, setFacesFilter] = useState('');

  const performSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedScene) params.set('scene', selectedScene);
      if (selectedCamera) params.set('camera', selectedCamera);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (facesFilter) params.set('faces', facesFilter);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const { data } = await res.json();
        setResults(data?.photos ?? []);
        setFilters(data?.filters ?? { scenes: [], cameras: [] });
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [query, selectedScene, selectedCamera, dateFrom, dateTo, facesFilter]);

  const clearFilters = () => {
    setSelectedScene('');
    setSelectedCamera('');
    setDateFrom('');
    setDateTo('');
    setFacesFilter('');
  };

  const hasActiveFilters = selectedScene || selectedCamera || dateFrom || dateTo || facesFilter;

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Search bar */}
      <div className="flex gap-[var(--space-tight)]">
        <div className="flex-1">
          <Input
            placeholder="Search photos, captions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') performSearch();
            }}
          />
        </div>
        <Button variant="primary" size="md" onClick={performSearch} isLoading={loading}>
          <SearchIcon size={16} />
        </Button>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)] flex flex-col gap-[var(--space-element)]">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              Filters
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-[length:var(--text-caption)] text-[var(--color-action)] bg-transparent border-none cursor-pointer font-[family-name:var(--font-body)]"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-element)]">
            {/* Scene filter */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                Scene
              </label>
              <select
                value={selectedScene}
                onChange={(e) => setSelectedScene(e.target.value)}
                className="w-full h-10 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] appearance-none cursor-pointer"
              >
                <option value="">All scenes</option>
                {filters.scenes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Camera filter */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                Camera
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full h-10 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] appearance-none cursor-pointer"
              >
                <option value="">All cameras</option>
                {filters.cameras.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)]"
              />
            </div>
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)]"
              />
            </div>

            {/* Faces filter */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                People
              </label>
              <select
                value={facesFilter}
                onChange={(e) => setFacesFilter(e.target.value)}
                className="w-full h-10 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] appearance-none cursor-pointer"
              >
                <option value="">Any</option>
                <option value="yes">With people</option>
                <option value="no">No people</option>
                <option value="group">Groups (3+)</option>
              </select>
            </div>
          </div>

          <Button variant="primary" size="md" onClick={performSearch} isLoading={loading}>
            Apply Filters
          </Button>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="md" />
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <Empty
          icon={SearchIcon}
          title="No results"
          description="Try adjusting your search or filters."
        />
      )}

      {!loading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] text-center">
          <SearchIcon size={48} className="text-[var(--color-ink-tertiary)] mb-[var(--space-component)]" />
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Search your photos by caption, filename, scene, camera, date, or people.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)] font-[family-name:var(--font-body)]">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[var(--space-micro)]">
            {results.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] group"
              >
                <img
                  src={photo.thumbnail_url}
                  alt={photo.filename}
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
                {/* Scene tags on hover */}
                {photo.scene_classification.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="flex flex-wrap gap-0.5">
                      {photo.scene_classification.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-white/90 bg-white/20 rounded px-1 font-[family-name:var(--font-body)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
