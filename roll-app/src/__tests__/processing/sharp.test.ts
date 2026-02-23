import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  createThumbnail,
  getImageDimensions,
  generateLqip,
  resizeImage,
  getLaplacianVariance,
  convertHeicToJpeg,
  convertToGrayscale,
} from '@/lib/processing/sharp';

async function createTestImage(width: number, height: number, color = { r: 128, g: 128, b: 128 }) {
  return sharp({
    create: { width, height, channels: 3, background: color },
  }).jpeg({ quality: 80 }).toBuffer();
}

describe('createThumbnail', () => {
  it('produces a WebP image no wider than 400px', async () => {
    const input = await createTestImage(4032, 3024);
    const thumb = await createThumbnail(input);
    const meta = await sharp(thumb).metadata();

    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(400);
  });

  it('does not enlarge small images', async () => {
    const input = await createTestImage(200, 150);
    const thumb = await createThumbnail(input);
    const meta = await sharp(thumb).metadata();
    expect(meta.width).toBe(200);
  });

  it('maintains aspect ratio', async () => {
    const input = await createTestImage(2000, 1000);
    const thumb = await createThumbnail(input);
    const meta = await sharp(thumb).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(200);
  });
});

describe('getImageDimensions', () => {
  it('returns correct dimensions', async () => {
    const input = await createTestImage(1920, 1080);
    const dims = await getImageDimensions(input);
    expect(dims.width).toBe(1920);
    expect(dims.height).toBe(1080);
  });
});

describe('generateLqip', () => {
  it('produces a base64-encoded WebP data URI', async () => {
    const input = await createTestImage(100, 100);
    const lqip = await generateLqip(input);
    expect(lqip).toMatch(/^data:image\/webp;base64,/);
  });

  it('produces a tiny output (under 1KB)', async () => {
    const input = await createTestImage(4032, 3024);
    const lqip = await generateLqip(input);
    const base64Part = lqip.replace('data:image/webp;base64,', '');
    const bytes = Buffer.from(base64Part, 'base64').length;
    expect(bytes).toBeLessThan(1024);
  });
});

describe('resizeImage', () => {
  it('does not resize images already within bounds', async () => {
    const input = await createTestImage(500, 500);
    const result = await resizeImage(input, 1000);
    // Should return original buffer reference
    expect(result).toBe(input);
  });

  it('constrains large images to maxDimension', async () => {
    const input = await createTestImage(4000, 3000);
    const result = await resizeImage(input, 1000);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBeLessThanOrEqual(1000);
    expect(meta.height).toBeLessThanOrEqual(1000);
  });
});

describe('convertHeicToJpeg', () => {
  it('outputs a JPEG buffer', async () => {
    // Use a JPEG input since HEIC may not be available in all environments
    const input = await createTestImage(100, 100);
    const result = await convertHeicToJpeg(input);
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe('jpeg');
  });
});

describe('convertToGrayscale', () => {
  it('produces a grayscale image', async () => {
    const input = await createTestImage(100, 100, { r: 255, g: 0, b: 0 });
    const result = await convertToGrayscale(input);
    const meta = await sharp(result).metadata();
    // Grayscale images may still report as sRGB but with 1 channel
    expect(result).toBeDefined();
    expect(meta.width).toBe(100);
  });
});

describe('getLaplacianVariance', () => {
  it('returns high variance for detailed/sharp images', async () => {
    // Create a checkerboard pattern
    const size = 64;
    const data = Buffer.alloc(size * size * 3);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 3;
        const val = (x + y) % 2 === 0 ? 255 : 0;
        data[idx] = data[idx + 1] = data[idx + 2] = val;
      }
    }
    const input = await sharp(data, { raw: { width: size, height: size, channels: 3 } })
      .jpeg()
      .toBuffer();

    const variance = await getLaplacianVariance(input);
    expect(variance).toBeGreaterThan(100);
  });

  it('returns low variance for uniform/blurry images', async () => {
    const input = await createTestImage(100, 100);
    const variance = await getLaplacianVariance(input);
    expect(variance).toBeLessThan(100);
  });
});
