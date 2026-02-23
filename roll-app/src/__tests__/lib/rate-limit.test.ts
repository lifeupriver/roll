import { describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  const limiter = createRateLimiter('test', {
    maxRequests: 3,
    windowMs: 1000,
  });

  beforeEach(() => {
    limiter.clear();
  });

  it('allows requests within the limit', () => {
    expect(limiter.check('user-1')).toBeNull();
    expect(limiter.check('user-1')).toBeNull();
    expect(limiter.check('user-1')).toBeNull();
  });

  it('blocks requests exceeding the limit', () => {
    limiter.check('user-1');
    limiter.check('user-1');
    limiter.check('user-1');

    const result = limiter.check('user-1');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('includes Retry-After header', async () => {
    limiter.check('user-1');
    limiter.check('user-1');
    limiter.check('user-1');

    const result = limiter.check('user-1');
    expect(result!.headers.get('Retry-After')).toBeDefined();
  });

  it('tracks different keys independently', () => {
    limiter.check('user-1');
    limiter.check('user-1');
    limiter.check('user-1');

    // user-1 is blocked, but user-2 is not
    expect(limiter.check('user-1')).not.toBeNull();
    expect(limiter.check('user-2')).toBeNull();
  });

  it('reset clears a specific key', () => {
    limiter.check('user-1');
    limiter.check('user-1');
    limiter.check('user-1');

    limiter.reset('user-1');
    expect(limiter.check('user-1')).toBeNull();
  });

  it('returns 429 response body with error message', async () => {
    limiter.check('user-1');
    limiter.check('user-1');
    limiter.check('user-1');

    const result = limiter.check('user-1');
    const body = await result!.json();
    expect(body.error).toContain('Too many requests');
  });
});
