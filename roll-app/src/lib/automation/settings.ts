import type { FilmProfileId } from '@/types/roll';
import type { ReelOrientation } from '@/types/reel';

// ─── Automation Settings ─────────────────────────────────────────────────────
// Stored in localStorage, these settings control what happens automatically
// after a roll is developed.

export interface AutomationSettings {
  // Post-develop automations
  autoDesignMagazine: boolean;
  autoPostToCircle: boolean;
  autoPostCircleId: string | null; // which circle to auto-post to
  autoOrderPrints: boolean;
  autoOrderPrintSize: '3x5' | '4x6' | '5x7' | '8x10';
  autoNotifyFollowers: boolean;
  autoCreateReel: boolean;
  autoReelOrientation: ReelOrientation;

  // Default development preferences
  defaultFilmProfile: FilmProfileId;
  defaultProcessMode: 'color' | 'bw';
}

export const DEFAULT_AUTOMATION: AutomationSettings = {
  autoDesignMagazine: false,
  autoPostToCircle: false,
  autoPostCircleId: null,
  autoOrderPrints: false,
  autoOrderPrintSize: '4x6',
  autoNotifyFollowers: false,
  autoCreateReel: false,
  autoReelOrientation: 'horizontal',
  defaultFilmProfile: 'warmth',
  defaultProcessMode: 'color',
};

const STORAGE_KEY = 'roll-automation-settings';

export function loadAutomationSettings(): AutomationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_AUTOMATION, ...JSON.parse(stored) };
    }
  } catch {
    // Use defaults
  }
  return { ...DEFAULT_AUTOMATION };
}

export function saveAutomationSettings(updates: Partial<AutomationSettings>): AutomationSettings {
  const current = loadAutomationSettings();
  const next = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
