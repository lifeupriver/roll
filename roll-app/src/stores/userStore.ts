import { create } from 'zustand';
import type { User } from '@/types/auth';

interface UserState {
  user: User | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: { access_token: string; refresh_token: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, session: null }),
}));
