'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Plus,
} from 'lucide-react';
import { formatDuration } from '@/components/reel/ClipDurationBadge';

interface PhotoLightboxProps {
  photos: Array<{
    id: string;
    thumbnail_url: string;
    storage_key: string;
    date_taken: string | null;
    camera_make: string | null;
    camera_model: string | null;
    latitude: number | null;
    longitude: number | null;
    media_type?: 'photo' | 'video';
    preview_storage_key?: string | null;
    duration_ms?: number | null;
  }>;
  initialIndex: number;
  onClose: () => void;
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  onCheck?: (photoId: string) => void;
  onHeart?: (photoId: string) => void;
  onAddToRoll?: (photoId: string) => void;
  onCaption?: (photoId: string, caption: string) => void;
  isChecked?: (photoId: string) => boolean;
  isHearted?: (photoId: string) => boolean;
  isInRoll?: (photoId: string) => boolean;
  getCaption?: (photoId: string) => string;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  mode,
  onCheck,
  onHeart,
  onAddToRoll,
  onCaption,
  isChecked,
  isHearted,
  isInRoll,
  getCaption,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [metadataVisible, setMetadataVisible] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const metadataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPhoto = photos[currentIndex];
  const isVideo = currentPhoto.media_type === 'video';
  const videoUrl = currentPhoto.preview_storage_key || (isVideo ? currentPhoto.storage_key : null);

