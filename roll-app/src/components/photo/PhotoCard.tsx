'use client';

import { useState, useCallback } from 'react';
import { Check, EyeOff, Maximize2, Copy, Play } from 'lucide-react';
import { ClipDurationBadge } from '@/components/reel/ClipDurationBadge';

interface PhotoCardProps {
  photo: {
    id: string;
    thumbnail_url: string;
    lqip_base64: string | null;
    created_at: string;
    date_taken: string | null;
    face_count: number;
    latitude: number | null;
    longitude: number | null;
    media_type?: 'photo' | 'video';
    duration_ms?: number | null;
  };
  isChecked: boolean;
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  onCheck?: () => void;
  onHide?: () => void;
  onTap?: () => void;
}

export function PhotoCard({ photo, isChecked, mode, onCheck, onHide, onTap }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressTimer = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) clearTimeout(longPressTimer);
  }, []);

  return (
    <div
      className="relative group overflow-hidden bg-[var(--color-surface-sunken)]"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* LQIP placeholder */}
      {photo.lqip_base64 && !loaded && (
        <img
          src={photo.lqip_base64}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Actual thumbnail */}
      <img
        src={photo.thumbnail_url}
        alt={`Photo from ${photo.date_taken || photo.created_at}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onClick={onTap}
        className={`w-full aspect-[3/4] object-cover transition-opacity duration-200 ease-out cursor-pointer ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Skeleton while loading */}
      {!loaded && !photo.lqip_base64 && (
        <div className="absolute inset-0 bg-[var(--color-surface-sunken)] skeleton-pulse" />
      )}

      {/* Video play button + duration badge */}
      {photo.media_type === 'video' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play size={20} className="text-white ml-0.5" fill="white" fillOpacity={0.9} />
            </div>
          </div>
          {photo.duration_ms && <ClipDurationBadge durationMs={photo.duration_ms} />}
        </>
      )}

      {/* Checkmark button (feed mode) */}
      {mode === 'feed' && onCheck && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCheck();
          }}
          role="checkbox"
          aria-checked={isChecked}
          aria-label={
            photo.media_type === 'video'
              ? isChecked
                ? 'Remove clip from reel'
                : 'Add clip to reel'
              : isChecked
                ? 'Remove photo from roll'
                : 'Select photo for roll'
          }
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            isChecked
              ? 'bg-[var(--color-action)] scale-100'
              : 'bg-[var(--color-surface-overlay)]/40 border border-white/60 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
          }`}
        >
          <Check
            size={16}
            strokeWidth={2.5}
            className={isChecked ? 'text-white' : 'text-white/80'}
          />
        </button>
      )}

      {/* Hover metadata overlay (desktop) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-darkroom)]/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-inverse)] truncate">
          {photo.date_taken
            ? new Date(photo.date_taken).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : ''}
        </p>
      </div>

      {/* Long-press / right-click context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            className="fixed z-50 bg-[var(--color-surface)] shadow-[var(--shadow-floating)] rounded-[var(--radius-card)] p-1 min-w-[160px]"
            style={{ top: menuPosition.y || '50%', left: menuPosition.x || '50%' }}
          >
            {onHide && (
              <button
                onClick={() => {
                  onHide();
                  setShowMenu(false);
                }}
                className="flex items-center gap-[var(--space-tight)] w-full px-[var(--space-element)] py-[var(--space-tight)] text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] transition-colors"
              >
                <EyeOff size={16} /> Hide
              </button>
            )}
            <button
              onClick={() => {
                onTap?.();
                setShowMenu(false);
              }}
              className="flex items-center gap-[var(--space-tight)] w-full px-[var(--space-element)] py-[var(--space-tight)] text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] transition-colors"
            >
              <Maximize2 size={16} /> View detail
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-[var(--space-tight)] w-full px-[var(--space-element)] py-[var(--space-tight)] text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] transition-colors"
            >
              <Copy size={16} /> View cluster
            </button>
          </div>
        </>
      )}
    </div>
  );
}
