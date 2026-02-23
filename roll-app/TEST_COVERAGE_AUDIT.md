# Roll Application -- Test Coverage Audit

**Date:** 2026-02-23
**Scope:** `/home/user/roll/roll-app/` -- Next.js 16 App Router photo roll application
**Auditor:** Automated test strategy evaluation

---

## Executive Summary

The Roll application has **zero automated tests**. No test files, no test configuration, no test runner dependencies, and no CI test pipeline exist anywhere in the codebase. This represents a **Critical** risk for a production application that handles user authentication, payment processing, file uploads, image processing, and print fulfillment.

The codebase comprises **154 source files** including 30 API routes, 22+ components, 8 hooks, 8 Zustand stores, and a multi-stage image processing pipeline. Every code path -- from billing to security-critical webhook verification -- ships without any automated verification.

### Key Metrics

| Metric | Value |
|--------|-------|
| Total source files | 154 |
| Test files | **0** |
| Test configuration files | **0** |
| Test runner dependencies | **0** |
| Line coverage | **0%** |
| Branch coverage | **0%** |
| API routes without tests | **30/30** |
| Security-critical paths without tests | **6/6** |
| Known bugs without regression tests | **2** (`capturePhoto()` null return, perceptual hash pixel subset) |

---

## 1. Test Infrastructure Assessment

### 1.1 Current State: No Test Infrastructure Exists

**Severity: Critical**

Searched for and found nothing:

- `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx` -- **0 files**
- `__tests__/` directories -- **0 directories**
- `jest.config.*`, `vitest.config.*` -- **0 files**
- `cypress/`, `playwright*` -- **0 files/directories**
- `package.json` test-related dependencies -- **none** (no vitest, jest, testing-library, playwright, or cypress)
- `package.json` `"test"` script -- **missing**

The `devDependencies` in `/home/user/roll/roll-app/package.json` contain only:

```json
"devDependencies": {
  "@next/env": "^16.1.6",
  "eslint": "^9.39.3",
  "eslint-config-next": "^16.1.6"
}
```

### 1.2 Recommended Test Infrastructure Setup

Install Vitest (the modern standard for Next.js/Vite-compatible projects), React Testing Library for component tests, and MSW for API mocking:

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw
```

Create `vitest.config.ts` at project root:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/types/**',
        'src/**/*.d.ts',
        'src/test/**',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

Add scripts to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui"
}
```

---

## 2. Security-Critical Test Gaps

### 2.1 Open Redirect in Photo Serve Endpoint

**Severity: Critical**
**File:** `/home/user/roll/roll-app/src/app/api/photos/serve/route.ts`

The endpoint accepts a `key` query parameter and redirects to it if it starts with `http://` or `https://`. There is **no validation** that the URL points to an allowed domain. An attacker can craft `?key=https://evil.com/phishing` and the application will issue a 307 redirect.

```ts
// VULNERABLE CODE (lines 13-15):
if (key.startsWith('http://') || key.startsWith('https://')) {
  return NextResponse.redirect(key);
}
```

**Required tests:**

```ts
// src/app/api/photos/serve/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/photos/serve', () => {
  beforeEach(() => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://photos.roll.photos');
  });

  it('rejects requests without a key parameter', async () => {
    const req = new NextRequest('http://localhost/api/photos/serve');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('redirects to R2 URL for valid storage keys', async () => {
    const req = new NextRequest(
      'http://localhost/api/photos/serve?key=originals/user123/photo.jpg'
    );
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://photos.roll.photos/originals/user123/photo.jpg'
    );
  });

  it('MUST reject redirect to arbitrary external URLs (open redirect)', async () => {
    const maliciousUrls = [
      'https://evil.com/phishing',
      'https://attacker.example.com',
      'http://malware.site/payload',
      'https://evil.com/https://photos.roll.photos/safe',
    ];

    for (const url of maliciousUrls) {
      const req = new NextRequest(
        `http://localhost/api/photos/serve?key=${encodeURIComponent(url)}`
      );
      const res = await GET(req);
      // Should NOT redirect to external domains
      expect(res.status).not.toBe(307);
    }
  });

  it('rejects keys with path traversal attempts', async () => {
    const req = new NextRequest(
      'http://localhost/api/photos/serve?key=../../../etc/passwd'
    );
    const res = await GET(req);
    const location = res.headers.get('location') ?? '';
    expect(location).not.toContain('..');
  });
});
```

### 2.2 Seed Endpoint Exposed in Production

**Severity: Critical**
**File:** `/home/user/roll/roll-app/src/app/api/seed/route.ts`

The seed endpoint uses a **service role client** (`SUPABASE_SERVICE_ROLE_KEY`) to bypass Row Level Security and can insert arbitrary data, update profiles to `tier: 'plus'`, and delete all user data. There is **no environment check** to restrict it to development/staging.

```ts
// VULNERABLE: No environment guard (line 121+)
export async function POST() {
  // ... uses createClient(serviceUrl, serviceKey) to bypass RLS
  // Sets tier to 'plus', creates fake profiles, etc.
}
```

**Required tests:**

```ts
// src/app/api/seed/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/seed', () => {
  it('must be disabled in production environment', () => {
    // This test verifies the existence of an environment guard
    // If this test fails, the seed endpoint is exposed in production
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');

    // The route should either:
    // 1. Return 404/403 in production, OR
    // 2. Not be registered as a route in production builds
    // Current code does NEITHER -- this test documents the gap
    expect(process.env.NODE_ENV).toBe('production');
    // TODO: After fixing, uncomment:
    // const res = await POST();
    // expect(res.status).toBe(403);
  });

  it('must not bypass RLS without environment verification', async () => {
    // Verify that SUPABASE_SERVICE_ROLE_KEY usage is gated
    // Current code: always uses service role -- FAIL
  });
});
```

### 2.3 XSS in Email Templates via Unsanitized User Input

**Severity: High**
**File:** `/home/user/roll/roll-app/src/lib/email/templates.ts`

All email template functions interpolate parameters directly into HTML without escaping. The `inviterName` (from `display_name`), `rollName`, `circleName`, `url`, and `trackingUrl` parameters are all user-controllable and injected raw:

```ts
// Line 91 - rollName injected without escaping:
<strong>${rollName}</strong> has been developed...

// Line 43 - url injected into href without validation:
<a href="${url}" target="_blank" ...>

// Line 142 - inviterName injected without escaping:
${inviterName} thinks you&rsquo;ll love Roll

// Line 128 - trackingUrl injected into href:
${ctaButton('Track shipment', trackingUrl)}
```

**Required tests:**

```ts
// src/lib/email/__tests__/templates.test.ts
import { describe, it, expect } from 'vitest';
import {
  rollDevelopedEmail,
  referralInviteEmail,
  circleInviteEmail,
  printShippedEmail,
  magicLinkEmail,
} from '../templates';

