'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, Share2, X } from 'lucide-react';
import { formatDuration } from './ClipDurationBadge';

interface ReelPlayerProps {
  videoUrl: string;
  posterUrl: string;
  durationMs: number;
  filmProfile: string | null;
  isHearted: boolean;
  onHeart: (hearted: boolean) => void;
  onShare?: () => void;
  onClose: () => void;
}

export function ReelPlayer({
  videoUrl,
  posterUrl,
  durationMs,
  filmProfile,
  isHearted,
  onHeart,
  onShare,
  onClose,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = useCallback(() => {
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
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime * 1000);
    }
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Number(e.target.value) / 1000;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-[var(--space-component)]">
        {filmProfile && (
          <span className="px-[var(--space-tight)] py-[var(--space-micro)] bg-white/10 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] text-white/80 font-[family-name:var(--font-body)] font-medium capitalize backdrop-blur-sm">
            {filmProfile}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player"
          className="p-2 text-white/80 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-[var(--space-component)] pb-[calc(var(--space-component)+env(safe-area-inset-bottom))]">
        {/* Scrubber */}
        <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-element)]">
          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white/60 tabular-nums w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={durationMs}
            value={currentTime}
            onChange={handleScrub}
            className="flex-1 h-1 appearance-none bg-white/20 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-white/60 tabular-nums w-10">
            {formatDuration(durationMs)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-2 text-white hover:text-white/80 transition-colors"
            >
              {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-[var(--space-element)]">
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                aria-label="Share to Circle"
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <Share2 size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onHeart(!isHearted)}
              aria-label={isHearted ? 'Remove from favorites' : 'Favorite this reel'}
              className={`p-2 transition-colors ${isHearted ? 'text-[var(--color-heart)]' : 'text-white/60 hover:text-[var(--color-heart)]'}`}
            >
              <Heart size={24} fill={isHearted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
