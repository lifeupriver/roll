import { describe, it, expect, beforeEach } from 'vitest';
import { processLimiter, generalLimiter } from '@/lib/rate-limit';

describe('processLimiter', () => {
  beforeEach(() => {
    processLimiter.clear();
  });

  it('allows up to 5 requests per hour', () => {
    const userId = 'user-process-test';
    for (let i = 0; i < 5; i++) {
      expect(processLimiter.check(userId)).toBeNull();
    }
    const result = processLimiter.check(userId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});

describe('generalLimiter', () => {
  beforeEach(() => {
    generalLimiter.clear();
  });

  it('allows up to 60 requests per minute', () => {
    const userId = 'user-general-test';
    for (let i = 0; i < 60; i++) {
      expect(generalLimiter.check(userId)).toBeNull();
    }
    const result = generalLimiter.check(userId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});
