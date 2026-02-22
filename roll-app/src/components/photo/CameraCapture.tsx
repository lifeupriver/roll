'use client';

import { useState } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureProps {
  onPhotosReady: (files: File[]) => void;
}

export function CameraCapture({ onPhotosReady }: CameraCaptureProps) {
  const {
    isSupported,
    isActive,
    videoRef,
    capturedPhotos,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhotos,
    error,
  } = useCameraCapture();

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  if (!isSupported) return null;

  const handleCapture = () => {
    capturePhoto();
  };

  const handleFlipCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    await startCamera(newMode);
  };

  const handleDone = () => {
    stopCamera();
    if (capturedPhotos.length > 0) {
      onPhotosReady(capturedPhotos);
      clearPhotos();
    }
  };

  const handleClose = () => {
    stopCamera();
    clearPhotos();
  };

  // Camera viewfinder overlay
  if (isActive) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Video preview */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-[var(--space-component)] left-[var(--space-component)] w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>

          {/* Photo count badge */}
          {capturedPhotos.length > 0 && (
            <div className="absolute top-[var(--space-component)] right-[var(--space-component)] bg-[var(--color-action)] text-white rounded-full px-3 py-1 text-[length:var(--text-caption)] font-[family-name:var(--font-mono)]">
              {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-around py-[var(--space-section)] bg-black/90 safe-area-inset-bottom">
          {/* Flip camera */}
          <button
            onClick={handleFlipCamera}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white touch-target"
          >
            <RotateCcw size={20} />
          </button>

          {/* Shutter button */}
          <button
            onClick={handleCapture}
            className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center touch-target"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-14 h-14 rounded-full bg-white" style={{ width: 56, height: 56 }} />
          </button>

          {/* Done / use photos */}
          <button
            onClick={handleDone}
            className={`w-12 h-12 rounded-full flex items-center justify-center touch-target ${
              capturedPhotos.length > 0
                ? 'bg-[var(--color-action)] text-white'
                : 'bg-white/10 text-white/30'
            }`}
            disabled={capturedPhotos.length === 0}
          >
            <Check size={20} />
          </button>
        </div>

        {error && (
          <div className="absolute bottom-32 left-4 right-4 bg-red-900/80 text-white text-center py-2 rounded-lg text-[length:var(--text-caption)]">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Camera trigger button (shown alongside upload)
  return (
    <button
      onClick={() => startCamera(facingMode)}
      className="flex items-center gap-[var(--space-tight)] px-[var(--space-component)] py-[var(--space-tight)] border border-[var(--color-border-strong)] rounded-[var(--radius-card)] text-[length:var(--text-label)] text-[var(--color-ink-secondary)] hover:border-[var(--color-action)] hover:text-[var(--color-action)] transition-colors duration-150"
    >
      <Camera size={18} />
      Take photo
    </button>
  );
}
