import { create } from 'zustand';
import type { Photo, ContentMode } from '@/types/photo';

interface PhotoState {
  photos: Photo[];
  contentMode: ContentMode;
  selectedPhotoIds: Set<string>;
  loading: boolean;
  error: string | null;
  cursor: string | null;
  hasMore: boolean;
  setPhotos: (photos: Photo[]) => void;
  appendPhotos: (photos: Photo[]) => void;
  setContentMode: (mode: ContentMode) => void;
  togglePhotoSelection: (photoId: string) => void;
  hidePhoto: (photoId: string) => void;
  recoverPhoto: (photoId: string, photo: Photo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCursor: (cursor: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const usePhotoStore = create<PhotoState>((set) => ({
  photos: [],
  contentMode: 'all',
  selectedPhotoIds: new Set(),
  loading: false,
  error: null,
  cursor: null,
  hasMore: true,
  setPhotos: (photos) => set({ photos }),
  appendPhotos: (photos) =>
    set((state) => ({ photos: [...state.photos, ...photos] })),
  setContentMode: (contentMode) => set({ contentMode, photos: [], cursor: null, hasMore: true }),
  togglePhotoSelection: (photoId) =>
    set((state) => {
      const next = new Set(state.selectedPhotoIds);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return { selectedPhotoIds: next };
    }),
  hidePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== photoId),
    })),
  recoverPhoto: (photoId, photo) =>
    set((state) => ({
      photos: [...state.photos, photo].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCursor: (cursor) => set({ cursor }),
  setHasMore: (hasMore) => set({ hasMore }),
}));