describe('Email template XSS prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "'; DROP TABLE profiles; --",
    '<a href="javascript:alert(1)">click</a>',
    '{{constructor.constructor("return this")()}}',
  ];

  it('rollDevelopedEmail escapes rollName', () => {
    for (const payload of xssPayloads) {
      const { html } = rollDevelopedEmail(payload, 'warmth', 10, []);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('onerror=');
      expect(html).not.toContain('javascript:');
    }
  });

  it('rollDevelopedEmail escapes filmProfile', () => {
    const { html } = rollDevelopedEmail(
      'My Roll',
      '<script>alert(1)</script>',
      10,
      []
    );
    expect(html).not.toContain('<script>alert');
  });

  it('rollDevelopedEmail escapes previewUrls to prevent src injection', () => {
    const maliciousUrls = ['javascript:alert(1)', '" onerror="alert(1)'];
    const { html } = rollDevelopedEmail('Roll', 'warmth', 2, maliciousUrls);
    expect(html).not.toContain('javascript:alert');
    expect(html).not.toContain('onerror="alert');
  });

  it('referralInviteEmail escapes inviterName', () => {
    for (const payload of xssPayloads) {
      const { html } = referralInviteEmail(payload, 'https://roll.photos/signup');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('onerror=');
    }
  });

  it('circleInviteEmail escapes inviterName and circleName', () => {
    const { html } = circleInviteEmail(
      '<script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      'https://roll.photos/circle/join/abc'
    );
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('onerror=alert');
  });

  it('printShippedEmail escapes trackingUrl to prevent href injection', () => {
    const { html } = printShippedEmail(
      'My Roll',
      'javascript:alert(document.cookie)',
      'Feb 28, 2026'
    );
    expect(html).not.toContain('javascript:alert');
  });

  it('magicLinkEmail validates URL is HTTPS', () => {
    const { html } = magicLinkEmail('javascript:alert(1)');
    // Should reject or encode non-HTTPS URLs
    expect(html).not.toContain('href="javascript:');
  });

  it('email subject lines escape user input', () => {
    const { subject } = rollDevelopedEmail(
      '<script>alert(1)</script>',
      'warmth',
      10,
      []
    );
    expect(subject).not.toContain('<script>');
  });
});
```

### 2.4 Client-Controllable Pricing in Print Checkout

**Severity: Critical**
**File:** `/home/user/roll/roll-app/src/app/api/billing/print-checkout/route.ts`

The print checkout endpoint accepts `photoCount` and `printSize` from the client request body and uses them to calculate the price. An attacker can send `photoCount: 0` to get prints for only the shipping cost, or manipulate `printSize` to get cheaper pricing.

```ts
// Lines 23-33 - Client controls pricing inputs:
const { orderId, photoCount, printSize, isFreeFirstRoll } = await request.json();

if (isFreeFirstRoll) {
  return NextResponse.json({ error: 'Free orders do not require payment' }, { status: 400 });
}

const pricePerPrint = printSize === '5x7' ? 75 : 30;
const subtotal = photoCount * pricePerPrint;  // photoCount from client!
const shipping = 499;
const total = subtotal + shipping;
```

**Required tests:**

```ts
// src/app/api/billing/print-checkout/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
  getOrCreateCustomer: vi.fn(),
}));

describe('POST /api/billing/print-checkout', () => {
  it('must validate photoCount against actual order record', async () => {
    // An attacker sending photoCount: 0 should not result in
    // a Stripe session with total = shipping only ($4.99)
    // The server MUST look up the actual photo count from the DB
  });

  it('must reject negative photoCount', async () => {
    // photoCount: -10 would result in negative subtotal
  });

  it('must reject non-integer photoCount', async () => {
    // photoCount: 0.001 would result in near-zero pricing
  });

  it('must validate printSize against allowed values', async () => {
    // printSize: "4x6" should map to 30 cents
    // printSize: "unknown" should be rejected, not default to 30 cents
  });

  it('must validate orderId exists and belongs to user', async () => {
    // Prevent creating checkout sessions for other users' orders
  });

  it('must reject isFreeFirstRoll from client if not actually eligible', async () => {
    // Server should verify free-roll eligibility from DB, not trust client
  });

  it('must prevent price manipulation via printSize spoofing', async () => {
    // Verify that printSize is validated against the stored order's print_size
  });
});
```

### 2.5 Stripe Webhook Error Swallowing

**Severity: High**
**File:** `/home/user/roll/roll-app/src/app/api/webhooks/stripe/route.ts`

The outer catch block returns `{ received: true }` with a 200 status on any database error, causing Stripe to believe the webhook was processed successfully. If a subscription update fails to persist, the user's tier will be wrong and Stripe will never retry.

```ts
// Lines 83-86 - Error swallowed:
} catch (err) {
  console.error('Stripe webhook error:', err);
  return NextResponse.json({ received: true }); // 200 OK -- Stripe won't retry!
}
```

**Required tests:**

```ts
// src/app/api/webhooks/stripe/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock stripe and supabase
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
  STRIPE_CONFIG: { webhookSecret: 'whsec_test' },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { POST } from '../route';
import { getStripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    const stripe = getStripe();
    (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'invalid_sig' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('MUST return 500 (not 200) when database update fails', async () => {
    // Setup: valid webhook event for checkout.session.completed
    const stripe = getStripe();
    (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: 'user-123' },
          subscription: 'sub_123',
          customer: 'cus_123',
        },
      },
    });

    // Supabase update throws
    const mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => { throw new Error('DB connection failed'); }),
        })),
      })),
    };
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'stripe-signature': 'valid_sig' },
    });

    const res = await POST(req);
    // BUG: Currently returns 200 -- should return 500 so Stripe retries
    expect(res.status).toBe(500);
  });

  it('upgrades user tier on checkout.session.completed (subscription)', async () => {
    // Verify profile.tier is set to 'plus'
    // Verify stripe_subscription_id and stripe_customer_id are stored
  });

  it('downgrades user tier on customer.subscription.deleted', async () => {
    // Verify profile.tier is set to 'free'
    // Verify stripe_subscription_id is set to null
  });

  it('handles customer.subscription.updated status transitions', async () => {
    const statusToTier = [
      { stripeStatus: 'active', expectedTier: 'plus' },
      { stripeStatus: 'trialing', expectedTier: 'plus' },
      { stripeStatus: 'past_due', expectedTier: 'free' },
      { stripeStatus: 'canceled', expectedTier: 'free' },
      { stripeStatus: 'unpaid', expectedTier: 'free' },
    ];
    // Test each mapping
  });

  it('does not downgrade on invoice.payment_failed (Stripe retries)', async () => {
    // Verify no tier change on payment failure
  });

  it('handles unknown event types gracefully', async () => {
    // Should return 200 without processing
  });
});
```

### 2.6 Upload Storage Key Injection

**Severity: High**
**File:** `/home/user/roll/roll-app/src/app/api/upload/presign/route.ts`

While the presign route generates server-side UUIDs for storage keys (good), the `complete` route at `/home/user/roll/roll-app/src/app/api/upload/complete/route.ts` accepts `storageKey` directly from the client body (line 98) and uses it to fetch objects from R2 without validating it starts with the expected `originals/{userId}/` prefix.

```ts
// complete/route.ts line 98 -- storageKey from client:
storageKey: photo.storageKey,

