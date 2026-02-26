import type { User } from './auth';
import type { Photo, ContentMode } from './photo';

export interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UsePhotosReturn {
  photos: Photo[];
  contentMode: ContentMode;
  setContentMode: (mode: ContentMode) => void;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  hidePhoto: (photoId: string) => Promise<void>;
  refresh: () => Promise<void>;
}
