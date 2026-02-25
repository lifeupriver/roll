import { create } from 'zustand';
import type { StackMode } from '@/types/photo';

interface StackState {
  mode: StackMode;
  sensitivity: number;
  setMode: (mode: StackMode) => void;
  setSensitivity: (sensitivity: number) => void;
}

function loadFromStorage(): { mode: StackMode; sensitivity: number } {
  if (typeof window === 'undefined') return { mode: 'auto', sensitivity: 0.7 };
  try {
    const stored = localStorage.getItem('roll-stack-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        mode: parsed.mode || 'auto',
        sensitivity: typeof parsed.sensitivity === 'number' ? parsed.sensitivity : 0.7,
      };
    }
  } catch {
    // Ignore
  }
  return { mode: 'auto', sensitivity: 0.7 };
}

function saveToStorage(mode: StackMode, sensitivity: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('roll-stack-settings', JSON.stringify({ mode, sensitivity }));
  } catch {
    // Ignore
  }
}

export const useStackStore = create<StackState>((set, get) => ({
  ...loadFromStorage(),

  setMode: (mode) => {
    set({ mode });
    saveToStorage(mode, get().sensitivity);
  },

  setSensitivity: (sensitivity) => {
    set({ sensitivity });
    saveToStorage(get().mode, sensitivity);
  },
}));
