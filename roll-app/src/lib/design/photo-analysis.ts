// Smart Design System — Photo Analysis
// Understands each photo's characteristics to make intelligent layout decisions.

// ─── Aspect Ratio Classification ──────────────────────────────────────────────
// Photos are classified by their shape so layouts can match slots to content.

export type AspectRatioClass =
  | 'panoramic'    // Ultra-wide: 2.0+ (e.g., 16:7, pano shots)
  | 'wide'         // Wide landscape: 1.5–2.0 (e.g., 16:9, 3:2)
  | 'landscape'    // Standard landscape: 1.15–1.5 (e.g., 4:3)
  | 'square'       // Near-square: 0.85–1.15 (e.g., 1:1)
  | 'portrait'     // Standard portrait: 0.6–0.85 (e.g., 3:4, 2:3)
  | 'tall';        // Ultra-tall: <0.6 (e.g., 9:16 phone screenshots)

export function classifyAspectRatio(width: number, height: number): AspectRatioClass {
  if (width <= 0 || height <= 0) return 'square';
  const ratio = width / height;
  if (ratio >= 2.0) return 'panoramic';
  if (ratio >= 1.5) return 'wide';
  if (ratio >= 1.15) return 'landscape';
  if (ratio >= 0.85) return 'square';
  if (ratio >= 0.6) return 'portrait';
  return 'tall';
}

export function getAspectRatio(width: number, height: number): number {
  if (height <= 0) return 1;
  return width / height;
}

/**
 * Whether two photos have compatible aspect ratios for pairing on the same page.
 * Photos with wildly different ratios look awkward side-by-side.
 */
export function areAspectRatiosCompatible(
  a: { width: number; height: number },
  b: { width: number; height: number }
): boolean {
  const ratioA = getAspectRatio(a.width, a.height);
  const ratioB = getAspectRatio(b.width, b.height);
  const diff = Math.abs(ratioA - ratioB);
  // Allow up to 0.4 difference (e.g., 4:3 and 3:2 can pair, but 16:9 and 9:16 cannot)
  return diff < 0.4;
}

// ─── Orientation ──────────────────────────────────────────────────────────────

export type Orientation = 'portrait' | 'landscape' | 'square';

export function getOrientation(width: number, height: number): Orientation {
  const ratio = width / height;
  if (ratio >= 1.15) return 'landscape';
  if (ratio <= 0.85) return 'portrait';
  return 'square';
}

// ─── Visual Weight ────────────────────────────────────────────────────────────
// A photo's "visual weight" determines how prominently it should be displayed.
// High-weight photos deserve full-page or hero treatment.
// Low-weight photos work well as supporting images in multi-photo layouts.

export interface PhotoMetrics {
  width: number;
  height: number;
  aesthetic_score?: number | null;
  face_count?: number | null;
  scene_classification?: string[];
  caption?: string | null;
  media_type?: 'photo' | 'video';
}

export interface VisualWeightResult {
  score: number;           // 0–10 composite score
  isHeroCandidate: boolean; // Score >= 7 — deserves full-page treatment
  isCoverCandidate: boolean; // Score >= 8 — could be a cover photo
  hasStrongCaption: boolean; // Caption is rich enough for a caption-spread
  aspectClass: AspectRatioClass;
  orientation: Orientation;
}

/**
 * Calculate the visual weight of a photo.
 * This determines how much visual real estate it should get in a layout.
 */
export function calculateVisualWeight(photo: PhotoMetrics): VisualWeightResult {
  let score = 0;
  const aspectClass = classifyAspectRatio(photo.width, photo.height);
  const orientation = getOrientation(photo.width, photo.height);

  // Aesthetic score contributes 0–5 points (the biggest factor)
  const aesthetic = photo.aesthetic_score ?? 50;
  score += (aesthetic / 100) * 5;

  // Faces add interest — people photos draw the eye
  const faces = photo.face_count ?? 0;
  if (faces === 1) score += 1.5;       // Single subject — strong
  else if (faces === 2) score += 1.2;   // Couple — still strong
  else if (faces >= 3) score += 0.8;    // Group — interesting but busy

  // Orientation bonus — portraits are striking full-page
  if (orientation === 'portrait') score += 0.8;
  else if (orientation === 'landscape') score += 0.5;

  // Panoramic and very wide shots are special — they need dedicated layouts
  if (aspectClass === 'panoramic') score += 0.5;

  // Scene classification bonuses
  const scenes = photo.scene_classification ?? [];
  if (scenes.includes('landscape') || scenes.includes('sky')) score += 0.5;

  // Cap at 10
  score = Math.min(10, Math.max(0, score));

  // Caption analysis
  const captionLength = (photo.caption ?? '').length;
  const hasStrongCaption = captionLength > 80;

  return {
    score,
    isHeroCandidate: score >= 7,
    isCoverCandidate: score >= 8,
    hasStrongCaption,
    aspectClass,
    orientation,
  };
}

