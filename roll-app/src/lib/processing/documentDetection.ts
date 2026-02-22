import sharp from 'sharp';
import { DOCUMENT_TEXT_RATIO_THRESHOLD } from '@/lib/utils/constants';

export async function detectTextRegions(imageBuffer: Buffer): Promise<number> {
  // Simple approach: detect high-contrast regions that indicate text
  // Convert to grayscale, apply edge detection, measure ratio of high-contrast pixels
  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .resize(256, 256, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  let highContrastPixels = 0;
  let totalComparisons = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = y * width + x;
      const diff = Math.abs(data[idx] - data[idx + 1]);
      if (diff > 100) {
        highContrastPixels++;
      }
      totalComparisons++;
    }
  }

  return totalComparisons > 0 ? highContrastPixels / totalComparisons : 0;
}

export function isDocument(textRegionRatio: number): boolean {
  return textRegionRatio > DOCUMENT_TEXT_RATIO_THRESHOLD;
}
