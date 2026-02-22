import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentMode } from '@/types/photo';

interface FilterState {
  contentMode: ContentMode;
  sortOrder: 'newest' | 'oldest';
  isFilterPanelOpen: boolean;
  setContentMode: (mode: ContentMode) => void;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  toggleFilterPanel: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      contentMode: 'all',
      sortOrder: 'newest',
      isFilterPanelOpen: false,
      setContentMode: (contentMode) => set({ contentMode }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
    }),
    { name: 'roll-filter-store' }
  )
);
