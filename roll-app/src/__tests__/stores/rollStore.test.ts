import { describe, it, expect, beforeEach } from 'vitest';
import { useRollStore } from '@/stores/rollStore';
import type { RollPhoto } from '@/types/roll';

function makeRollPhoto(overrides: Partial<RollPhoto> & { photo_id: string; position: number }): RollPhoto {
  return {
    id: `rp-${overrides.photo_id}`,
    roll_id: 'roll-1',
    storage_key: `originals/user/photo.jpg`,
    processed_storage_key: null,
    correction_applied: false,
    created_at: new Date().toISOString(),
    ...overrides,
  } as RollPhoto;
}

describe('rollStore', () => {
  beforeEach(() => {
    useRollStore.getState().resetRoll();
    useRollStore.getState().setRolls([]);
  });

  describe('checkPhoto / uncheckPhoto', () => {
    it('adds a photo to checkedPhotoIds', () => {
      useRollStore.getState().checkPhoto('photo-1');
      expect(useRollStore.getState().checkedPhotoIds.has('photo-1')).toBe(true);
      expect(useRollStore.getState().rollCount).toBe(1);
    });

    it('enforces maximum of 36 checked photos', () => {
      for (let i = 0; i < 40; i++) {
        useRollStore.getState().checkPhoto(`photo-${i}`);
      }
      expect(useRollStore.getState().checkedPhotoIds.size).toBe(36);
      expect(useRollStore.getState().rollCount).toBe(36);
    });

    it('removes a photo from checkedPhotoIds', () => {
      useRollStore.getState().checkPhoto('photo-1');
      useRollStore.getState().uncheckPhoto('photo-1');
      expect(useRollStore.getState().checkedPhotoIds.has('photo-1')).toBe(false);
      expect(useRollStore.getState().rollCount).toBe(0);
    });

    it('unchecking a non-existent photo does not throw', () => {
      expect(() => useRollStore.getState().uncheckPhoto('nonexistent')).not.toThrow();
    });

    it('does not duplicate when checking same photo twice', () => {
      useRollStore.getState().checkPhoto('photo-1');
      useRollStore.getState().checkPhoto('photo-1');
      expect(useRollStore.getState().rollCount).toBe(1);
    });
  });

  describe('isChecked', () => {
    it('returns true for checked photos', () => {
      useRollStore.getState().checkPhoto('photo-1');
      expect(useRollStore.getState().isChecked('photo-1')).toBe(true);
    });

    it('returns false for unchecked photos', () => {
      expect(useRollStore.getState().isChecked('photo-1')).toBe(false);
    });
  });

  describe('reorderPhotos', () => {
    it('moves a photo from one position to another', () => {
      useRollStore.getState().setRollPhotos([
        makeRollPhoto({ photo_id: 'p1', position: 1 }),
        makeRollPhoto({ photo_id: 'p2', position: 2 }),
        makeRollPhoto({ photo_id: 'p3', position: 3 }),
      ]);

      useRollStore.getState().reorderPhotos(0, 2);
      const photos = useRollStore.getState().rollPhotos;
      expect(photos[0].photo_id).toBe('p2');
      expect(photos[1].photo_id).toBe('p3');
      expect(photos[2].photo_id).toBe('p1');
      expect(photos.map((p) => p.position)).toEqual([1, 2, 3]);
    });
  });

  describe('removeFromRoll', () => {
    it('removes photo and renumbers positions', () => {
      useRollStore.getState().checkPhoto('p2');
      useRollStore.getState().setRollPhotos([
        makeRollPhoto({ photo_id: 'p1', position: 1 }),
        makeRollPhoto({ photo_id: 'p2', position: 2 }),
        makeRollPhoto({ photo_id: 'p3', position: 3 }),
      ]);

      useRollStore.getState().removeFromRoll('p2');
      const photos = useRollStore.getState().rollPhotos;
      expect(photos).toHaveLength(2);
      expect(photos.map((p) => p.position)).toEqual([1, 2]);
      expect(useRollStore.getState().checkedPhotoIds.has('p2')).toBe(false);
    });
  });

  describe('resetRoll', () => {
    it('clears all roll state', () => {
      useRollStore.getState().checkPhoto('p1');
      useRollStore.getState().setFilmProfile('warmth');
      useRollStore.getState().setRoll({ id: 'r1' } as any);
      useRollStore.getState().resetRoll();

      const state = useRollStore.getState();
      expect(state.currentRoll).toBeNull();
      expect(state.checkedPhotoIds.size).toBe(0);
      expect(state.rollPhotos).toHaveLength(0);
      expect(state.rollCount).toBe(0);
      expect(state.filmProfile).toBeNull();
    });
  });

  describe('updateRollStatus', () => {
    it('updates matching roll in rolls array', () => {
      useRollStore.getState().setRolls([
        { id: 'r1', status: 'building' } as any,
        { id: 'r2', status: 'ready' } as any,
      ]);

      useRollStore.getState().updateRollStatus('r1', { status: 'ready' } as any);
      const r1 = useRollStore.getState().rolls.find((r) => r.id === 'r1');
      expect(r1?.status).toBe('ready');
    });

    it('updates currentRoll if it matches', () => {
      useRollStore.getState().setRoll({ id: 'r1', status: 'building' } as any);
      useRollStore.getState().updateRollStatus('r1', { status: 'developed' } as any);
      expect(useRollStore.getState().currentRoll?.status).toBe('developed');
    });

    it('does not update currentRoll if it does not match', () => {
      useRollStore.getState().setRoll({ id: 'r1', status: 'building' } as any);
      useRollStore.getState().updateRollStatus('r2', { status: 'developed' } as any);
      expect(useRollStore.getState().currentRoll?.status).toBe('building');
    });
  });

  describe('setFilmProfile', () => {
    it('sets the film profile', () => {
      useRollStore.getState().setFilmProfile('golden');
      expect(useRollStore.getState().filmProfile).toBe('golden');
    });

    it('clears the film profile with null', () => {
      useRollStore.getState().setFilmProfile('golden');
      useRollStore.getState().setFilmProfile(null);
      expect(useRollStore.getState().filmProfile).toBeNull();
    });
  });
});
