import type { Photo } from '@/types/photo';
import type { FilmProfileId } from '@/types/roll';

/**
 * Recommends a film profile based on the dominant scene content in a set of photos.
 * Uses scene_classification metadata from the photos table.
 * Returns both the recommended profile ID and a human-readable reason.
 */
export function recommendFilmProfile(photos: Photo[]): {
  profileId: FilmProfileId;
  reason: string;
} {
  const scenes = photos.flatMap((p) => p.scene_classification ?? []);

  if (scenes.length === 0) {
    return { profileId: 'warmth', reason: 'A warm, flattering look that works with any photo' };
  }

  const outdoorScenes = new Set([
    'landscape',
    'beach',
    'mountain',
    'park',
    'nature',
    'garden',
    'sunset',
    'sunrise',
    'sky',
  ]);
  const portraitScenes = new Set([
    'portrait',
    'selfie',
    'group',
    'family',
    'baby',
    'child',
    'wedding',
  ]);
  const highContrastScenes = new Set([
    'night',
    'concert',
    'urban',
    'street',
    'architecture',
    'city',
  ]);
  const vibrantScenes = new Set(['food', 'flower', 'market', 'festival', 'party', 'travel']);

  let outdoor = 0;
  let portrait = 0;
  let highContrast = 0;
  let vibrant = 0;

  for (const scene of scenes) {
    const lower = scene.toLowerCase();
    if (outdoorScenes.has(lower)) outdoor++;
    if (portraitScenes.has(lower)) portrait++;
    if (highContrastScenes.has(lower)) highContrast++;
    if (vibrantScenes.has(lower)) vibrant++;
  }

  const total = scenes.length;
  const outdoorPct = outdoor / total;
  const portraitPct = portrait / total;
  const highContrastPct = highContrast / total;
  const vibrantPct = vibrant / total;

  // Decision logic — pick dominant mood
  if (outdoorPct > 0.4 && outdoorPct >= portraitPct) {
    return {
      profileId: 'golden',
      reason: 'Lots of outdoor and nature shots — Golden brings out the warmth',
    };
  }

  if (vibrantPct > 0.3) {
    return { profileId: 'vivid', reason: 'Colorful subjects — Vivid makes them pop' };
  }

  if (highContrastPct > 0.3) {
    return {
      profileId: 'classic',
      reason: 'Urban and high-contrast scenes — Classic B&W adds drama',
    };
  }

  if (portraitPct > 0.3) {
    return { profileId: 'warmth', reason: 'Mostly people photos — Warmth is soft and flattering' };
  }

  // Default: warmth is the safest all-around choice
  return { profileId: 'warmth', reason: 'A warm, flattering look that works with any photo' };
}
