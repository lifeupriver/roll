import { getLaplacianVariance } from './sharp';

export async function detectBlur(imageBuffer: Buffer): Promise<number> {
  return getLaplacianVariance(imageBuffer);
}

export function isBlurry(laplacianVariance: number, threshold: number = 100): boolean {
  return laplacianVariance < threshold;
}