// ─── Photo Set Analysis ───────────────────────────────────────────────────────
// Analyze an entire set of photos to understand the collection's character.
// This informs global layout decisions (e.g., if all photos are portraits,
// use layouts optimized for portrait content).

export interface PhotoSetAnalysis {
  totalCount: number;
  orientationMix: {
    portrait: number;
    landscape: number;
    square: number;
  };
  dominantOrientation: Orientation;
  aspectRatioMix: Record<AspectRatioClass, number>;
  averageWeight: number;
  heroCount: number;           // Photos scoring >= 7
  coverCandidates: number;     // Photos scoring >= 8
  hasPanoramic: boolean;
  captionDensity: number;      // 0–1, what fraction of photos have captions
  medianAspectRatio: number;
}

export function analyzePhotoSet(photos: PhotoMetrics[]): PhotoSetAnalysis {
  if (photos.length === 0) {
    return {
      totalCount: 0,
      orientationMix: { portrait: 0, landscape: 0, square: 0 },
      dominantOrientation: 'landscape',
      aspectRatioMix: { panoramic: 0, wide: 0, landscape: 0, square: 0, portrait: 0, tall: 0 },
      averageWeight: 0,
      heroCount: 0,
      coverCandidates: 0,
      hasPanoramic: false,
      captionDensity: 0,
      medianAspectRatio: 1,
    };
  }

  const orientationMix = { portrait: 0, landscape: 0, square: 0 };
  const aspectRatioMix: Record<AspectRatioClass, number> = {
    panoramic: 0, wide: 0, landscape: 0, square: 0, portrait: 0, tall: 0,
  };

  let totalWeight = 0;
  let heroCount = 0;
  let coverCandidates = 0;
  let captionCount = 0;
  const aspectRatios: number[] = [];

  for (const photo of photos) {
    const weight = calculateVisualWeight(photo);
    orientationMix[weight.orientation]++;
    aspectRatioMix[weight.aspectClass]++;
    totalWeight += weight.score;
    if (weight.isHeroCandidate) heroCount++;
    if (weight.isCoverCandidate) coverCandidates++;
    if (photo.caption && photo.caption.length > 0) captionCount++;
    aspectRatios.push(getAspectRatio(photo.width, photo.height));
  }

  // Find dominant orientation
  let dominantOrientation: Orientation = 'landscape';
  if (orientationMix.portrait > orientationMix.landscape && orientationMix.portrait > orientationMix.square) {
    dominantOrientation = 'portrait';
  } else if (orientationMix.square > orientationMix.landscape) {
    dominantOrientation = 'square';
  }

  // Median aspect ratio
  aspectRatios.sort((a, b) => a - b);
  const medianAspectRatio = aspectRatios[Math.floor(aspectRatios.length / 2)];

  return {
    totalCount: photos.length,
    orientationMix,
    dominantOrientation,
    aspectRatioMix,
    averageWeight: totalWeight / photos.length,
    heroCount,
    coverCandidates,
    hasPanoramic: aspectRatioMix.panoramic > 0,
    captionDensity: captionCount / photos.length,
    medianAspectRatio,
  };
}

// ─── Photo Grouping ───────────────────────────────────────────────────────────
// Group photos by compatibility for multi-photo pages.
// Photos are compatible if they have similar aspect ratios and orientations.

export interface PhotoGroup {
  photos: PhotoMetrics[];
  orientation: Orientation;
  averageAspectRatio: number;
}

/**
 * Group photos into orientation-compatible clusters.
 * Within each cluster, photos can be placed on the same page without
 * one looking awkwardly different from the others.
 */
export function groupByCompatibility(photos: PhotoMetrics[]): PhotoGroup[] {
  if (photos.length === 0) return [];

  const groups: PhotoGroup[] = [];
  const used = new Set<number>();

  for (let i = 0; i < photos.length; i++) {
    if (used.has(i)) continue;
    const group: PhotoMetrics[] = [photos[i]];
    used.add(i);

    const baseOrientation = getOrientation(photos[i].width, photos[i].height);

    // Find compatible neighbors
    for (let j = i + 1; j < photos.length && group.length < 4; j++) {
      if (used.has(j)) continue;
      const candidateOrientation = getOrientation(photos[j].width, photos[j].height);
      if (
        candidateOrientation === baseOrientation &&
        areAspectRatiosCompatible(photos[i], photos[j])
      ) {
        group.push(photos[j]);
        used.add(j);
      }
    }

    const avgRatio =
      group.reduce((sum, p) => sum + getAspectRatio(p.width, p.height), 0) / group.length;

    groups.push({
      photos: group,
      orientation: baseOrientation,
      averageAspectRatio: avgRatio,
    });
  }

  return groups;
}