// Line 79 -- used to fetch from R2 without validation:
const originalBuffer = await getObject(photo.storageKey);
```

**Required tests:**

```ts
// src/app/api/upload/complete/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/upload/complete', () => {
  it('rejects storageKey that does not match originals/{userId}/ prefix', async () => {
    // An attacker could read another user's files:
    // storageKey: "originals/other-user-id/secret-photo.jpg"
  });

  it('rejects storageKey with path traversal', async () => {
    // storageKey: "originals/user/../other-user/photo.jpg"
  });

  it('rejects storageKey pointing to system paths', async () => {
    // storageKey: "../../../etc/passwd"
  });

  it('validates storageKey was previously issued by presign endpoint', async () => {
    // Ideally, complete should verify the storageKey matches a pending upload
  });
});
```

---

## 3. Race Condition Test Gaps

### 3.1 Circle Join Race Condition (Member Count)

**Severity: High**
**File:** `/home/user/roll/roll-app/src/app/api/circles/join/[token]/route.ts`

The circle join endpoint reads `member_count`, increments it in application code, and writes it back. With two concurrent join requests, both could read the same count and only increment by 1 instead of 2.

```ts
// Lines 76-89 -- Classic read-modify-write race:
const { data: circle } = await supabase
  .from('circles')
  .select('member_count, name')
  .eq('id', invite.circle_id)
  .single();

await supabase
  .from('circles')
  .update({ member_count: circle.member_count + 1 })  // Race!
  .eq('id', invite.circle_id);
```

**Required tests:**

```ts
// src/app/api/circles/join/__tests__/race-condition.test.ts
import { describe, it, expect } from 'vitest';

describe('Circle join race condition', () => {
  it('correctly increments member_count under concurrent joins', async () => {
    // Simulate two concurrent join requests with different invite tokens
    // for the same circle. The final member_count should increment by 2.
    //
    // This test should use an RPC call like:
    // supabase.rpc('increment_member_count', { circle_id: id })
    // instead of read-modify-write
  });

  it('prevents duplicate membership from concurrent requests', async () => {
    // Two requests with the same user and different tokens for same circle
    // Only one should succeed; the other should get "already a member"
  });

  it('prevents double-consumption of the same invite token', async () => {
    // Two concurrent requests with the same token
    // Only one should succeed
  });
});
```

### 3.2 Roll Creation Race Condition (Rapid Clicks)

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/app/api/rolls/route.ts`

The roll creation POST endpoint has no idempotency mechanism. Rapid double-clicks create duplicate rolls.

**Required tests:**

```ts
// src/app/api/rolls/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/rolls', () => {
  it('prevents duplicate roll creation from rapid requests', async () => {
    // Two concurrent POST requests with the same name should not
    // create two rolls. Options:
    // 1. Idempotency key in request
    // 2. Unique constraint on (user_id, name, status='building')
    // 3. Client-side debounce (not testable server-side)
  });

  it('auto-generates roll name from current date', async () => {
    // Verify the "Month Day-Day" format
  });
});
```

---

## 4. Known Bug Regression Tests

### 4.1 `capturePhoto()` Always Returns Null

**Severity: High**
**File:** `/home/user/roll/roll-app/src/hooks/useCameraCapture.ts`

The `capturePhoto` function uses `canvas.toBlob()` which is asynchronous (callback-based), but the function returns `file` synchronously before the callback executes. The variable `file` is always `null` at the return statement.

```ts
// Lines 106-117:
let file: File | null = null;

canvas.toBlob((blob) => {
  if (!blob) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
  setCapturedPhotos((prev) => [...prev, file!]);
}, 'image/jpeg', 0.92);

return file; // Always null -- toBlob callback hasn't fired yet
```

**Required regression test:**

```ts
// src/hooks/__tests__/useCameraCapture.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraCapture } from '../useCameraCapture';

// Mock browser APIs
beforeEach(() => {
  // Mock canvas.toBlob to call callback synchronously in test
  HTMLCanvasElement.prototype.toBlob = vi.fn(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number
  ) {
    const blob = new Blob(['fake-image-data'], { type: type || 'image/jpeg' });
    // In the real browser, this is async. The bug is that the code
    // assumes it's sync.
    setTimeout(() => callback(blob), 0);
  });

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
});

describe('useCameraCapture', () => {
  it('capturePhoto must return a File (not null)', async () => {
    const { result } = renderHook(() => useCameraCapture());

    // Simulate active camera
    await act(async () => {
      // Would need to mock getUserMedia, but the key test:
    });

    // BUG: capturePhoto() currently returns null because toBlob is async
    // After fix, this should return a File or a Promise<File>
    // const photo = result.current.capturePhoto();
    // expect(photo).not.toBeNull();
    // expect(photo).toBeInstanceOf(File);
  });

  it('captured photos accumulate in capturedPhotos array', async () => {
    // After calling capturePhoto() multiple times,
    // capturedPhotos should contain all captured files
  });

  it('clearPhotos empties the captured photos array', () => {
    const { result } = renderHook(() => useCameraCapture());
    act(() => {
      result.current.clearPhotos();
    });
    expect(result.current.capturedPhotos).toHaveLength(0);
  });
});
```

### 4.2 Perceptual Hash Uses Wrong Pixel Subset

**Severity: High**
**File:** `/home/user/roll/roll-app/src/lib/processing/duplicateDetection.ts`

The perceptual hash resizes to 32x32 (1024 pixels) but only uses the first 64 pixels for the hash. This means the hash only represents the top-left ~6.25% of the image, making duplicate detection unreliable.

```ts
// Line 7 -- resizes to 32x32:
.resize(32, 32, { fit: 'fill' })

// Line 20 -- only uses first 64 pixels out of 1024:
for (let i = 0; i < 64; i++) {
  hash += data[i] > mean ? '1' : '0';
}
```

The standard approach is to resize to 8x8 (64 pixels) and use ALL pixels, or resize to 32x32 and apply a DCT (Discrete Cosine Transform) before extracting the top-left 8x8 frequency coefficients.

**Required regression test:**

