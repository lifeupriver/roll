'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import type { MapPhoto } from '@/app/api/photos/map/route';

/**
 * Photo Map — shows geotagged photos on a CSS-based world map.
 * Uses a simple Mercator projection to position photos as dots.
 * No external map library needed — lightweight and privacy-friendly.
 */
export default function MapPage() {
  const [photos, setPhotos] = useState<MapPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<MapPhoto | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  useEffect(() => {
    async function fetchMapPhotos() {
      try {
        const res = await fetch('/api/photos/map');
        if (res.ok) {
          const { data } = await res.json();
          setPhotos(data ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchMapPhotos();
  }, []);

  // Compute bounding box for auto-centering
  const bounds = useMemo(() => {
    if (photos.length === 0) return null;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const p of photos) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [photos]);

  // Convert lat/lng to x/y percentage (simple Mercator)
  const toXY = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = (50 - (mercN * 50) / Math.PI);
    return { x, y };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] mb-[var(--space-section)]">
          Photo Map
        </h1>
        <Empty
          icon={MapPin}
          title="No geotagged photos"
          description="Photos with location data will appear on the map. Enable location in your camera settings."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-component)]">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
          Photo Map
        </h1>
        <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)]">
          {photos.length} geotagged photo{photos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Map container */}
      <div className="relative w-full aspect-[2/1] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border)]">
        {/* Zoom controls */}
        <div className="absolute top-[var(--space-element)] right-[var(--space-element)] z-20 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="flex items-center justify-center w-8 h-8 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] shadow-[var(--shadow-raised)] cursor-pointer border border-[var(--color-border)] text-[var(--color-ink)]"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => { setZoom((z) => Math.max(z - 0.5, 1)); setPanX(0); setPanY(0); }}
            className="flex items-center justify-center w-8 h-8 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] shadow-[var(--shadow-raised)] cursor-pointer border border-[var(--color-border)] text-[var(--color-ink)]"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Map surface */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center center',
            transition: 'transform 200ms ease-out',
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Latitude lines */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const { y } = toXY(lat, 0);
              return (
                <line
                  key={`lat-${lat}`}
                  x1="0" y1={y} x2="100" y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="0.15"
                  strokeDasharray="0.5,0.5"
                />
              );
            })}
            {/* Longitude lines */}
            {[-120, -60, 0, 60, 120].map((lng) => {
              const { x } = toXY(0, lng);
              return (
                <line
                  key={`lng-${lng}`}
                  x1={x} y1="0" x2={x} y2="100"
                  stroke="var(--color-border)"
                  strokeWidth="0.15"
                  strokeDasharray="0.5,0.5"
                />
              );
            })}
          </svg>

          {/* Photo dots */}
          {photos.map((photo) => {
            const { x, y } = toXY(photo.latitude, photo.longitude);
            const isSelected = selectedPhoto?.id === photo.id;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhoto(isSelected ? null : photo)}
                className="absolute border-none cursor-pointer p-0 bg-transparent"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                <div
                  className={[
                    'rounded-full transition-all duration-150',
                    isSelected
                      ? 'w-4 h-4 bg-[var(--color-action)] shadow-[0_0_0_3px_var(--color-action)/30]'
                      : 'w-2.5 h-2.5 bg-[var(--color-action)] opacity-80 hover:opacity-100 hover:scale-150',
                  ].join(' ')}
                />
              </button>
            );
          })}
        </div>

        {/* Selected photo preview */}
        {selectedPhoto && (
          <div className="absolute bottom-[var(--space-element)] left-[var(--space-element)] z-20 flex items-center gap-[var(--space-element)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] shadow-[var(--shadow-floating)] p-[var(--space-tight)] max-w-[280px]">
            <img
              src={selectedPhoto.thumbnailUrl}
              alt="Selected photo"
              className="w-16 h-16 rounded-[var(--radius-sharp)] object-cover shrink-0"
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-[family-name:var(--font-body)] font-medium truncate">
                {selectedPhoto.dateTaken
                  ? new Date(selectedPhoto.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Unknown date'}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                {selectedPhoto.latitude.toFixed(4)}, {selectedPhoto.longitude.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="shrink-0 text-[var(--color-ink-tertiary)] bg-transparent border-none cursor-pointer p-1"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Photo strip below map */}
      <div className="flex gap-[var(--space-micro)] overflow-x-auto pb-[var(--space-tight)]">
        {photos.slice(0, 20).map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className={[
              'shrink-0 w-16 h-16 rounded-[var(--radius-sharp)] overflow-hidden border-2 cursor-pointer bg-transparent p-0',
              selectedPhoto?.id === photo.id ? 'border-[var(--color-action)]' : 'border-transparent',
            ].join(' ')}
          >
            <img
              src={photo.thumbnailUrl}
              alt="Map photo"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
