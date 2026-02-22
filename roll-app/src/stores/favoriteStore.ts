import { create } from 'zustand';
import type { Favorite } from '@/types/favorite';

interface FavoriteState {
  favorites: Favorite[];
  favoritePhotoIds: Set<string>;
  loading: boolean;

  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (photoId: string) => void;
  isFavorited: (photoId: string) => boolean;
  reset: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  favoritePhotoIds: new Set<string>(),
  loading: false,

  setFavorites: (favorites) => {
    const favoritePhotoIds = new Set(favorites.map((f) => f.photo_id));
    set({ favorites, favoritePhotoIds });
  },

  addFavorite: (favorite) =>
    set((state) => {
      const favorites = [...state.favorites, favorite];
      const favoritePhotoIds = new Set(state.favoritePhotoIds);
      favoritePhotoIds.add(favorite.photo_id);
      return { favorites, favoritePhotoIds };
    }),

  removeFavorite: (photoId) =>
    set((state) => {
      const favorites = state.favorites.filter((f) => f.photo_id !== photoId);
      const favoritePhotoIds = new Set(state.favoritePhotoIds);
      favoritePhotoIds.delete(photoId);
      return { favorites, favoritePhotoIds };
    }),

  isFavorited: (photoId) => {
    return get().favoritePhotoIds.has(photoId);
  },

  reset: () => set({ favorites: [], favoritePhotoIds: new Set<string>(), loading: false }),
}));