```ts
// src/lib/processing/__tests__/duplicateDetection.test.ts
import { describe, it, expect } from 'vitest';
import { computePerceptualHash, hammingDistance, findDuplicates } from '../duplicateDetection';
import sharp from 'sharp';

describe('computePerceptualHash', () => {
  it('produces a 16-character hex hash (64 bits)', async () => {
    const buffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const hash = await computePerceptualHash(buffer);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('uses all image regions, not just top-left corner', async () => {
    // Create two images that differ ONLY in the bottom-right quadrant
    const baseBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    }).jpeg().toBuffer();

    // Image with different bottom-right (compose a white rectangle)
    const modifiedBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .composite([{
        input: await sharp({
          create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 0, b: 255 } },
        }).png().toBuffer(),
        left: 50,
        top: 50,
      }])
      .jpeg()
      .toBuffer();

    const hash1 = await computePerceptualHash(baseBuffer);
    const hash2 = await computePerceptualHash(modifiedBuffer);

    // BUG: Currently these produce identical hashes because only
    // the first 64 pixels (top-left) are used from a 32x32 image.
    // After fix, the hashes should differ.
    const distance = hammingDistance(hash1, hash2);
    expect(distance).toBeGreaterThan(0);
  });

  it('produces identical hashes for the same image at different sizes', async () => {
    const smallBuffer = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 100, g: 150, b: 200 } },
    }).jpeg().toBuffer();

    const largeBuffer = await sharp({
      create: { width: 500, height: 500, channels: 3, background: { r: 100, g: 150, b: 200 } },
    }).jpeg().toBuffer();

    const hash1 = await computePerceptualHash(smallBuffer);
    const hash2 = await computePerceptualHash(largeBuffer);
    expect(hammingDistance(hash1, hash2)).toBe(0);
  });
});

describe('hammingDistance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance('abcdef0123456789', 'abcdef0123456789')).toBe(0);
  });

  it('returns correct distance for hashes differing by one bit', () => {
    // '8' = 1000, '9' = 1001 -- differ by 1 bit
    expect(hammingDistance('8000000000000000', '9000000000000000')).toBe(1);
  });

  it('returns Infinity for different-length hashes', () => {
    expect(hammingDistance('abc', 'abcd')).toBe(Infinity);
  });

  it('returns 64 for completely opposite hashes', () => {
    expect(hammingDistance('0000000000000000', 'ffffffffffffffff')).toBe(64);
  });
});

describe('findDuplicates', () => {
  it('identifies duplicate photos and keeps the higher-scoring one', () => {
    const photos = [
      { id: 'a', phash: '0000000000000000', aesthetic_score: 0.8 },
      { id: 'b', phash: '0000000000000001', aesthetic_score: 0.6 }, // 1 bit different
      { id: 'c', phash: 'ffffffffffffffff', aesthetic_score: 0.9 }, // Very different
    ];

    const duplicates = findDuplicates(photos, 5);
    expect(duplicates.has('b')).toBe(true); // Lower score duplicate
    expect(duplicates.has('a')).toBe(false); // Higher score kept
    expect(duplicates.has('c')).toBe(false); // Not a duplicate
  });

  it('handles empty input', () => {
    const duplicates = findDuplicates([]);
    expect(duplicates.size).toBe(0);
  });

  it('handles single photo input', () => {
    const duplicates = findDuplicates([
      { id: 'a', phash: '0000000000000000', aesthetic_score: 0.5 },
    ]);
    expect(duplicates.size).toBe(0);
  });
});
```

---

## 5. Image Processing Pipeline Tests

### 5.1 Filter Pipeline Unit Tests

**Severity: High**
**File:** `/home/user/roll/roll-app/src/lib/processing/pipeline.ts`

The entire image processing pipeline -- blur detection, screenshot detection, exposure detection, document detection, face detection, scene classification, and aesthetic scoring -- has zero tests. These are pure computational functions that are highly testable.

**Required tests:**

```ts
// src/lib/processing/__tests__/screenshotDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectScreenshot } from '../screenshotDetection';

describe('detectScreenshot', () => {
  it('returns false when camera metadata is present', () => {
    expect(
      detectScreenshot(
        { width: 1170, height: 2532 },
        { cameraMake: 'Apple', cameraModel: 'iPhone 15' }
      )
    ).toBe(false);
  });

  it('detects 9:16 ratio without camera info as screenshot', () => {
    // iPhone SE-style: 750x1334 = 9:15.8 approximately
    expect(
      detectScreenshot({ width: 1080, height: 1920 }, { cameraMake: null, cameraModel: null })
    ).toBe(true);
  });

  it('detects 9:19.5 ratio (iPhone X+) without camera info as screenshot', () => {
    expect(
      detectScreenshot({ width: 1170, height: 2532 }, { cameraMake: null, cameraModel: null })
    ).toBe(true);
  });

  it('does not flag landscape photos as screenshots', () => {
    expect(
      detectScreenshot({ width: 4032, height: 3024 }, { cameraMake: null, cameraModel: null })
    ).toBe(false);
  });

  it('handles zero dimensions', () => {
    expect(
      detectScreenshot({ width: 0, height: 0 }, { cameraMake: null, cameraModel: null })
    ).toBe(false);
  });

  it('handles portrait orientation correctly', () => {
    // Portrait: width < height
    expect(
      detectScreenshot({ width: 1080, height: 1920 }, { cameraMake: null, cameraModel: null })
    ).toBe(true);
  });
});

// src/lib/processing/__tests__/exposureDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectExposure } from '../exposureDetection';

describe('detectExposure', () => {
  it('detects over-exposed images (mean > 230)', () => {
    const stats = { channels: [{ mean: 245, min: 200, max: 255, stdev: 10 }] };
    const result = detectExposure(stats);
    expect(result.isOverExposed).toBe(true);
    expect(result.isUnderExposed).toBe(false);
  });

  it('detects under-exposed images (mean < 25)', () => {
    const stats = { channels: [{ mean: 15, min: 0, max: 30, stdev: 5 }] };
    const result = detectExposure(stats);
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(true);
  });

  it('passes normally exposed images', () => {
    const stats = { channels: [{ mean: 128, min: 20, max: 240, stdev: 50 }] };
    const result = detectExposure(stats);
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(false);
  });

  it('handles boundary values exactly at thresholds', () => {
    // At exactly 230 (threshold)
    const overStats = { channels: [{ mean: 230, min: 0, max: 255, stdev: 10 }] };
    expect(detectExposure(overStats).isOverExposed).toBe(false); // > not >=

    const overStats2 = { channels: [{ mean: 231, min: 0, max: 255, stdev: 10 }] };
    expect(detectExposure(overStats2).isOverExposed).toBe(true);

    // At exactly 25 (threshold)
    const underStats = { channels: [{ mean: 25, min: 0, max: 50, stdev: 5 }] };
    expect(detectExposure(underStats).isUnderExposed).toBe(false); // < not <=

    const underStats2 = { channels: [{ mean: 24, min: 0, max: 50, stdev: 5 }] };
    expect(detectExposure(underStats2).isUnderExposed).toBe(true);
  });

  it('handles missing channel data gracefully', () => {
    const stats = { channels: [] };
    const result = detectExposure(stats);
    // Default mean is 128 -- should be neither over nor under exposed
    expect(result.isOverExposed).toBe(false);
    expect(result.isUnderExposed).toBe(false);
  });
});

// src/lib/processing/__tests__/blurDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectBlur, isBlurry } from '../blurDetection';

describe('isBlurry', () => {
  it('returns true when Laplacian variance is below threshold', () => {
    expect(isBlurry(50, 100)).toBe(true);
  });

  it('returns false when Laplacian variance is above threshold', () => {
    expect(isBlurry(150, 100)).toBe(false);
  });

  it('returns false when exactly at threshold', () => {
    expect(isBlurry(100, 100)).toBe(false); // Not strictly less than
  });

  it('uses default threshold of 100', () => {
    expect(isBlurry(99)).toBe(true);
    expect(isBlurry(100)).toBe(false);
  });
});

// src/lib/processing/__tests__/documentDetection.test.ts
import { describe, it, expect } from 'vitest';
import { isDocument } from '../documentDetection';

describe('isDocument', () => {
  it('returns true when text ratio exceeds threshold (0.4)', () => {
    expect(isDocument(0.5)).toBe(true);
  });

  it('returns false when text ratio is below threshold', () => {
    expect(isDocument(0.3)).toBe(false);
  });

  it('returns false at exactly the threshold', () => {
    expect(isDocument(0.4)).toBe(false); // > not >=
  });
});
```

