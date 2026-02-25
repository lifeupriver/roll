import type { Photo, PhotoStack } from '@/types/photo';

/**
 * Compute the Hamming distance between two hex-encoded perceptual hashes.
 * Returns a value between 0 (identical) and 1 (completely different).
 */
function hammingDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 1;

  let distance = 0;
  const totalBits = a.length * 4; // Each hex char = 4 bits

  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // Count bits in xor
    let bits = xor;
    while (bits) {
      distance += bits & 1;
      bits >>= 1;
    }
  }

  return distance / totalBits;
}

/**
 * Group photos into stacks based on perceptual hash similarity.
 *
 * @param photos - List of photos to group
 * @param sensitivity - 0 to 1. Higher = more aggressive grouping (larger threshold)
 * @returns Map from top photo ID → PhotoStack (only for photos that have stacks)
 */
export function computeStacks(photos: Photo[], sensitivity: number): Map<string, PhotoStack> {
  // Convert sensitivity (0.3–1.0) to a hamming distance threshold.
  // Low sensitivity (0.3) → threshold ~0.05 (only near-identical)
  // High sensitivity (1.0) → threshold ~0.25 (loosely similar)
  const threshold = 0.03 + (sensitivity - 0.3) * 0.3;

  // Only consider photos with a phash
  const hashable = photos.filter((p) => p.phash && p.media_type === 'photo');

  // Union-Find for grouping
  const parent = new Map<string, string>();
  for (const p of hashable) {
    parent.set(p.id, p.id);
  }

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    // Path compression
    let curr = id;
    while (curr !== root) {
      const next = parent.get(curr)!;
      parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Compare all pairs (O(n²) but n is typically small per page load)
  for (let i = 0; i < hashable.length; i++) {
    for (let j = i + 1; j < hashable.length; j++) {
      const dist = hammingDistance(hashable[i].phash!, hashable[j].phash!);
      if (dist <= threshold) {
        union(hashable[i].id, hashable[j].id);
      }
    }
  }

  // Group photos by root
  const groups = new Map<string, Photo[]>();
  for (const p of hashable) {
    const root = find(p.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(p);
  }

  // Build stacks (only groups with 2+ photos)
  const stacks = new Map<string, PhotoStack>();
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    // Pick the best photo by aesthetic score (highest wins)
    const sorted = [...group].sort(
      (a, b) => (b.aesthetic_score ?? 0) - (a.aesthetic_score ?? 0)
    );
    const topPhoto = sorted[0];

    const stack: PhotoStack = {
      id: `stack-${topPhoto.id}`,
      topPhoto,
      photos: sorted,
      similarity: 1 - (threshold / 2), // Approximate average similarity
    };

    stacks.set(topPhoto.id, stack);
    // Also map non-top photos to this stack's top photo for lookup
    for (const p of sorted.slice(1)) {
      stacks.set(p.id, stack);
    }
  }

  return stacks;
}

/**
 * Given a list of photos and a stack map, return a deduplicated list where
 * stacked photos are represented only by their top photo.
 * Returns { displayPhotos, stackMap } where stackMap maps topPhotoId → PhotoStack.
 */
export function applyStacks(
  photos: Photo[],
  sensitivity: number
): { displayPhotos: Photo[]; stackMap: Map<string, PhotoStack> } {
  const allStacks = computeStacks(photos, sensitivity);

  // Build a set of non-top photos that should be hidden
  const hiddenIds = new Set<string>();
  const topPhotoStacks = new Map<string, PhotoStack>();

  for (const [photoId, stack] of allStacks) {
    if (photoId === stack.topPhoto.id) {
      topPhotoStacks.set(photoId, stack);
    } else {
      hiddenIds.add(photoId);
    }
  }

  const displayPhotos = photos.filter((p) => !hiddenIds.has(p.id));

  return { displayPhotos, stackMap: topPhotoStacks };
}
