'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ThemeMode = 'light' | 'darkroom';

const STORAGE_KEY = 'roll-theme';
const REVEAL_DURATION = 400;

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const isTransitioning = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'darkroom') {
      setThemeState('darkroom');
      document.documentElement.classList.add('darkroom');
    }
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    if (mode === 'darkroom') {
      document.documentElement.classList.add('darkroom');
    } else {
      document.documentElement.classList.remove('darkroom');
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'darkroom' : 'light');
  }, [theme, setTheme]);

  /**
   * Circular reveal toggle: expands a circle from the click origin,
   * revealing the new theme underneath.
   */
  const toggleWithReveal = useCallback(
    (originX: number, originY: number) => {
      if (isTransitioning.current) return;

      // Reduced motion: skip animation
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        toggle();
        return;
      }

      isTransitioning.current = true;
      const nextTheme: ThemeMode = theme === 'light' ? 'darkroom' : 'light';

      // Calculate the max radius needed to cover the full viewport
      const maxX = Math.max(originX, window.innerWidth - originX);
      const maxY = Math.max(originY, window.innerHeight - originY);
      const maxRadius = Math.ceil(Math.hypot(maxX, maxY));

      // Create a full-screen overlay that will show the NEW theme
      const overlay = document.createElement('div');
      overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      clip-path: circle(0px at ${originX}px ${originY}px);
      transition: clip-path ${REVEAL_DURATION}ms ease-out;
    `;

      // Apply the target theme colors to the overlay
      if (nextTheme === 'darkroom') {
        overlay.style.backgroundColor = 'oklch(0.14 0 0)';
      } else {
        overlay.style.backgroundColor = 'oklch(0.97 0.01 80)';
      }

      document.body.appendChild(overlay);

      // Trigger the circle expansion on the next frame
      requestAnimationFrame(() => {
        overlay.style.clipPath = `circle(${maxRadius}px at ${originX}px ${originY}px)`;
      });

      // Apply the actual theme when animation completes
      setTimeout(() => {
        setTheme(nextTheme);
        // Remove overlay on next frame after theme is applied
        requestAnimationFrame(() => {
          overlay.remove();
          isTransitioning.current = false;
        });
      }, REVEAL_DURATION);
    },
    [theme, toggle, setTheme]
  );

  return { theme, setTheme, toggle, toggleWithReveal };
}