### 5.2 Sharp Image Processing Functions

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/lib/processing/sharp.ts`

```ts
// src/lib/processing/__tests__/sharp.test.ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  createThumbnail,
  getImageDimensions,
  generateLqip,
  resizeImage,
  getLaplacianVariance,
  convertHeicToJpeg,
} from '../sharp';

describe('createThumbnail', () => {
  it('produces a WebP image no wider than 400px', async () => {
    const input = await sharp({
      create: { width: 4032, height: 3024, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const thumb = await createThumbnail(input);
    const meta = await sharp(thumb).metadata();

    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(400);
  });

  it('does not enlarge small images', async () => {
    const input = await sharp({
      create: { width: 200, height: 150, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const thumb = await createThumbnail(input);
    const meta = await sharp(thumb).metadata();
    expect(meta.width).toBe(200);
  });
});

describe('generateLqip', () => {
  it('produces a base64-encoded WebP data URI', async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const lqip = await generateLqip(input);
    expect(lqip).toMatch(/^data:image\/webp;base64,/);
  });

  it('produces a tiny image (under 1KB)', async () => {
    const input = await sharp({
      create: { width: 4032, height: 3024, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const lqip = await generateLqip(input);
    const base64Part = lqip.replace('data:image/webp;base64,', '');
    const bytes = Buffer.from(base64Part, 'base64').length;
    expect(bytes).toBeLessThan(1024);
  });
});

describe('resizeImage', () => {
  it('does not resize images already within bounds', async () => {
    const input = await sharp({
      create: { width: 500, height: 500, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const result = await resizeImage(input, 1000);
    // Should return original buffer (same reference)
    expect(result).toBe(input);
  });

  it('constrains large images to maxDimension', async () => {
    const input = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const result = await resizeImage(input, 1000);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBeLessThanOrEqual(1000);
    expect(meta.height).toBeLessThanOrEqual(1000);
  });
});

describe('getLaplacianVariance', () => {
  it('returns high variance for sharp/detailed images', async () => {
    // Create a checkerboard pattern (high edge content)
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
    expect(variance).toBeGreaterThan(100); // Not blurry
  });

  it('returns low variance for uniform/blurry images', async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const variance = await getLaplacianVariance(input);
    expect(variance).toBeLessThan(100); // Blurry
  });
});
```

---

## 6. Zustand Store Tests

### 6.1 Roll Store State Management

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/stores/rollStore.ts`

```ts
// src/stores/__tests__/rollStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useRollStore } from '../rollStore';

describe('rollStore', () => {
  beforeEach(() => {
    useRollStore.getState().resetRoll();
  });

  describe('checkPhoto / uncheckPhoto', () => {
    it('adds a photo to checkedPhotoIds', () => {
      useRollStore.getState().checkPhoto('photo-1');
      expect(useRollStore.getState().checkedPhotoIds.has('photo-1')).toBe(true);
      expect(useRollStore.getState().rollCount).toBe(1);
    });

    it('enforces maximum of 36 checked photos', () => {
      const store = useRollStore.getState();
      for (let i = 0; i < 40; i++) {
        store.checkPhoto(`photo-${i}`);
      }
      expect(useRollStore.getState().checkedPhotoIds.size).toBe(36);
      expect(useRollStore.getState().rollCount).toBe(36);
    });

    it('removes a photo from checkedPhotoIds', () => {
      useRollStore.getState().checkPhoto('photo-1');
      useRollStore.getState().uncheckPhoto('photo-1');
      expect(useRollStore.getState().checkedPhotoIds.has('photo-1')).toBe(false);
      expect(useRollStore.getState().rollCount).toBe(0);
    });

    it('unchecking a non-existent photo does not throw', () => {
      expect(() => useRollStore.getState().uncheckPhoto('nonexistent')).not.toThrow();
    });
  });

  describe('reorderPhotos', () => {
    it('moves a photo from one position to another', () => {
      useRollStore.getState().setRollPhotos([
        { id: 'rp-1', roll_id: 'r', photo_id: 'p1', position: 1 } as any,
        { id: 'rp-2', roll_id: 'r', photo_id: 'p2', position: 2 } as any,
        { id: 'rp-3', roll_id: 'r', photo_id: 'p3', position: 3 } as any,
      ]);

      useRollStore.getState().reorderPhotos(0, 2);
      const photos = useRollStore.getState().rollPhotos;
      expect(photos[0].photo_id).toBe('p2');
      expect(photos[1].photo_id).toBe('p3');
      expect(photos[2].photo_id).toBe('p1');
      // Positions should be renumbered 1-based
      expect(photos.map((p) => p.position)).toEqual([1, 2, 3]);
    });
  });

  describe('removeFromRoll', () => {
    it('removes photo and renumbers positions', () => {
      useRollStore.getState().checkPhoto('p2');
      useRollStore.getState().setRollPhotos([
        { id: 'rp-1', roll_id: 'r', photo_id: 'p1', position: 1 } as any,
        { id: 'rp-2', roll_id: 'r', photo_id: 'p2', position: 2 } as any,
        { id: 'rp-3', roll_id: 'r', photo_id: 'p3', position: 3 } as any,
      ]);

      useRollStore.getState().removeFromRoll('p2');
      const photos = useRollStore.getState().rollPhotos;
      expect(photos).toHaveLength(2);
      expect(photos.map((p) => p.position)).toEqual([1, 2]);
      expect(useRollStore.getState().checkedPhotoIds.has('p2')).toBe(false);
    });
  });

  describe('resetRoll', () => {
    it('clears all roll state', () => {
      useRollStore.getState().checkPhoto('p1');
      useRollStore.getState().setFilmProfile('warmth');
      useRollStore.getState().resetRoll();

      const state = useRollStore.getState();
      expect(state.currentRoll).toBeNull();
      expect(state.checkedPhotoIds.size).toBe(0);
      expect(state.rollPhotos).toHaveLength(0);
      expect(state.rollCount).toBe(0);
      expect(state.filmProfile).toBeNull();
    });
  });
});
```

### 6.2 Photo Store State Management

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/stores/photoStore.ts`

```ts
// src/stores/__tests__/photoStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoStore } from '../photoStore';

describe('photoStore', () => {
  beforeEach(() => {
    usePhotoStore.setState({
      photos: [],
      contentMode: 'all',
      selectedPhotoIds: new Set(),
      loading: false,
      error: null,
      cursor: null,
      hasMore: true,
    });
  });

  it('appendPhotos adds to existing photos', () => {
    usePhotoStore.getState().setPhotos([{ id: '1' } as any]);
    usePhotoStore.getState().appendPhotos([{ id: '2' } as any]);
    expect(usePhotoStore.getState().photos).toHaveLength(2);
  });

  it('setContentMode resets photos and pagination', () => {
    usePhotoStore.getState().setPhotos([{ id: '1' } as any]);
    usePhotoStore.getState().setCursor('cursor-1');
    usePhotoStore.getState().setHasMore(false);

    usePhotoStore.getState().setContentMode('favorites');

    expect(usePhotoStore.getState().photos).toHaveLength(0);
    expect(usePhotoStore.getState().cursor).toBeNull();
    expect(usePhotoStore.getState().hasMore).toBe(true);
  });

  it('togglePhotoSelection adds and removes', () => {
    usePhotoStore.getState().togglePhotoSelection('p1');
    expect(usePhotoStore.getState().selectedPhotoIds.has('p1')).toBe(true);

    usePhotoStore.getState().togglePhotoSelection('p1');
    expect(usePhotoStore.getState().selectedPhotoIds.has('p1')).toBe(false);
  });

  it('hidePhoto removes from photos array', () => {
    usePhotoStore.getState().setPhotos([
      { id: '1' } as any,
      { id: '2' } as any,
    ]);
    usePhotoStore.getState().hidePhoto('1');
    expect(usePhotoStore.getState().photos.map((p) => p.id)).toEqual(['2']);
  });

  it('recoverPhoto inserts in sorted order by created_at', () => {
    usePhotoStore.getState().setPhotos([
      { id: '1', created_at: '2026-01-03T00:00:00Z' } as any,
      { id: '3', created_at: '2026-01-01T00:00:00Z' } as any,
    ]);

    usePhotoStore.getState().recoverPhoto('2', {
      id: '2',
      created_at: '2026-01-02T00:00:00Z',
    } as any);

    expect(usePhotoStore.getState().photos.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
});
```

---

## 7. Webhook Handler Integration Tests

### 7.1 Prodigi Webhook Handler

**Severity: High**
**File:** `/home/user/roll/roll-app/src/app/api/webhooks/prodigi/route.ts`

```ts
// src/app/api/webhooks/prodigi/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/prodigi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/prodigi')>();
  return {
    ...original,
    verifyWebhookSignature: original.verifyWebhookSignature,
  };
});

describe('POST /api/webhooks/prodigi', () => {
  function signPayload(body: string): string {
    return createHmac('sha256', 'test-webhook-secret').update(body).digest('hex');
  }

  it('rejects requests without X-Prodigi-Signature header', async () => {
    // Should return 401
  });

  it('rejects requests with invalid signature', async () => {
    // Should return 401
  });

  it('updates order status to in_production on InProgress stage', async () => {
    const payload = {
      type: 'order.status.stage.changed',
      data: {
        order: {
          id: 'ord_test_123',
          status: { stage: 'InProgress' },
        },
      },
    };
    // Verify DB update sets status = 'in_production'
  });

  it('updates order status to shipped with tracking URL', async () => {
    const payload = {
      type: 'order.shipped',
      data: {
        order: {
          id: 'ord_test_123',
          shipments: [{
            tracking: { url: 'https://track.example.com/123' },
          }],
        },
      },
    };
    // Verify DB update sets status = 'shipped' and tracking_url
  });

  it('acknowledges unknown order IDs without error (idempotent)', async () => {
    // Unknown prodigi_order_id should return { received: true }
  });

  it('handles missing shipment tracking URL gracefully', async () => {
    const payload = {
      type: 'order.shipped',
      data: { order: { id: 'ord_test_123', shipments: [] } },
    };
    // Should set status to 'shipped' without tracking_url
  });
});
```

### 7.2 Prodigi Webhook Signature Verification

**Severity: High**
**File:** `/home/user/roll/roll-app/src/lib/prodigi.ts`

```ts
// src/lib/__tests__/prodigi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { verifyWebhookSignature } from '../prodigi';

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    vi.stubEnv('PRODIGI_WEBHOOK_SECRET', 'test-secret-key');
  });

  it('returns true for valid HMAC-SHA256 signature', () => {
    const { createHmac } = require('crypto');
    const body = '{"type":"order.shipped"}';
    const expectedSig = createHmac('sha256', 'test-secret-key')
      .update(body)
      .digest('hex');

    expect(verifyWebhookSignature(body, expectedSig)).toBe(true);
  });

  it('returns false for tampered body', () => {
    const { createHmac } = require('crypto');
    const originalBody = '{"type":"order.shipped"}';
    const sig = createHmac('sha256', 'test-secret-key')
      .update(originalBody)
      .digest('hex');

    expect(verifyWebhookSignature('{"type":"order.cancelled"}', sig)).toBe(false);
  });

  it('returns false for wrong signature', () => {
    expect(verifyWebhookSignature('body', 'wrong-signature')).toBe(false);
  });

  it('uses constant-time comparison (not vulnerable to timing attacks)', () => {
    // The implementation uses charCodeAt XOR comparison -- good
    // but verify different-length signatures are handled
    const { createHmac } = require('crypto');
    const body = 'test';
    const validSig = createHmac('sha256', 'test-secret-key').update(body).digest('hex');

    // Shorter signature should return false
    expect(verifyWebhookSignature(body, validSig.slice(0, 10))).toBe(false);
  });

  it('throws when PRODIGI_WEBHOOK_SECRET is not configured', () => {
    vi.stubEnv('PRODIGI_WEBHOOK_SECRET', '');
    // unstubEnv doesn't exist, so set to empty
    delete process.env.PRODIGI_WEBHOOK_SECRET;
    expect(() => verifyWebhookSignature('body', 'sig')).toThrow('PRODIGI_WEBHOOK_SECRET');
  });
});
```

---

## 8. API Route Authorization Tests

### 8.1 All Routes Must Verify Authentication

**Severity: High**

Every API route must reject unauthenticated requests with 401. This is a systematic gap.

```ts
// src/test/auth-guard.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase to return no user
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: { message: 'No session' } })),
    },
  })),
}));

