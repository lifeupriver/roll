import { describe, it, expect } from 'vitest';
import { detectExposure } from '@/lib/processing/exposureDetection';

describe('detectExposure', () => {
  it('detects overexposed images (mean > 230)', () => {
    const result = detectExposure({
      channels: [{ mean: 240, min: 200, max: 255, stdev: 10 }],
    });
    expect(result.isOverExposed).toBe(true);
    expect(result.isUnderExposed).toBe(false);
  });

  it('detects underexposed images (mean < 25)', () => {
    const result = detectExposure({
      channels: [{ mean: 15, min: 0, max: 50, stdev: 10 }],
    });
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(true);
  });

  it('returns false for both when normally exposed', () => {
    const result = detectExposure({
      channels: [{ mean: 128, min: 20, max: 235, stdev: 40 }],
    });
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(false);
  });

  it('handles boundary values correctly', () => {
    // Exactly at the threshold — should NOT trigger
    const atOver = detectExposure({
      channels: [{ mean: 230, min: 0, max: 255, stdev: 10 }],
    });
    expect(atOver.isOverExposed).toBe(false);

    const atUnder = detectExposure({
      channels: [{ mean: 25, min: 0, max: 255, stdev: 10 }],
    });
    expect(atUnder.isUnderExposed).toBe(false);

    // Just past the threshold — should trigger
    const justOver = detectExposure({
      channels: [{ mean: 231, min: 0, max: 255, stdev: 10 }],
    });
    expect(justOver.isOverExposed).toBe(true);

    const justUnder = detectExposure({
      channels: [{ mean: 24, min: 0, max: 255, stdev: 10 }],
    });
    expect(justUnder.isUnderExposed).toBe(true);
  });

  it('defaults to 128 when channels are empty', () => {
    const result = detectExposure({ channels: [] });
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(false);
  });
});