  // Mount portal on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Opening animation trigger
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
    document.body.style.overflow = 'hidden';
    containerRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Reset video and caption state when switching photos
  useEffect(() => {
    setIsPlaying(false);
    setVideoProgress(0);
    setIsEditingCaption(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  // Show metadata after photo settles (200ms delay)
  useEffect(() => {
    setMetadataVisible(false);
    metadataTimerRef.current = setTimeout(() => {
      setMetadataVisible(true);
    }, 200);

    return () => {
      if (metadataTimerRef.current) {
        clearTimeout(metadataTimerRef.current);
      }
    };
  }, [currentIndex]);

  // Clear transition direction after animation completes
  useEffect(() => {
    if (transitionDirection) {
      const timer = setTimeout(() => {
        setTransitionDirection(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [transitionDirection]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setTransitionDirection('right');
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setTransitionDirection('left');
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, photos.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
      }
    },
    [handleClose, goToPrevious, goToNext]
  );

  // Touch swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 50;
    if (touchDeltaX.current > threshold) {
      goToPrevious();
    } else if (touchDeltaX.current < -threshold) {
      goToNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  }, [goToPrevious, goToNext]);

  // Video controls
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setVideoProgress(video.currentTime / video.duration);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoProgress(0);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    video.currentTime = fraction * video.duration;
    setVideoProgress(fraction);
  }, []);

  // Share current photo
  const handleShare = useCallback(async () => {
    const shareData: ShareData = {
      title: 'Photo from Roll',
      text: formattedDate ? `Photo from ${formattedDate}` : 'Photo from Roll',
    };

    // If Web Share API supports URL sharing
    if (currentPhoto.thumbnail_url && !currentPhoto.thumbnail_url.startsWith('data:')) {
      shareData.url = currentPhoto.thumbnail_url;
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy image URL to clipboard
      try {
        await navigator.clipboard.writeText(currentPhoto.thumbnail_url || '');
      } catch {
        // Clipboard API not available
      }
    }
  }, [currentPhoto]);

  // Format location info from GPS coordinates
  const locationInfo = (() => {
    if (currentPhoto.latitude !== null && currentPhoto.longitude !== null) {
      const lat = currentPhoto.latitude;
      const lng = currentPhoto.longitude;
      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';
      return `${Math.abs(lat).toFixed(4)}\u00B0${latDir}, ${Math.abs(lng).toFixed(4)}\u00B0${lngDir}`;
    }
    return null;
  })();

  // Format date
  const formattedDate = currentPhoto.date_taken
    ? new Date(currentPhoto.date_taken).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const lightboxContent = (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-[var(--color-surface-overlay)] outline-none',
        'transition-opacity duration-300',
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top bar: back link */}
      <div className="w-full px-[var(--space-component)] py-[var(--space-element)] flex items-center shrink-0 z-10">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Back to grid"
          className={[
            'flex items-center gap-[var(--space-tight)]',
            'text-[var(--color-ink-inverse)]',
            'hover:text-[var(--color-ink-inverse)]/70',
            'transition-colors duration-150 ease-out',
            'cursor-pointer border-none bg-transparent',
            'text-[length:var(--text-label)] font-medium',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
          ].join(' ')}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
          Back
        </button>
      </div>

      {/* Media display area with nav arrows outside */}
      <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
        {/* Previous button — outside the photo */}
        <div className="shrink-0 w-12 sm:w-16 flex items-center justify-center">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous photo"
              className={[
                'flex items-center justify-center',
                'w-10 h-10 min-w-[44px] min-h-[44px]',
                'bg-transparent text-[var(--color-ink-inverse)]',
                'hover:text-[var(--color-ink-inverse)]/70',
                'transition-colors duration-150 ease-out',
                'cursor-pointer border-none',
                'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
              ].join(' ')}
            >
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Photo/video content */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
        {isVideo && videoUrl ? (
          <div
            key={currentPhoto.id}
            className={[
              'relative max-w-full max-h-full',
              'transition-all duration-[250ms] ease-out',
              transitionDirection ? 'scale-95 opacity-80' : 'scale-100 opacity-100',
            ].join(' ')}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              poster={currentPhoto.thumbnail_url}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onClick={togglePlayPause}
              className="max-w-full max-h-[70vh] object-contain select-none cursor-pointer rounded-[var(--radius-card)]"
            />
            {/* Play/pause overlay */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Play size={32} className="text-white ml-1" fill="white" fillOpacity={0.9} />
                </div>
              </button>
            )}
            {/* Video controls bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="text-white/90 hover:text-white shrink-0"
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="white" fillOpacity={0.9} />
                )}
              </button>
              {/* Progress bar */}
              <div
                className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-white rounded-full transition-[width] duration-100"
                  style={{ width: `${videoProgress * 100}%` }}
                />
              </div>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="text-white/90 hover:text-white shrink-0"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              {currentPhoto.duration_ms && (
                <span className="text-white/80 text-xs font-[family-name:var(--font-mono)] tabular-nums shrink-0">
                  {formatDuration(currentPhoto.duration_ms)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <img
            key={currentPhoto.id}
            src={currentPhoto.thumbnail_url}
            alt={`Photo${formattedDate ? ` from ${formattedDate}` : ''}`}
            draggable={false}
            className={[
              'max-w-full max-h-full object-contain select-none',
              'transition-all duration-[250ms] ease-out',
              transitionDirection ? 'scale-95 opacity-80' : 'scale-100 opacity-100',
            ].join(' ')}
          />
        )}
        </div>

        {/* Next button — outside the photo */}
        <div className="shrink-0 w-12 sm:w-16 flex items-center justify-center">
          {currentIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next photo"
              className={[
                'flex items-center justify-center',
                'w-10 h-10 min-w-[44px] min-h-[44px]',
                'bg-transparent text-[var(--color-ink-inverse)]',
                'hover:text-[var(--color-ink-inverse)]/70',
                'transition-colors duration-150 ease-out',
                'cursor-pointer border-none',
                'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
              ].join(' ')}
            >
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom bar: metadata + actions */}
      <div
        className={[
          'w-full px-[var(--space-section)] pb-[var(--space-section)] pt-[var(--space-element)]',
          'flex flex-col items-center gap-[var(--space-element)]',
          'transition-opacity duration-200 ease-out',
          metadataVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {/* Metadata bar + Add to Roll — all in one centered row */}
        <div className="flex items-center justify-center gap-[var(--space-component)] flex-wrap">
          {formattedDate && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tracking-wide">
              {formattedDate}
            </p>
          )}
          {locationInfo && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tracking-wide">
              {locationInfo}
            </p>
          )}
          {/* Feed mode: Add to Roll button inline with metadata */}
          {mode === 'feed' && onAddToRoll && (
            <button
              type="button"
              onClick={() => onAddToRoll(currentPhoto.id)}
              aria-label={
                isInRoll?.(currentPhoto.id) ? 'Remove from roll' : 'Add to roll'
              }
              className={[
                'flex items-center gap-[var(--space-tight)]',
                'px-4 h-9 rounded-full',
                'transition-all duration-200 ease-out',
                'cursor-pointer border-none',
                'text-[length:var(--text-caption)] font-medium',
                'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
                isInRoll?.(currentPhoto.id)
                  ? 'bg-[var(--color-action)] text-white'
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30',
              ].join(' ')}
            >
              {isInRoll?.(currentPhoto.id) ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  In Roll
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2} />
                  Add to Roll
                </>
              )}
            </button>
          )}
        </div>

        {/* Caption prompt — roll mode */}
        {(mode === 'roll' || mode === 'favorites') && onCaption && (
          <div className="w-full max-w-md">
            {isEditingCaption ? (
              <input
                autoFocus
                type="text"
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                onBlur={() => {
                  onCaption(currentPhoto.id, captionDraft.trim());
                  setIsEditingCaption(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onCaption(currentPhoto.id, captionDraft.trim());
                    setIsEditingCaption(false);
                  }
                  if (e.key === 'Escape') setIsEditingCaption(false);
                }}
                placeholder="Write a caption..."
                maxLength={200}
                className="w-full bg-transparent border-b border-white/30 focus:border-white/60 text-[length:var(--text-label)] text-[var(--color-ink-inverse)] placeholder:text-white/40 focus:outline-none text-center pb-1"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCaptionDraft(getCaption?.(currentPhoto.id) || '');
                  setIsEditingCaption(true);
                }}
                className="w-full text-center text-[length:var(--text-label)] text-white/50 hover:text-white/70 transition-colors"
              >
                {getCaption?.(currentPhoto.id) || 'Add a caption'}
              </button>
            )}
          </div>
        )}

        {/* Mode-specific action buttons */}
        <div className="flex items-center justify-center gap-[var(--space-element)]">
          {/* Feed mode (select mode): checkmark button */}
          {mode === 'feed' && onCheck && !onAddToRoll && (
            <button
              type="button"
              onClick={() => onCheck(currentPhoto.id)}
              role="checkbox"
              aria-checked={isChecked?.(currentPhoto.id) ?? false}
              aria-label={
                isChecked?.(currentPhoto.id) ? 'Remove photo from roll' : 'Select photo for roll'
              }
              className={[
                'flex items-center justify-center',
                'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full',
                'transition-all duration-200 ease-out',
                'cursor-pointer border-none',
                'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
                isChecked?.(currentPhoto.id)
                  ? 'bg-[var(--color-action)] text-[var(--color-ink-inverse)]'
                  : 'bg-[var(--color-surface-overlay)]/40 border border-white/60 text-[var(--color-ink-inverse)]',
              ].join(' ')}
            >
              <Check size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* Roll / Favorites mode: heart button */}
          {(mode === 'roll' || mode === 'favorites') && onHeart && (
            <button
              type="button"
              onClick={() => onHeart(currentPhoto.id)}
              role="checkbox"
              aria-checked={isHearted?.(currentPhoto.id) ?? false}
              aria-label={
                isHearted?.(currentPhoto.id) ? 'Remove from favorites' : 'Mark as favorite'
              }
              className={[
                'flex items-center justify-center',
                'w-11 h-11 min-w-[44px] min-h-[44px]',
                'bg-transparent border-none cursor-pointer',
                'transition-colors duration-150 ease-out',
                'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
                isHearted?.(currentPhoto.id)
                  ? 'text-[var(--color-heart)]'
                  : 'text-[var(--color-ink-inverse)] hover:text-[var(--color-heart)]',
              ].join(' ')}
            >
              <Heart
                size={24}
                strokeWidth={1.5}
                fill={isHearted?.(currentPhoto.id) ? 'currentColor' : 'none'}
              />
            </button>
          )}

          {/* Share button — always available */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this photo"
            className={[
              'flex items-center justify-center',
              'w-11 h-11 min-w-[44px] min-h-[44px]',
              'bg-transparent border-none cursor-pointer',
              'text-[var(--color-ink-inverse)] hover:text-[var(--color-ink-inverse)]/70',
              'transition-colors duration-150 ease-out',
              'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
            ].join(' ')}
          >
            <Share2 size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Photo counter */}
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tabular-nums">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(lightboxContent, document.body);
}
