import { SCREENSHOT_RATIOS } from '@/lib/utils/constants';

interface PhotoMetadata {
  width: number;
  height: number;
}

interface ExifData {
  cameraMake?: string | null;
  cameraModel?: string | null;
}

export function detectScreenshot(metadata: PhotoMetadata, exifData: ExifData): boolean {
  const hasCameraInfo = !!(exifData.cameraMake || exifData.cameraModel);
  if (hasCameraInfo) return false;

  const { width, height } = metadata;
  const portrait = width < height;
  const shortSide = portrait ? width : height;
  const longSide = portrait ? height : width;
  const ratio = shortSide / longSide;

  for (const sr of SCREENSHOT_RATIOS) {
    const expectedRatio = sr.w / sr.h;
    if (Math.abs(ratio - expectedRatio) < sr.tolerance) {
      return true;
    }
  }

  return false;
}
