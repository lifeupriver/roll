import { NextResponse } from 'next/server';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each instance tracks requests per unique key (typically user ID or IP)
 * within a rolling time window. Intended for serverless/Edge use where
 * cross-instance state is not required — enough to stop runaway clients.
 *
 * For production at scale, swap in a Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** Maximum requests allowed within the window. */
  maxRequests: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

export function createRateLimiter(name: string, config: RateLimitConfig) {
  const store = getStore(name);

  return {
    /**
     * Check if the given key has exceeded the rate limit.
     * Returns `null` if within limits, or a 429 NextResponse if exceeded.
     */
    check(key: string): NextResponse | null {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      // Remove expired timestamps
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

      if (entry.timestamps.length >= config.maxRequests) {
        const retryAfterMs = entry.timestamps[0] + config.windowMs - now;
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
            },
          }
        );
      }

      entry.timestamps.push(now);
      return null;
    },

    /** Reset a specific key — useful in tests. */
    reset(key: string) {
      store.delete(key);
    },

    /** Clear all entries — useful in tests. */
    clear() {
      store.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for sensitive endpoints
// ---------------------------------------------------------------------------

/** Auth-related: 10 requests per minute per IP/user */
export const authLimiter = createRateLimiter('auth', {
  maxRequests: 10,
  windowMs: 60_000,
});

/** Billing/checkout: 5 requests per minute per user */
export const billingLimiter = createRateLimiter('billing', {
  maxRequests: 5,
  windowMs: 60_000,
});

/** Upload presign: 20 requests per minute per user */
export const uploadLimiter = createRateLimiter('upload', {
  maxRequests: 20,
  windowMs: 60_000,
});

/** Order creation: 5 requests per minute per user */
export const orderLimiter = createRateLimiter('order', {
  maxRequests: 5,
  windowMs: 60_000,
});

/** Circle invites: 10 requests per minute per user */
export const inviteLimiter = createRateLimiter('invite', {
  maxRequests: 10,
  windowMs: 60_000,
});

/** General API: 60 requests per minute per user (for non-sensitive endpoints) */
export const generalLimiter = createRateLimiter('general', {
  maxRequests: 60,
  windowMs: 60_000,
});

/** Processing (develop/filter): 5 requests per hour per user */
export const processLimiter = createRateLimiter('process', {
  maxRequests: 5,
  windowMs: 3_600_000,
});