const routeModules = [
  { path: '/api/rolls', module: () => import('@/app/api/rolls/route') },
  { path: '/api/photos/map', module: () => import('@/app/api/photos/map/route') },
  { path: '/api/favorites', module: () => import('@/app/api/favorites/route') },
  { path: '/api/circles', module: () => import('@/app/api/circles/route') },
  { path: '/api/upload/presign', module: () => import('@/app/api/upload/presign/route') },
  { path: '/api/upload/complete', module: () => import('@/app/api/upload/complete/route') },
  { path: '/api/billing/checkout', module: () => import('@/app/api/billing/checkout/route') },
  { path: '/api/billing/print-checkout', module: () => import('@/app/api/billing/print-checkout/route') },
  { path: '/api/orders', module: () => import('@/app/api/orders/route') },
  { path: '/api/referrals', module: () => import('@/app/api/referrals/route') },
  { path: '/api/people', module: () => import('@/app/api/people/route') },
  { path: '/api/memories', module: () => import('@/app/api/memories/route') },
  { path: '/api/search', module: () => import('@/app/api/search/route') },
  { path: '/api/collections', module: () => import('@/app/api/collections/route') },
  { path: '/api/year-in-review', module: () => import('@/app/api/year-in-review/route') },
];

describe('API route authentication guards', () => {
  for (const route of routeModules) {
    it(`${route.path} GET returns 401 without auth`, async () => {
      const mod = await route.module();
      if ('GET' in mod) {
        const res = await (mod.GET as Function)(new Request(`http://localhost${route.path}`));
        expect(res.status).toBe(401);
      }
    });

    it(`${route.path} POST returns 401 without auth`, async () => {
      const mod = await route.module();
      if ('POST' in mod) {
        const res = await (mod.POST as Function)(
          new Request(`http://localhost${route.path}`, {
            method: 'POST',
            body: '{}',
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(res.status).toBe(401);
      }
    });
  }
});
```

### 8.2 Roll Status Transition Validation

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/app/api/rolls/[id]/route.ts`

```ts
// src/app/api/rolls/[id]/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';

describe('Roll status transitions', () => {
  const VALID_TRANSITIONS = {
    building: ['ready'],
    ready: ['processing', 'building'],
    processing: ['developed', 'error'],
    developed: [],
    error: ['processing'],
  };

  it.each(Object.entries(VALID_TRANSITIONS))(
    'from %s only allows transitions to %s',
    (from, allowed) => {
      const allStatuses = ['building', 'ready', 'processing', 'developed', 'error'];
      const forbidden = allStatuses.filter((s) => !allowed.includes(s));

      // Each forbidden transition should return 400
      for (const to of forbidden) {
        // Mock: create roll with status=from, PATCH to status=to
        // Expect 400 "Invalid status transition"
      }
    }
  );

  it('rejects transition from developed to any status (terminal state)', () => {
    // developed -> anything should be rejected
  });
});
```

---

## 9. Middleware Tests

### 9.1 Authentication Middleware

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/middleware.ts`

```ts
// src/__tests__/middleware.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('middleware', () => {
  it('redirects unauthenticated users from protected routes to /login', () => {
    const protectedRoutes = [
      '/feed', '/library', '/circle', '/account', '/upload',
      '/onboarding', '/roll', '/year-in-review', '/collections',
      '/memories', '/search', '/map', '/seed',
    ];
    // Each should redirect to /login when no user session
  });

  it('redirects authenticated users from /login to /feed', () => {
    // When user is authenticated and visits /login, redirect to /feed
  });

  it('allows unauthenticated access to public routes', () => {
    // Landing page (/), static assets should pass through
  });

  it('excludes API routes from middleware processing', () => {
    // The matcher config excludes /api/*
    // Verify /api/webhooks/stripe is not intercepted
  });

  it('preserves Supabase auth cookies in response', () => {
    // Verify setAll callback properly forwards cookies
  });
});
```

---

## 10. Upload Flow Tests

### 10.1 Presign Endpoint Validation

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/app/api/upload/presign/route.ts`

```ts
// src/app/api/upload/presign/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/upload/presign', () => {
  it('rejects requests exceeding MAX_FILES_PER_UPLOAD (500)', async () => {
    const files = Array.from({ length: 501 }, (_, i) => ({
      filename: `photo_${i}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: 1024,
    }));
    // Should return 400
  });

  it('rejects files exceeding 50MB', async () => {
    // sizeBytes: 50 * 1024 * 1024 + 1 should be rejected
  });

  it('rejects unsupported content types', async () => {
    const unsupported = ['image/gif', 'image/svg+xml', 'application/pdf', 'text/plain'];
    for (const contentType of unsupported) {
      // Should return 400
    }
  });

  it('accepts all allowed content types', async () => {
    const allowed = ['image/jpeg', 'image/heic', 'image/heif', 'image/png', 'image/webp'];
    for (const contentType of allowed) {
      // Should return 200 with upload URLs
    }
  });

  it('generates server-side UUID storage keys (not client-supplied)', async () => {
    // Verify storageKey format: originals/{userId}/{uuid}.{ext}
    // The UUID should NOT come from client input
  });

  it('handles empty files array', async () => {
    // files: [] should return 400 or empty uploads
  });
});
```

### 10.2 Upload Batch Client Utility

**Severity: Medium**
**File:** `/home/user/roll/roll-app/src/lib/utils/uploadBatch.ts`

```ts
// src/lib/utils/__tests__/uploadBatch.test.ts
import { describe, it, expect, vi } from 'vitest';
import { uploadPhotos } from '../uploadBatch';

