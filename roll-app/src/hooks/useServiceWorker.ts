'use client';

import { useEffect, useRef, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

export function useServiceWorker(): ServiceWorkerState {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    registration: null,
    updateAvailable: false,
  });
  const registered = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    setState((prev) => ({ ...prev, isSupported: true }));

    if (registered.current) return;
    registered.current = true;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setState((prev) => ({ ...prev, isRegistered: true, registration: reg }));

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, updateAvailable: true }));
            }
          });
        });
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  }, []);

  return state;
}
