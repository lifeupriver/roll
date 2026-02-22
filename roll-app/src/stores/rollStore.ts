import { create } from 'zustand';
import type { Roll, RollPhoto, FilmProfileId } from '@/types/roll';

interface RollState {
  currentRoll: Roll | null;
  checkedPhotoIds: Set<string>;
  rollPhotos: RollPhoto[];
  rollCount: number;
  filmProfile: FilmProfileId | null;
  rolls: Roll[];

  setRoll: (roll: Roll | null) => void;
  setRolls: (rolls: Roll[]) => void;
  setRollPhotos: (photos: RollPhoto[]) => void;
  checkPhoto: (photoId: string) => void;
  uncheckPhoto: (photoId: string) => void;
  isChecked: (photoId: string) => boolean;
  setFilmProfile: (profile: FilmProfileId | null) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  removeFromRoll: (photoId: string) => void;
  resetRoll: () => void;
  updateRollStatus: (rollId: string, updates: Partial<Roll>) => void;
}

export const useRollStore = create<RollState>((set, get) => ({
  currentRoll: null,
  checkedPhotoIds: new Set(),
  rollPhotos: [],
  rollCount: 0,
  filmProfile: null,
  rolls: [],

  setRoll: (currentRoll) => set({ currentRoll }),

  setRolls: (rolls) => set({ rolls }),

  setRollPhotos: (rollPhotos) => set({ rollPhotos }),

  checkPhoto: (photoId) =>
    set((state) => {
      const next = new Set(state.checkedPhotoIds);
      if (next.size < 36) {
        next.add(photoId);
      }
      return { checkedPhotoIds: next, rollCount: next.size };
    }),

  uncheckPhoto: (photoId) =>
    set((state) => {
      const next = new Set(state.checkedPhotoIds);
      next.delete(photoId);
      return { checkedPhotoIds: next, rollCount: next.size };
    }),

  isChecked: (photoId) => get().checkedPhotoIds.has(photoId),

  setFilmProfile: (filmProfile) => set({ filmProfile }),

  reorderPhotos: (fromIndex, toIndex) =>
    set((state) => {
      const photos = [...state.rollPhotos];
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return {
        rollPhotos: photos.map((p, i) => ({ ...p, position: i + 1 })),
      };
    }),

  removeFromRoll: (photoId) =>
    set((state) => {
      const next = new Set(state.checkedPhotoIds);
      next.delete(photoId);
      const rollPhotos = state.rollPhotos
        .filter((p) => p.photo_id !== photoId)
        .map((p, i) => ({ ...p, position: i + 1 }));
      return {
        checkedPhotoIds: next,
        rollCount: next.size,
        rollPhotos,
      };
    }),

  resetRoll: () =>
    set({
      currentRoll: null,
      checkedPhotoIds: new Set(),
      rollPhotos: [],
      rollCount: 0,
      filmProfile: null,
    }),

  updateRollStatus: (rollId, updates) =>
    set((state) => ({
      rolls: state.rolls.map((r) =>
        r.id === rollId ? { ...r, ...updates } : r
      ),
      currentRoll:
        state.currentRoll?.id === rollId
          ? { ...state.currentRoll, ...updates }
          : state.currentRoll,
    })),
}));
