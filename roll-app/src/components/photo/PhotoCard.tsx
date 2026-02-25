'use client';

import { useState, useCallback, useRef } from 'react';
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
  selectMode?: boolean;
  onCheck?: () => void;
  onHide?: () => void;
  onTap?: () => void;
}

export function PhotoCard({ photo, isChecked, mode, selectMode, onCheck, onHide, onTap }: PhotoCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowMenu(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  // In feed mode with selectMode: clicking selects/deselects for roll
  // In feed mode without selectMode (browse): clicking opens lightbox
  // In other modes: clicking opens the lightbox
  const handlePhotoClick = useCallback(() => {
    if (didLongPress.current) return;
    if (mode === 'feed' && selectMode && onCheck) {
      onCheck();
    } else if (onTap) {
      onTap();
    }
  }, [mode, selectMode, onCheck, onTap]);

  return (
    <div
      className="relative group overflow-hidden bg-[var(--color-surface-sunken)] cursor-pointer"
      onClick={handlePhotoClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Thumbnail image — shown directly, no lazy/opacity dance for data URIs */}
      <img
        src={imgError ? undefined : photo.thumbnail_url}
        alt={`Photo from ${photo.date_taken || photo.created_at}`}
        onError={() => setImgError(true)}
        className="w-full aspect-[3/4] object-cover pointer-events-none bg-[var(--color-surface-sunken)]"
      />

      {/* Selection overlay (feed mode, select mode only) */}
      {mode === 'feed' && selectMode && isChecked && (
        <div className="absolute inset-0 bg-[var(--color-action)]/15 ring-2 ring-inset ring-[var(--color-action)] pointer-events-none" />
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

      {/* Checkmark indicator (feed mode, select mode only) — always visible when checked */}
      {mode === 'feed' && selectMode && onCheck && (
        <div
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 pointer-events-none ${
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
        </div>
      )}

      {/* Hover metadata overlay (desktop) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-darkroom)]/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
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
            {onTap && (
              <button
                onClick={() => {
                  onTap();
                  setShowMenu(false);
                }}
                className="flex items-center gap-[var(--space-tight)] w-full px-[var(--space-element)] py-[var(--space-tight)] text-[length:var(--text-label)] text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] transition-colors"
              >
                <Maximize2 size={16} /> View detail
              </button>
            )}
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
