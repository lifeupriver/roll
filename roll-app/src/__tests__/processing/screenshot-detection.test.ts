import { describe, it, expect } from 'vitest';
import { detectScreenshot } from '@/lib/processing/screenshotDetection';

describe('detectScreenshot', () => {
  it('identifies iPhone screenshot dimensions (9:19.5 ratio)', () => {
    // iPhone 14 Pro: 1179 x 2556
    const result = detectScreenshot(
      { width: 1179, height: 2556 },
      { cameraMake: null, cameraModel: null }
    );
    expect(result).toBe(true);
  });

  it('identifies standard 16:9 screenshot dimensions', () => {
    // 1080x1920
    const result = detectScreenshot(
      { width: 1080, height: 1920 },
      { cameraMake: null, cameraModel: null }
    );
    expect(result).toBe(true);
  });

  it('returns false when camera EXIF data is present', () => {
    // Even with screenshot-like dimensions, EXIF camera data means it's a real photo
    const result = detectScreenshot(
      { width: 1080, height: 1920 },
      { cameraMake: 'Apple', cameraModel: 'iPhone 14' }
    );
    expect(result).toBe(false);
  });

  it('returns false for standard camera photo dimensions', () => {
    // 4032x3024 (typical iPhone photo, not screenshot ratio)
    const result = detectScreenshot(
      { width: 4032, height: 3024 },
      { cameraMake: null, cameraModel: null }
    );
    expect(result).toBe(false);
  });

  it('handles landscape-oriented screenshots', () => {
    // 1920x1080 landscape
    const result = detectScreenshot(
      { width: 1920, height: 1080 },
      { cameraMake: null, cameraModel: null }
    );
    expect(result).toBe(true);
  });

  it('returns false for square images', () => {
    const result = detectScreenshot(
      { width: 1000, height: 1000 },
      { cameraMake: null, cameraModel: null }
    );
    expect(result).toBe(false);
  });

  it('considers cameraMake alone as camera info', () => {
    const result = detectScreenshot(
      { width: 1080, height: 1920 },
      { cameraMake: 'Samsung', cameraModel: null }
    );
    expect(result).toBe(false);
  });

  it('considers cameraModel alone as camera info', () => {
    const result = detectScreenshot(
      { width: 1080, height: 1920 },
      { cameraMake: null, cameraModel: 'Galaxy S24' }
    );
    expect(result).toBe(false);
  });
});
