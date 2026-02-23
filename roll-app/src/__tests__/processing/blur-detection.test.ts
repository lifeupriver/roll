import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/processing/sharp', () => ({
  getLaplacianVariance: vi.fn(),
}));

import { detectBlur, isBlurry } from '@/lib/processing/blurDetection';
import { getLaplacianVariance } from '@/lib/processing/sharp';

describe('blurDetection', () => {
  describe('detectBlur', () => {
    it('returns the Laplacian variance from sharp', async () => {
      vi.mocked(getLaplacianVariance).mockResolvedValue(150);
      const result = await detectBlur(Buffer.from('test'));
      expect(result).toBe(150);
      expect(getLaplacianVariance).toHaveBeenCalledWith(Buffer.from('test'));
    });
  });

  describe('isBlurry', () => {
    it('returns true when variance is below default threshold (100)', () => {
      expect(isBlurry(50)).toBe(true);
      expect(isBlurry(99)).toBe(true);
    });

    it('returns false when variance is at or above default threshold', () => {
      expect(isBlurry(100)).toBe(false);
      expect(isBlurry(200)).toBe(false);
    });

    it('respects custom threshold', () => {
      expect(isBlurry(150, 200)).toBe(true);
      expect(isBlurry(250, 200)).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isBlurry(0)).toBe(true);
      expect(isBlurry(-1)).toBe(true);
    });
  });
});
