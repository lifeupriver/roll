import { create } from 'zustand';

interface Roll {
  id: string;
  name: string | null;
  status: 'building' | 'ready' | 'processing' | 'developed' | 'error';
  film_profile: string | null;
  photo_count: number;
  max_photos: number;
}

interface RollState {
  currentRoll: Roll | null;
  checkedPhotoIds: Set<string>;
  rollCount: number;
  filmProfile: string | null;
  setRoll: (roll: Roll | null) => void;
  checkPhoto: (photoId: string) => void;
  uncheckPhoto: (photoId: string) => void;
  isChecked: (photoId: string) => boolean;
  setFilmProfile: (profile: string | null) => void;
}

export const useRollStore = create<RollState>((set, get) => ({
  currentRoll: null,
  checkedPhotoIds: new Set(),
  rollCount: 0,
  filmProfile: null,
  setRoll: (currentRoll) => set({ currentRoll }),
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
}));
