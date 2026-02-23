import { create } from 'zustand';
import type { Reel, ReelClip, AudioMood } from '@/types/reel';
import type { FilmProfileId } from '@/types/roll';

interface TrimPoints {
  startMs: number;
  endMs: number | null;
}

interface ReelState {
  currentReel: Reel | null;
  clipIds: Set<string>;
  reelClips: ReelClip[];
  reelCount: number;
  currentDurationMs: number;
  filmProfile: FilmProfileId | null;
  audioMood: AudioMood;
  reels: Reel[];
  trimPoints: Map<string, TrimPoints>;

  setReel: (reel: Reel | null) => void;
  setReels: (reels: Reel[]) => void;
  setReelClips: (clips: ReelClip[]) => void;
  addClip: (photoId: string, durationMs: number, trimStart?: number, trimEnd?: number | null) => void;
  removeClip: (photoId: string) => void;
  isClipAdded: (photoId: string) => boolean;
  setTrim: (photoId: string, startMs: number, endMs: number | null) => void;
  setFilmProfile: (profile: FilmProfileId | null) => void;
  setAudioMood: (mood: AudioMood) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  resetReel: () => void;
  updateReelStatus: (reelId: string, updates: Partial<Reel>) => void;
}

export const useReelStore = create<ReelState>((set, get) => ({
  currentReel: null,
  clipIds: new Set(),
  reelClips: [],
  reelCount: 0,
  currentDurationMs: 0,
  filmProfile: null,
  audioMood: 'original',
  reels: [],
  trimPoints: new Map(),

  setReel: (currentReel) => set({ currentReel }),

  setReels: (reels) => set({ reels }),

  setReelClips: (reelClips) => {
    const clipIds = new Set(reelClips.map((c) => c.photo_id));
    const currentDurationMs = reelClips.reduce((sum, c) => sum + c.trimmed_duration_ms, 0);
    set({ reelClips, clipIds, reelCount: clipIds.size, currentDurationMs });
  },

  addClip: (photoId, durationMs, trimStart = 0, trimEnd = null) =>
    set((state) => {
      const next = new Set(state.clipIds);
      next.add(photoId);
      const trimmedDuration = (trimEnd ?? durationMs) - trimStart;
      const newTrimPoints = new Map(state.trimPoints);
      newTrimPoints.set(photoId, { startMs: trimStart, endMs: trimEnd });
      return {
        clipIds: next,
        reelCount: next.size,
        currentDurationMs: state.currentDurationMs + trimmedDuration,
        trimPoints: newTrimPoints,
      };
    }),

  removeClip: (photoId) =>
    set((state) => {
      const next = new Set(state.clipIds);
      next.delete(photoId);
      const clip = state.reelClips.find((c) => c.photo_id === photoId);
      const removedDuration = clip?.trimmed_duration_ms ?? 0;
      const newTrimPoints = new Map(state.trimPoints);
      newTrimPoints.delete(photoId);
      const reelClips = state.reelClips
        .filter((c) => c.photo_id !== photoId)
        .map((c, i) => ({ ...c, position: i + 1 }));
      return {
        clipIds: next,
        reelCount: next.size,
        currentDurationMs: Math.max(0, state.currentDurationMs - removedDuration),
        trimPoints: newTrimPoints,
        reelClips,
      };
    }),

  isClipAdded: (photoId) => get().clipIds.has(photoId),

  setTrim: (photoId, startMs, endMs) =>
    set((state) => {
      const newTrimPoints = new Map(state.trimPoints);
      newTrimPoints.set(photoId, { startMs, endMs });
      // Recalculate duration
      const newClips = state.reelClips.map((c) => {
        if (c.photo_id === photoId) {
          const trimmedDuration = (endMs ?? c.trimmed_duration_ms + c.trim_start_ms) - startMs;
          return { ...c, trim_start_ms: startMs, trim_end_ms: endMs, trimmed_duration_ms: trimmedDuration };
        }
        return c;
      });
      const currentDurationMs = newClips.reduce((sum, c) => sum + c.trimmed_duration_ms, 0);
      return { trimPoints: newTrimPoints, reelClips: newClips, currentDurationMs };
    }),

  setFilmProfile: (filmProfile) => set({ filmProfile }),

  setAudioMood: (audioMood) => set({ audioMood }),

  reorderClips: (fromIndex, toIndex) =>
    set((state) => {
      const clips = [...state.reelClips];
      const [moved] = clips.splice(fromIndex, 1);
      clips.splice(toIndex, 0, moved);
      return {
        reelClips: clips.map((c, i) => ({ ...c, position: i + 1 })),
      };
    }),

  resetReel: () =>
    set({
      currentReel: null,
      clipIds: new Set(),
      reelClips: [],
      reelCount: 0,
      currentDurationMs: 0,
      filmProfile: null,
      audioMood: 'original',
      trimPoints: new Map(),
    }),

  updateReelStatus: (reelId, updates) =>
    set((state) => ({
      reels: state.reels.map((r) =>
        r.id === reelId ? { ...r, ...updates } : r
      ),
      currentReel:
        state.currentReel?.id === reelId
          ? { ...state.currentReel, ...updates }
          : state.currentReel,
    })),
}));
