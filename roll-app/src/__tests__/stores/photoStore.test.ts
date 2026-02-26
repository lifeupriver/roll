import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoStore } from '@/stores/photoStore';
import type { Photo } from '@/types/photo';

function makePhoto(id: string, createdAt: string): Photo {
  return {
    id,
    user_id: 'user-1',
    storage_key: `originals/user-1/${id}.jpg`,
    thumbnail_url: '',
    lqip_base64: null,
    filename: `${id}.jpg`,
    content_hash: id,
    content_type: 'image/jpeg',
    size_bytes: 1024,
    width: 100,
    height: 100,
    date_taken: null,
    latitude: null,
    longitude: null,
    camera_make: null,
    camera_model: null,
    filter_status: 'visible',
    filter_reason: null,
    aesthetic_score: null,
    phash: null,
    face_count: 0,
    scene_classification: [],
    created_at: createdAt,
    updated_at: createdAt,
    media_type: 'photo',
    duration_ms: null,
    duration_category: null,
    preview_storage_key: null,
    audio_classification: null,
    stabilization_score: null,
  } as Photo;
}

describe('photoStore', () => {
  beforeEach(() => {
    usePhotoStore.setState({
      photos: [],
      contentMode: 'all',
      selectedPhotoIds: new Set(),
      loading: false,
      error: null,
      cursor: null,
      hasMore: true,
    });
  });

  it('setPhotos replaces photos array', () => {
    usePhotoStore.getState().setPhotos([makePhoto('1', '2026-01-01T00:00:00Z')]);
    expect(usePhotoStore.getState().photos).toHaveLength(1);
    usePhotoStore.getState().setPhotos([makePhoto('2', '2026-01-02T00:00:00Z')]);
    expect(usePhotoStore.getState().photos).toHaveLength(1);
    expect(usePhotoStore.getState().photos[0].id).toBe('2');
  });

  it('appendPhotos adds to existing photos', () => {
    usePhotoStore.getState().setPhotos([makePhoto('1', '2026-01-01T00:00:00Z')]);
    usePhotoStore.getState().appendPhotos([makePhoto('2', '2026-01-02T00:00:00Z')]);
    expect(usePhotoStore.getState().photos).toHaveLength(2);
  });

  it('setContentMode resets photos and pagination', () => {
    usePhotoStore.getState().setPhotos([makePhoto('1', '2026-01-01T00:00:00Z')]);
    usePhotoStore.getState().setCursor('cursor-1');
    usePhotoStore.getState().setHasMore(false);

    usePhotoStore.getState().setContentMode('people');

    expect(usePhotoStore.getState().photos).toHaveLength(0);
    expect(usePhotoStore.getState().cursor).toBeNull();
    expect(usePhotoStore.getState().hasMore).toBe(true);
    expect(usePhotoStore.getState().contentMode).toBe('people');
  });

  it('togglePhotoSelection adds and removes', () => {
    usePhotoStore.getState().togglePhotoSelection('p1');
    expect(usePhotoStore.getState().selectedPhotoIds.has('p1')).toBe(true);

    usePhotoStore.getState().togglePhotoSelection('p1');
    expect(usePhotoStore.getState().selectedPhotoIds.has('p1')).toBe(false);
  });

  it('hidePhoto removes from photos array', () => {
    usePhotoStore
      .getState()
      .setPhotos([makePhoto('1', '2026-01-01T00:00:00Z'), makePhoto('2', '2026-01-02T00:00:00Z')]);
    usePhotoStore.getState().hidePhoto('1');
    expect(usePhotoStore.getState().photos.map((p) => p.id)).toEqual(['2']);
  });

  it('recoverPhoto inserts in sorted order by created_at (newest first)', () => {
    usePhotoStore
      .getState()
      .setPhotos([makePhoto('1', '2026-01-03T00:00:00Z'), makePhoto('3', '2026-01-01T00:00:00Z')]);

    usePhotoStore.getState().recoverPhoto('2', makePhoto('2', '2026-01-02T00:00:00Z'));

    expect(usePhotoStore.getState().photos.map((p) => p.id)).toEqual(['1', '2', '3']);
  });

  it('setLoading updates loading state', () => {
    usePhotoStore.getState().setLoading(true);
    expect(usePhotoStore.getState().loading).toBe(true);
  });

  it('setError updates error state', () => {
    usePhotoStore.getState().setError('Something went wrong');
    expect(usePhotoStore.getState().error).toBe('Something went wrong');
  });
});
