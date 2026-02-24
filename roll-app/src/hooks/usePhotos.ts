'use client';

import { useCallback } from 'react';
import { usePhotoStore } from '@/stores/photoStore';
import { createClient } from '@/lib/supabase/client';
import type { Photo, ContentMode } from '@/types/photo';
import type { UsePhotosReturn } from '@/types/hooks';

export function usePhotos(): UsePhotosReturn {
  const {
    photos,
    contentMode,
    loading,
    error,
    cursor,
    hasMore,
    setPhotos,
    appendPhotos,
    setContentMode: setStoreContentMode,
    hidePhoto: hideFromStore,
    setLoading,
    setError,
    setCursor,
    setHasMore,
  } = usePhotoStore();

  const loadPhotos = useCallback(async (mode?: ContentMode, append?: boolean) => {
    const supabase = createClient();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const activeMode = mode || contentMode;
      let query = supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('filter_status', 'visible')
        .order('date_taken', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (activeMode === 'clips') {
        query = query.eq('media_type', 'video');
      } else if (activeMode === 'people') {
        query = query.gt('face_count', 0);
      }

      if (append && cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      const fetchedPhotos = (data || []) as Photo[];

      if (append) {
        appendPhotos(fetchedPhotos);
      } else {
        setPhotos(fetchedPhotos);
      }

      if (fetchedPhotos.length > 0) {
        setCursor(fetchedPhotos[fetchedPhotos.length - 1].created_at);
      }
      setHasMore(fetchedPhotos.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [contentMode, cursor, appendPhotos, setPhotos, setLoading, setError, setCursor, setHasMore]);

  const setContentMode = useCallback((mode: ContentMode) => {
    setStoreContentMode(mode);
    loadPhotos(mode, false);
  }, [setStoreContentMode, loadPhotos]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPhotos(undefined, true);
  }, [hasMore, loading, loadPhotos]);

  const hidePhoto = useCallback(async (photoId: string) => {
    const supabase = createClient();
    try {
      hideFromStore(photoId);
      const { error: updateError } = await supabase
        .from('photos')
        .update({ filter_status: 'hidden_manual' })
        .eq('id', photoId);
      if (updateError) throw updateError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide photo');
    }
  }, [hideFromStore, setError]);

  return {
    photos,
    contentMode,
    setContentMode,
    loading,
    error,
    hasMore,
    loadMore,
    hidePhoto,
  };
}
