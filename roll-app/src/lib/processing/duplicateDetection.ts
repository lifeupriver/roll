import sharp from 'sharp';

export async function computePerceptualHash(imageBuffer: Buffer): Promise<string> {
  // Resize to 8x8 grayscale for DCT-based perceptual hash
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(32, 32, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Compute mean of pixel values
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;

  // Generate hash: 1 if pixel > mean, 0 otherwise
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += data[i] > mean ? '1' : '0';
  }

  // Convert binary string to hex
  let hexHash = '';
  for (let i = 0; i < hash.length; i += 4) {
    hexHash += parseInt(hash.substring(i, i + 4), 2).toString(16);
  }

  return hexHash;
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const bin1 = parseInt(hash1[i], 16).toString(2).padStart(4, '0');
    const bin2 = parseInt(hash2[i], 16).toString(2).padStart(4, '0');
    for (let j = 0; j < bin1.length; j++) {
      if (bin1[j] !== bin2[j]) distance++;
    }
  }
  return distance;
}

export function findDuplicates(
  photos: Array<{ id: string; phash: string; aesthetic_score: number }>,
  threshold: number = 5
): Set<string> {
  const duplicateIds = new Set<string>();

  for (let i = 0; i < photos.length; i++) {
    if (duplicateIds.has(photos[i].id)) continue;

    for (let j = i + 1; j < photos.length; j++) {
      if (duplicateIds.has(photos[j].id)) continue;

      const distance = hammingDistance(photos[i].phash, photos[j].phash);
      if (distance < threshold) {
        // Keep the one with higher aesthetic score
        if (photos[i].aesthetic_score >= photos[j].aesthetic_score) {
          duplicateIds.add(photos[j].id);
        } else {
          duplicateIds.add(photos[i].id);
        }
      }
    }
  }

  return duplicateIds;
}
