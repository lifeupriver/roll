'use client';

import { useCallback } from 'react';
import { useRollStore } from '@/stores/rollStore';
import type { Roll, RollPhoto, FilmProfileId } from '@/types/roll';

const MAX_PHOTOS = 36;
const DEVELOP_POLL_INTERVAL_MS = 2000;

interface UseRollReturn {
  currentRoll: Roll | null;
  rolls: Roll[];
  checkedPhotoIds: Set<string>;
  rollCount: number;
  filmProfile: FilmProfileId | null;
  rollPhotos: RollPhoto[];

  loadRolls: () => Promise<void>;
  loadRoll: (rollId: string) => Promise<void>;
  checkPhoto: (photoId: string) => Promise<void>;
  uncheckPhoto: (photoId: string) => Promise<void>;
  isChecked: (photoId: string) => boolean;
  createRoll: (name?: string) => Promise<Roll>;
  developRoll: (rollId: string, filmProfileId: FilmProfileId) => Promise<void>;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  removeFromRoll: (photoId: string) => Promise<void>;
}

export function useRoll(): UseRollReturn {
  const {
    currentRoll,
    rolls,
    checkedPhotoIds,
    rollCount,
    filmProfile,
    rollPhotos,
    setRoll,
    setRolls,
    setRollPhotos,
    checkPhoto: storeCheckPhoto,
    uncheckPhoto: storeUncheckPhoto,
    isChecked,
    reorderPhotos: storeReorderPhotos,
    removeFromRoll: storeRemoveFromRoll,
    updateRollStatus,
  } = useRollStore();

  // ---------------------------------------------------------------------------
  // loadRolls - Fetch all rolls for the current user
  // ---------------------------------------------------------------------------
  const loadRolls = useCallback(async () => {
    const res = await fetch('/api/rolls');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Failed to load rolls');
    }
    const { data } = (await res.json()) as { data: Roll[] };
    setRolls(data);
  }, [setRolls]);

  // ---------------------------------------------------------------------------
  // loadRoll - Fetch a single roll with its photos
  // ---------------------------------------------------------------------------
  const loadRoll = useCallback(
    async (rollId: string) => {
      const res = await fetch(`/api/rolls/${rollId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to load roll');
      }
      const { data } = (await res.json()) as {
        data: { roll: Roll; photos: RollPhoto[] };
      };
      setRoll(data.roll);
      setRollPhotos(data.photos);

      // Rebuild the checked photo IDs set from the loaded photos
      for (const rp of data.photos) {
        storeCheckPhoto(rp.photo_id);
      }
    },
    [setRoll, setRollPhotos, storeCheckPhoto]
  );

  // ---------------------------------------------------------------------------
  // createRoll - Create a new roll, optionally with a custom name
  // ---------------------------------------------------------------------------
  const createRoll = useCallback(
    async (name?: string): Promise<Roll> => {
      const res = await fetch('/api/rolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to create roll');
      }
      const { data } = (await res.json()) as { data: Roll };
      setRoll(data);
      return data;
    },
    [setRoll]
  );

  // ---------------------------------------------------------------------------
  // checkPhoto - Add a photo to the current roll (optimistic)
  // ---------------------------------------------------------------------------
  const checkPhoto = useCallback(
    async (photoId: string) => {
      // Optimistic store update
      storeCheckPhoto(photoId);

      let roll = useRollStore.getState().currentRoll;

      // If there is no current roll yet, create one first
      if (!roll) {
        try {
          roll = await createRoll();
        } catch (err) {
          // Revert optimistic update on failure
          storeUncheckPhoto(photoId);
          throw err;
        }
      }

      try {
        const res = await fetch(`/api/rolls/${roll.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });

        if (!res.ok) {
          // Revert optimistic update
          storeUncheckPhoto(photoId);
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to add photo to roll');
        }

        const { data: rollPhoto, rollStatus } = (await res.json()) as {
          data: RollPhoto;
          rollStatus: string;
        };

        // Append to the local roll photos list
        const currentPhotos = useRollStore.getState().rollPhotos;
        setRollPhotos([...currentPhotos, rollPhoto]);

        // If the API reports the roll is now full / ready, update the store
        if (rollStatus && rollStatus !== roll.status) {
          updateRollStatus(roll.id, { status: rollStatus as Roll['status'] });
        }
      } catch (err) {
        // Only revert if we haven't already (re-thrown errors from above)
        if (useRollStore.getState().checkedPhotoIds.has(photoId)) {
          storeUncheckPhoto(photoId);
        }
        throw err;
      }
    },
    [createRoll, storeCheckPhoto, storeUncheckPhoto, setRollPhotos, updateRollStatus]
  );

  // ---------------------------------------------------------------------------
  // uncheckPhoto - Remove a photo from the current roll (optimistic)
  // ---------------------------------------------------------------------------
  const uncheckPhoto = useCallback(
    async (photoId: string) => {
      const roll = useRollStore.getState().currentRoll;
      if (!roll) return;

      // Optimistic store update
      storeUncheckPhoto(photoId);

      try {
        const res = await fetch(`/api/rolls/${roll.id}/photos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });

        if (!res.ok) {
          // Revert optimistic update
          storeCheckPhoto(photoId);
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to remove photo from roll');
        }

        // Remove from local roll photos
        const currentPhotos = useRollStore.getState().rollPhotos;
        setRollPhotos(
          currentPhotos
            .filter((p) => p.photo_id !== photoId)
            .map((p, i) => ({ ...p, position: i + 1 }))
        );

        // If the roll was ready and now has fewer than max, revert to building
        const updatedCount = useRollStore.getState().checkedPhotoIds.size;
        if (roll.status === 'ready' && updatedCount < MAX_PHOTOS) {
          updateRollStatus(roll.id, { status: 'building' });
        }
      } catch (err) {
        if (!useRollStore.getState().checkedPhotoIds.has(photoId)) {
          storeCheckPhoto(photoId);
        }
        throw err;
      }
    },
    [storeCheckPhoto, storeUncheckPhoto, setRollPhotos, updateRollStatus]
  );

  // ---------------------------------------------------------------------------
  // removeFromRoll - Remove a photo from the roll (optimistic, mirrors uncheck)
  // ---------------------------------------------------------------------------
  const removeFromRoll = useCallback(
    async (photoId: string) => {
      const roll = useRollStore.getState().currentRoll;
      if (!roll) return;

      // Optimistic store update (handles checkedPhotoIds + rollPhotos)
      storeRemoveFromRoll(photoId);

      try {
        const res = await fetch(`/api/rolls/${roll.id}/photos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });

        if (!res.ok) {
          // On failure we reload the roll to restore consistent state
          await loadRoll(roll.id);
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to remove photo from roll');
        }

        // If the roll was ready and now below max, revert status
        const updatedCount = useRollStore.getState().checkedPhotoIds.size;
        if (roll.status === 'ready' && updatedCount < MAX_PHOTOS) {
          updateRollStatus(roll.id, { status: 'building' });
        }
      } catch (err) {
        // Already handled above via loadRoll; re-throw for callers
        throw err;
      }
    },
    [storeRemoveFromRoll, loadRoll, updateRollStatus]
  );

  // ---------------------------------------------------------------------------
  // reorderPhotos - Reorder photos locally (store only, no API call here)
  // ---------------------------------------------------------------------------
  const reorderPhotos = useCallback(
    (fromIndex: number, toIndex: number) => {
      storeReorderPhotos(fromIndex, toIndex);
    },
    [storeReorderPhotos]
  );

  // ---------------------------------------------------------------------------
  // developRoll - Kick off development and poll until complete
  // ---------------------------------------------------------------------------
  const developRoll = useCallback(
    async (rollId: string, filmProfileId: FilmProfileId) => {
      // Start the develop process
      const res = await fetch('/api/process/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId, filmProfileId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to start development');
      }

      const { jobId } = (await res.json()) as { jobId: string };

      // Update local status to processing
      updateRollStatus(rollId, { status: 'processing', film_profile: filmProfileId });

      // Poll for completion
      await new Promise<void>((resolve, reject) => {
        const poll = async () => {
          try {
            const statusRes = await fetch(`/api/process/status/${jobId}`);
            if (!statusRes.ok) {
              const body = await statusRes.json().catch(() => ({}));
              throw new Error(body.error ?? 'Failed to check processing status');
            }

            const statusData = (await statusRes.json()) as {
              status: string;
              photosProcessed?: number;
              error?: string;
            };

            if (statusData.status === 'completed') {
              updateRollStatus(rollId, {
                status: 'developed',
                processing_completed_at: new Date().toISOString(),
                photos_processed: statusData.photosProcessed ?? 0,
              });
              resolve();
              return;
            }

            if (statusData.status === 'error') {
              updateRollStatus(rollId, {
                status: 'error',
                processing_error: statusData.error ?? 'Unknown processing error',
              });
              reject(new Error(statusData.error ?? 'Development failed'));
              return;
            }

            // Still processing -- update progress if available and poll again
            if (statusData.photosProcessed !== undefined) {
              updateRollStatus(rollId, {
                photos_processed: statusData.photosProcessed,
              });
            }

            setTimeout(poll, DEVELOP_POLL_INTERVAL_MS);
          } catch (err) {
            updateRollStatus(rollId, {
              status: 'error',
              processing_error: err instanceof Error ? err.message : 'Unknown error',
            });
            reject(err);
          }
        };

        poll();
      });
    },
    [updateRollStatus]
  );

  return {
    currentRoll,
    rolls,
    checkedPhotoIds,
    rollCount,
    filmProfile,
    rollPhotos,

    loadRolls,
    loadRoll,
    checkPhoto,
    uncheckPhoto,
    isChecked,
    createRoll,
    developRoll,
    reorderPhotos,
    removeFromRoll,
  };
}