describe('uploadPhotos', () => {
  it('retries failed uploads up to 2 times', async () => {
    let attempts = 0;
    global.fetch = vi.fn()
      // First call: presign
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          uploads: [{ storageKey: 'key', uploadUrl: 'http://upload' }],
        }),
      })
      // PUT attempts: fail twice then succeed
      .mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true });
      });

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const results = await uploadPhotos([file]);
    expect(results[0].success).toBe(true);
  });

  it('reports progress callback correctly', async () => {
    const onProgress = vi.fn();
    // Mock fetch for presign + uploads
    // Verify onProgress called with (completed, total) for each file
  });

  it('handles partial failures gracefully', async () => {
    // 3 files: 2 succeed, 1 fails after retries
    // Results should have 2 success + 1 failure
  });

  it('limits concurrent uploads to 5', async () => {
    // With 10 files, verify only 5 uploads happen concurrently
  });
});
```

---

## 11. Performance Test Gaps

### 11.1 Image Processing Pipeline Performance

**Severity: High**
**File:** `/home/user/roll/roll-app/src/lib/processing/pipeline.ts`

The `runFilterPipeline` function processes photos synchronously within each batch of 5. With 500 photos, this is 100 batches. Each photo requires multiple Sharp operations (resize, grayscale, stats, etc.).

```ts
// src/lib/processing/__tests__/pipeline.perf.test.ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';

