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
  const _bounds = useMemo(() => {
    if (photos.length === 0) return null;
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;
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
    const y = 50 - (mercN * 50) / Math.PI;
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
      <div className="flex items-center justify-end">
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
            onClick={() => {
              setZoom((z) => Math.max(z - 0.5, 1));
              setPanX(0);
              setPanY(0);
            }}
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
          {/* World map background — simplified continents via SVG paths */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            {/* Ocean background */}
            <rect width="1000" height="500" fill="var(--color-surface-sunken)" />

            {/* Simplified continent shapes */}
            {/* North America */}
            <path
              d="M120,60 L180,55 L220,70 L250,95 L260,120 L255,145 L240,165 L220,175 L200,200 L180,220 L165,230 L155,220 L140,195 L130,170 L120,150 L110,130 L105,100 L110,80 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Central America */}
            <path
              d="M165,230 L175,240 L180,255 L175,265 L170,270 L165,260 L160,245 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* South America */}
            <path
              d="M195,270 L220,260 L240,270 L260,285 L275,310 L280,340 L275,370 L265,395 L250,415 L235,425 L225,420 L215,400 L205,375 L195,350 L188,320 L185,295 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Europe */}
            <path
              d="M440,65 L470,60 L500,55 L520,60 L535,75 L530,90 L520,100 L510,110 L500,105 L485,110 L475,105 L465,95 L455,90 L445,80 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Africa */}
            <path
              d="M460,150 L480,140 L510,145 L530,155 L545,175 L555,200 L560,230 L555,260 L545,290 L530,310 L515,325 L505,330 L495,325 L485,310 L475,290 L465,265 L455,235 L450,205 L450,175 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Asia */}
            <path
              d="M535,55 L580,45 L630,40 L680,50 L720,55 L760,65 L790,80 L800,100 L790,120 L775,135 L760,145 L740,150 L720,155 L700,150 L680,140 L660,130 L640,125 L620,130 L600,135 L580,130 L560,120 L545,105 L535,85 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* India */}
            <path
              d="M640,155 L660,150 L675,165 L680,185 L675,210 L665,225 L650,230 L640,220 L635,200 L635,175 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Southeast Asia */}
            <path
              d="M720,155 L740,160 L755,175 L750,195 L740,210 L725,200 L715,185 L715,170 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Australia */}
            <path
              d="M740,300 L780,285 L820,290 L850,305 L855,325 L845,345 L825,360 L800,365 L775,355 L755,340 L745,320 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Japan/Korea */}
            <path
              d="M795,90 L805,85 L810,95 L805,110 L798,115 L793,105 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* UK/Ireland */}
            <path
              d="M445,68 L450,63 L455,68 L455,78 L450,82 L445,78 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
            {/* Greenland */}
            <path
              d="M260,30 L290,25 L315,30 L320,45 L310,55 L290,58 L270,52 L260,42 Z"
              fill="var(--color-surface-raised)"
              stroke="var(--color-border-strong)"
              strokeWidth="0.8"
            />
          </svg>

          {/* Grid lines overlay */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Latitude lines */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const { y } = toXY(lat, 0);
              return (
                <line
                  key={`lat-${lat}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="0.1"
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
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="var(--color-border)"
                  strokeWidth="0.1"
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
                  ? new Date(selectedPhoto.dateTaken).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
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
              selectedPhoto?.id === photo.id
                ? 'border-[var(--color-action)]'
                : 'border-transparent',
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
