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
  isChecked?: (photoId: string) => boolean;
  isHearted?: (photoId: string) => boolean;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  mode,
  onCheck,
  onHeart,
  isChecked,
  isHearted,
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

  // Reset video state when switching photos
  useEffect(() => {
    setIsPlaying(false);
    setVideoProgress(0);
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

  // Format camera info
  const cameraInfo = (() => {
    const parts: string[] = [];
    if (currentPhoto.camera_make) parts.push(currentPhoto.camera_make);
    if (currentPhoto.camera_model) parts.push(currentPhoto.camera_model);
    return parts.join(' ');
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
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close photo viewer"
        className={[
          'absolute top-[var(--space-component)] right-[var(--space-component)] z-10',
          'flex items-center justify-center',
          'w-10 h-10 min-w-[44px] min-h-[44px]',
          'bg-transparent text-[var(--color-ink-inverse)]',
          'hover:text-[var(--color-ink-inverse)]/70',
          'transition-colors duration-150 ease-out',
          'cursor-pointer border-none',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
        ].join(' ')}
      >
        <X size={24} strokeWidth={1.5} />
      </button>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous photo"
          className={[
            'absolute left-[var(--space-element)] top-1/2 -translate-y-1/2 z-10',
            'flex items-center justify-center',
            'w-10 h-10 min-w-[44px] min-h-[44px]',
            'bg-transparent text-[var(--color-ink-inverse)]',
            'hover:text-[var(--color-ink-inverse)]/70',
            'transition-colors duration-150 ease-out',
            'cursor-pointer border-none',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
            'hidden sm:flex',
          ].join(' ')}
        >
          <ChevronLeft size={32} strokeWidth={1.5} />
        </button>
      )}

      {/* Next button */}
      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next photo"
          className={[
            'absolute right-[var(--space-element)] top-1/2 -translate-y-1/2 z-10',
            'flex items-center justify-center',
            'w-10 h-10 min-w-[44px] min-h-[44px]',
            'bg-transparent text-[var(--color-ink-inverse)]',
            'hover:text-[var(--color-ink-inverse)]/70',
            'transition-colors duration-150 ease-out',
            'cursor-pointer border-none',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
            'hidden sm:flex',
          ].join(' ')}
        >
          <ChevronRight size={32} strokeWidth={1.5} />
        </button>
      )}

      {/* Media display area */}
      <div className="flex-1 flex items-center justify-center w-full px-[var(--space-section)] sm:px-[var(--space-hero)] overflow-hidden">
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

      {/* Bottom bar: metadata + actions */}
      <div
        className={[
          'w-full px-[var(--space-section)] pb-[var(--space-section)] pt-[var(--space-element)]',
          'flex flex-col items-center gap-[var(--space-element)]',
          'transition-opacity duration-200 ease-out',
          metadataVisible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {/* Metadata bar */}
        <div className="flex flex-col items-center gap-[var(--space-micro)]">
          {formattedDate && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tracking-wide">
              {formattedDate}
            </p>
          )}
          {cameraInfo && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tracking-wide">
              {cameraInfo}
            </p>
          )}
        </div>

        {/* Mode-specific action buttons */}
        <div className="flex items-center gap-[var(--space-element)]">
          {/* Feed mode: checkmark button */}
          {mode === 'feed' && onCheck && (
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