describe('Pipeline performance benchmarks', () => {
  it('filterPhoto processes a single 10MP image in under 2 seconds', async () => {
    // Create a realistic test image
    const buffer = await sharp({
      create: {
        width: 4032,
        height: 3024,
        channels: 3,
        background: { r: 128, g: 100, b: 80 },
      },
    }).jpeg({ quality: 85 }).toBuffer();

    const start = performance.now();
    // Would need to mock getObject to return the buffer
    // await filterPhoto({ id: 'test', storage_key: 'test', width: 4032, height: 3024, camera_make: null, camera_model: null });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });

  it('runFilterPipeline processes 36 photos in under 30 seconds (Vercel limit)', async () => {
    // 36 photos = 1 roll, which is the maximum
    // Must complete within Vercel's 30s function timeout
  });

  it('Laplacian variance computation scales linearly with image size', async () => {
    // Benchmark getLaplacianVariance at different image sizes
    // Ensure no exponential degradation
  });
});
```

### 11.2 Develop Route Timeout Risk

**Severity: High**
**File:** `/home/user/roll/roll-app/src/app/api/process/develop/route.ts`

The develop route processes photos sequentially with a 100ms delay each. For 36 photos, this is a minimum of 3.6 seconds just from delays, plus database operations. This runs in a single serverless function invocation.

```ts
// src/app/api/process/develop/__tests__/route.test.ts
describe('POST /api/process/develop', () => {
  it('completes processing of 36 photos within Vercel function timeout', async () => {
    // 36 photos * 100ms delay = 3.6s minimum
    // Plus DB operations for each photo
    // Must stay under 30s for Vercel Hobby, 60s for Pro
  });

  it('correctly handles partial failure mid-processing', async () => {
    // If photo 20 of 36 fails, the roll should be set to 'error' status
    // with a meaningful processing_error message
  });

  it('rejects development of a roll not in "ready" status', async () => {
    // Trying to develop a "building" or "developed" roll should fail
  });

  it('restricts free users to warmth profile only', async () => {
    // Free tier user requesting 'golden' should get 403
  });
});
```

---

## 12. Test Pyramid Recommendation

The application currently has **no tests at any level**. Here is the recommended priority order for building the test pyramid:

### Priority 1: Critical Security Tests (Week 1)

| Test Target | Type | Estimated Tests | Priority |
|------------|------|----------------|----------|
| Photo serve open redirect | Unit | 5 | P0 |
| Email template XSS | Unit | 12 | P0 |
| Print checkout pricing validation | Unit | 7 | P0 |
| Stripe webhook error handling | Integration | 8 | P0 |
| Seed endpoint environment guard | Unit | 3 | P0 |
| Upload storage key validation | Unit | 5 | P0 |

### Priority 2: Bug Regression Tests (Week 1)

| Test Target | Type | Estimated Tests | Priority |
|------------|------|----------------|----------|
| capturePhoto null return | Unit | 4 | P0 |
| Perceptual hash pixel subset | Unit | 5 | P0 |

### Priority 3: Core Business Logic (Week 2)

| Test Target | Type | Estimated Tests | Priority |
|------------|------|----------------|----------|
| Image processing pipeline | Unit | 25 | P1 |
| Roll status transitions | Unit | 10 | P1 |
| Zustand stores | Unit | 20 | P1 |
| Webhook handlers (Stripe, Prodigi) | Integration | 15 | P1 |
| Upload flow (presign + complete) | Integration | 12 | P1 |

### Priority 4: API Route Coverage (Week 3)

| Test Target | Type | Estimated Tests | Priority |
|------------|------|----------------|----------|
| Auth guards on all 30 routes | Unit | 60 | P2 |
| Circle join race condition | Integration | 5 | P2 |
| Roll creation idempotency | Integration | 3 | P2 |
| Billing routes | Integration | 10 | P2 |
| Middleware auth flow | Unit | 8 | P2 |

### Priority 5: Performance & E2E (Week 4+)

| Test Target | Type | Estimated Tests | Priority |
|------------|------|----------------|----------|
| Pipeline performance benchmarks | Performance | 5 | P3 |
| Upload flow load testing | Performance | 3 | P3 |
| Critical user journeys (upload -> develop -> print) | E2E (Playwright) | 5 | P3 |

### Target Ratios

- **Unit tests:** ~120 (60%)
- **Integration tests:** ~60 (30%)
- **E2E/Performance tests:** ~20 (10%)
- **Total:** ~200 tests
- **Target line coverage:** 60% initially, 80% at maturity

---

## 13. Summary of Findings by Severity

### Critical (5 findings)

1. **No test infrastructure exists** -- zero tests, zero config, zero CI integration
2. **Open redirect** in `/api/photos/serve` -- no URL domain validation
3. **Seed endpoint** exposed in production with service role key -- no environment guard
4. **Client-controllable pricing** in print checkout -- `photoCount` from request body
5. **Stripe webhook silently swallows errors** -- returns 200 on DB failures

### High (7 findings)

1. **XSS in email templates** -- all user input injected raw into HTML
2. **Upload storage key injection** -- `storageKey` accepted from client without validation
3. **Circle join race condition** -- read-modify-write on `member_count`
4. **`capturePhoto()` always returns null** -- async toBlob with sync return (known bug, no regression test)
5. **Perceptual hash wrong pixel subset** -- only 6.25% of image used (known bug, no regression test)
6. **Image processing pipeline untested** -- 6 detection modules, 0 tests
7. **Webhook handlers untested** -- Stripe and Prodigi event processing unverified

### Medium (5 findings)

1. **Zustand stores untested** -- 8 stores with state transition logic
2. **Roll status transition logic untested** -- state machine with 5 states
3. **Middleware auth flow untested** -- protected route enforcement
4. **Upload validation untested** -- file size, count, content type limits
5. **Roll creation has no idempotency** -- rapid clicks create duplicates

### Low (2 findings)

1. **Film profile configs untested** -- static configuration could have typos
2. **Utility functions untested** -- `uploadBatch.ts` retry/concurrency logic
