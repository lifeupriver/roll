import { describe, it, expect } from 'vitest';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_CONTENT_TYPES,
  THUMBNAIL_WIDTH,
  PHOTOS_PER_PAGE,
  MAX_ROLL_PHOTOS,
  MIN_ROLL_PHOTOS,
  BLUR_THRESHOLD,
  OVER_EXPOSURE_THRESHOLD,
  UNDER_EXPOSURE_THRESHOLD,
  DOCUMENT_TEXT_RATIO_THRESHOLD,
  DUPLICATE_PHASH_DISTANCE_THRESHOLD,
  SCREENSHOT_RATIOS,
} from '@/lib/utils/constants';

describe('Application constants', () => {
  describe('upload limits', () => {
    it('MAX_FILES_PER_UPLOAD is a reasonable positive number', () => {
      expect(MAX_FILES_PER_UPLOAD).toBeGreaterThan(0);
      expect(MAX_FILES_PER_UPLOAD).toBeLessThanOrEqual(1000);
    });

    it('MAX_FILE_SIZE_BYTES is 50MB', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
    });

    it('ALLOWED_CONTENT_TYPES includes standard image types', () => {
      expect(ALLOWED_CONTENT_TYPES).toContain('image/jpeg');
      expect(ALLOWED_CONTENT_TYPES).toContain('image/png');
      expect(ALLOWED_CONTENT_TYPES).toContain('image/webp');
      expect(ALLOWED_CONTENT_TYPES).toContain('image/heic');
    });

    it('ALLOWED_CONTENT_TYPES does not include non-image types', () => {
      expect(ALLOWED_CONTENT_TYPES).not.toContain('application/pdf');
      expect(ALLOWED_CONTENT_TYPES).not.toContain('text/plain');
      expect(ALLOWED_CONTENT_TYPES).not.toContain('image/gif');
    });
  });

  describe('roll limits', () => {
    it('MIN_ROLL_PHOTOS < MAX_ROLL_PHOTOS', () => {
      expect(MIN_ROLL_PHOTOS).toBeLessThan(MAX_ROLL_PHOTOS);
    });

    it('MIN_ROLL_PHOTOS is at least 1', () => {
      expect(MIN_ROLL_PHOTOS).toBeGreaterThanOrEqual(1);
    });

    it('MAX_ROLL_PHOTOS is 36 (standard roll)', () => {
      expect(MAX_ROLL_PHOTOS).toBe(36);
    });
  });

  describe('image processing thresholds', () => {
    it('BLUR_THRESHOLD is positive', () => {
      expect(BLUR_THRESHOLD).toBeGreaterThan(0);
    });

    it('exposure thresholds are in valid 0-255 range', () => {
      expect(OVER_EXPOSURE_THRESHOLD).toBeGreaterThan(200);
      expect(OVER_EXPOSURE_THRESHOLD).toBeLessThanOrEqual(255);
      expect(UNDER_EXPOSURE_THRESHOLD).toBeGreaterThanOrEqual(0);
      expect(UNDER_EXPOSURE_THRESHOLD).toBeLessThan(50);
    });

    it('DOCUMENT_TEXT_RATIO_THRESHOLD is between 0 and 1', () => {
      expect(DOCUMENT_TEXT_RATIO_THRESHOLD).toBeGreaterThan(0);
      expect(DOCUMENT_TEXT_RATIO_THRESHOLD).toBeLessThan(1);
    });

    it('DUPLICATE_PHASH_DISTANCE_THRESHOLD is a small positive integer', () => {
      expect(DUPLICATE_PHASH_DISTANCE_THRESHOLD).toBeGreaterThan(0);
      expect(DUPLICATE_PHASH_DISTANCE_THRESHOLD).toBeLessThanOrEqual(10);
    });
  });

  describe('screenshot detection ratios', () => {
    it('includes standard mobile screen ratios', () => {
      expect(SCREENSHOT_RATIOS.length).toBeGreaterThan(0);
      const ratios = SCREENSHOT_RATIOS.map((r) => `${r.w}:${r.h}`);
      expect(ratios).toContain('9:16');
    });

    it('all ratios have a tolerance value', () => {
      for (const ratio of SCREENSHOT_RATIOS) {
        expect(ratio.tolerance).toBeGreaterThan(0);
        expect(ratio.tolerance).toBeLessThan(1);
      }
    });
  });

  describe('display constants', () => {
    it('THUMBNAIL_WIDTH is 400', () => {
      expect(THUMBNAIL_WIDTH).toBe(400);
    });

    it('PHOTOS_PER_PAGE is 20', () => {
      expect(PHOTOS_PER_PAGE).toBe(20);
    });
  });
});
