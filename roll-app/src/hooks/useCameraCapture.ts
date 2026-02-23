'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraCaptureReturn {
  isSupported: boolean;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capturedPhotos: File[];
  startCamera: (facingMode?: 'user' | 'environment') => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => Promise<File | null>;
  clearPhotos: () => void;
  error: string | null;
}

export function useCameraCapture(): UseCameraCaptureReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices
    );
  }, []);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    setError(null);

    if (!isSupported) {
      setError('Camera is not available on this device');
      return;
    }

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access was denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera');
      }
    }
  }, [isSupported]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !isActive) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Convert to blob then to File
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );
    if (!blob) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
    setCapturedPhotos((prev) => [...prev, file]);

    return file;
  }, [isActive]);

  const clearPhotos = useCallback(() => {
    setCapturedPhotos([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    videoRef,
    capturedPhotos,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhotos,
    error,
  };
}
