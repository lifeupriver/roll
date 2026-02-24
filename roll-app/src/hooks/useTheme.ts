'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'darkroom';

const STORAGE_KEY = 'roll-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light');

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

  return { theme, setTheme, toggle };
}
