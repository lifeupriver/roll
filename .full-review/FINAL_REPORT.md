# Roll Application — Comprehensive Code Review

## Executive Summary

The Roll application is a Next.js 16 photo roll app with Supabase backend, Stripe billing, Cloudflare R2 storage, Prodigi print fulfillment, and Capacitor mobile support. The codebase spans **154 source files** across 30 API routes, 22 components, 8 hooks, 8 Zustand stores, and a 6-module image processing pipeline.

This review identified **162 total findings** across 4 review phases. After deduplication (many issues were flagged independently by multiple review passes), there are approximately **98 unique findings**.

### Severity Breakdown (Deduplicated)

| Severity | Count | Examples |
|----------|-------|---------|
| **Critical** | 21 | Open redirect, webhook data loss, production seed endpoint, zero tests |
| **High** | 28 | No input validation, IDOR on uploads, N+1 queries, no rate limiting |
| **Medium** | 32 | Missing error boundaries, no structured logging, a11y gaps |
| **Low** | 17 | Package placement, naming conventions, editor config |
| **Positive** | 8 | Clean route layout, ARIA usage, touch targets, reduced motion |

### The Three Headlines

1. **The application has zero automated tests.** No test files, no test runner, no CI. Every deployment ships completely unverified code across all 154 source files.

2. **Six critical security vulnerabilities exist.** Open redirect on unauthenticated endpoint, production seed endpoint with service role key, XSS in emails, client-controllable pricing, webhook error swallowing causing payment desync, and storage key injection (IDOR).

3. **The database migration is incomplete.** 6 tables referenced in code don't exist in the migration. 3 profile columns required for Stripe billing are missing. Features including push notifications, referrals, people/faces, photo tags, circle comments, and collections are completely non-functional.

### What's Done Well

- **P1.** Clean App Router layout architecture with proper route groups
- **P2.** Comprehensive security headers (HSTS, X-Frame-Options, etc.)
- **P3.** Middleware follows Supabase SSR best practices
- **P4.** Consistent file naming conventions across all 154 files
- **P5.** Good ARIA usage — 49 attributes across 19 files with proper roles
- **P6.** Touch targets meet WCAG AAA (44px minimum)
- **P7.** Comprehensive reduced motion support
- **P8.** Lock file committed for reproducible builds

---

## Top 20 Critical & High Findings (Deduplicated, Prioritized)

These findings are ordered by urgency — fix #1 first, then #2, etc.

### 1. Open Redirect on Unauthenticated `/api/photos/serve`
- **Severity:** Critical | **CWE-601**
- **File:** `src/app/api/photos/serve/route.ts:6-25`
- **References:** SEC-1, BP-32, STD-16, AR-6, TEST-2
- **Issue:** No authentication. Redirects to any URL starting with `http://`. Exploitable for phishing using the trusted `roll.photos` domain.
- **Fix:** Add auth check. Restrict redirects to R2 public URL domain via allowlist.

### 2. Stripe Webhook Swallows Errors — Payment Data Loss
- **Severity:** Critical | **CWE-755**
- **File:** `src/app/api/webhooks/stripe/route.ts:83-86`
- **References:** CQ-1, SEC-6, AR-11, STD-11, TEST-5
- **Issue:** Returns HTTP 200 `{ received: true }` on any error. Stripe considers events delivered and will never retry. If `checkout.session.completed` fails, user pays but never gets upgraded.
- **Fix:** Return HTTP 500 on processing failures. Add `captureError()`. Implement idempotency.

### 3. Seed Endpoint Exposed in Production
- **Severity:** Critical | **CWE-269**
- **File:** `src/app/api/seed/route.ts`
- **References:** CQ-4, SEC-2, AR-14, TEST-3
- **Issue:** Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass all RLS. Any authenticated user can POST to inject fake profiles or DELETE to wipe data. No environment guard.
- **Fix:** `if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not available' }, { status: 403 });`

### 4. XSS in Email Templates
- **Severity:** Critical | **CWE-79**
- **File:** `src/lib/email/templates.ts:43,59,86-91,143,171`
- **References:** CQ-32, SEC-3, TEST-6
- **Issue:** `inviterName`, `rollName`, `circleName`, `displayName` interpolated into HTML without escaping. Attacker can inject executable HTML into emails sent to other users.
- **Fix:** Create `escapeHtml()` utility. Apply to all user-provided values in templates.

### 5. Client-Controllable Pricing in Print Checkout
- **Severity:** Critical | **CWE-472**
- **File:** `src/app/api/billing/print-checkout/route.ts:23-33`
- **References:** CQ-14, SEC-5, TEST-4
- **Issue:** `photoCount` and `printSize` from request body directly determine Stripe checkout amount. Client can manipulate totals.
- **Fix:** Look up actual values from database order record server-side.

### 6. `new Function()` Eval + CSP `unsafe-eval`
- **Severity:** Critical | **CWE-95**
- **Files:** `src/lib/push.ts:31`, `src/lib/native.ts:36`, `next.config.ts:14`
- **References:** CQ-17, SEC-4, BP-12, STD-30
- **Issue:** `new Function('mod', 'return require(mod)')` forces `unsafe-eval` in CSP, weakening XSS protection for the entire application.
- **Fix:** Replace with `import()`. Remove `unsafe-eval` from CSP.

### 7. Missing 6 Database Tables — Features Non-Functional
- **Severity:** Critical
- **File:** `supabase/migrations/001_create_all_tables.sql`
- **References:** AR-1, SEC-13, DOC-1
- **Issue:** `push_subscriptions`, `referrals`, `people`, `photo_tags`, `circle_comments`, `collections` don't exist. All dependent features are broken.
- **Fix:** Add supplementary migration with tables, RLS policies, indexes, and foreign keys.

### 8. Missing 3 Profile Columns — Stripe Billing Non-Functional
- **Severity:** Critical
- **File:** `supabase/migrations/001_create_all_tables.sql:16-28`
- **References:** AR-2
- **Issue:** `stripe_customer_id`, `stripe_subscription_id`, `referral_code` are written by code but absent from schema. Stripe subscription management is completely broken.
- **Fix:** `ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT, stripe_subscription_id TEXT, referral_code TEXT UNIQUE;`

### 9. Zero Automated Tests
- **Severity:** Critical
- **References:** TEST-1 through TEST-17
- **Issue:** No test files, no test runner, no CI. Every code path in all 154 source files ships unverified. Security vulnerabilities have no regression tests.
- **Fix:** Set up Vitest + React Testing Library. See `roll-app/TEST_COVERAGE_AUDIT.md` for 4-week implementation plan targeting 200 tests.

### 10. Upload Storage Key Injection (IDOR)
- **Severity:** High (borderline Critical) | **CWE-639**
- **File:** `src/app/api/upload/complete/route.ts:60-72`
- **References:** CQ-5, SEC-7, TEST-7
- **Issue:** `storageKey` from client body is passed to `getObject()` without validating it matches `originals/{userId}/` prefix. Any user can claim another user's photos.
- **Fix:** `if (!storageKey.startsWith(\`originals/${user.id}/\`)) return 403;`

### 11. No Runtime Input Validation on Any API Route
- **Severity:** High | **CWE-20**
- **Files:** All 30 API routes
- **References:** AR-5, SEC-8, STD-13
- **Issue:** Every route uses `body as { field: type }` — compile-time only, zero runtime checks. Malformed input reaches database queries.
- **Fix:** Install `zod`. Create schemas per route. Validate with `safeParse()`.

### 12. No Rate Limiting on Any Endpoint
- **Severity:** High | **CWE-770**
- **File:** `src/middleware.ts`
- **References:** SEC-9, AR-13
- **Issue:** Resource-intensive endpoints (image processing, presigned URLs, Stripe sessions) have no rate limiting. Trivial to exhaust server resources or incur costs.
- **Fix:** Implement per-user rate limiting via `@upstash/ratelimit` or Vercel Edge Config.

### 13. `capturePhoto()` Always Returns null
- **Severity:** High (functional bug)
- **File:** `src/hooks/useCameraCapture.ts:92-118`
- **References:** CQ-3, BP-16, TEST-9
- **Issue:** `canvas.toBlob()` is async callback-based but function returns synchronously. Return value is always `null`.
- **Fix:** Promisify `toBlob`, make function async, return `Promise<File | null>`.

### 14. Synchronous Processing Pipelines Block HTTP Requests
- **Severity:** Critical (performance) / High (architecture)
- **Files:** `src/app/api/process/develop/route.ts:127-157`, `src/app/api/process/filter/route.ts:57-70`, `src/app/api/upload/complete/route.ts:60-113`
- **References:** CQ-7, PERF-03, PERF-10, PERF-12, PERF-34, BP-24, AR-19
- **Issue:** All image processing (develop, filter, thumbnail generation) runs synchronously in HTTP request handlers. 36 photos = 10-30s blocking. 500-photo filter batch exceeds Vercel 300s timeout.
- **Fix:** Create job records, return immediately, process in background (Vercel Cron, Inngest, or `waitUntil()`).

### 15. N+1 Sequential Position UPDATEs
- **Severity:** Critical (performance)
- **Files:** `src/app/api/rolls/[id]/photos/route.ts:173-179`, `src/app/api/rolls/[id]/reorder/route.ts:62-72`
- **References:** CQ-11, PERF-14
- **Issue:** Removing position 1 from 36-photo roll = 35 individual UPDATE queries.
- **Fix:** Single SQL: `UPDATE roll_photos SET position = position - 1 WHERE position > $removed AND roll_id = $rollId`.

### 16. R2 S3Client Recreated on Every Call
- **Severity:** High (performance)
- **File:** `src/lib/storage/r2.ts:4-21`
- **References:** CQ-6, PERF-01, BP-22
- **Issue:** `getR2Client()` creates new `S3Client` per invocation. ~50-100ms overhead per R2 operation. 72+ unnecessary TLS handshakes per batch upload.
- **Fix:** Module-level singleton (same pattern as `getStripe()` in `stripe.ts`).

### 17. Webhook Handlers Use Anon Key — RLS Blocks Updates
- **Severity:** High | **CWE-863**
- **Files:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/prodigi/route.ts`
- **References:** SEC-11
- **Issue:** Webhooks have no user session. RLS policies require `auth.uid() = user_id`. Database updates may silently fail.
- **Fix:** Use `SUPABASE_SERVICE_ROLE_KEY` for webhook handlers with proper signature verification as auth.

### 18. All Pages Use `useEffect` + `fetch` Instead of Server Components
- **Severity:** High (architecture)
- **Files:** All pages under `src/app/(app)/`
- **References:** BP-15
- **Issue:** Every page is `'use client'` loading data via `useEffect` + `fetch` to own API routes. This is the pre-App Router pattern. Causes loading waterfalls, sends more JS, prevents streaming.
- **Fix:** Split into Server Component (data) + Client Component (interactivity).

### 19. Sentry `captureError` Defined But Never Called
- **Severity:** High (observability)
- **File:** `src/lib/sentry.ts:30`
- **References:** STD-8
- **Issue:** Function exists but zero callers. All errors go to `console.error` (13 occurrences). Sentry receives zero programmatic reports. Production errors are invisible.
- **Fix:** Replace `console.error` in catch blocks with `captureError(err, { context })`.

### 20. No ESLint Configuration File
- **Severity:** High (tooling)
- **References:** STD-1
- **Issue:** ESLint deps in `package.json` but no config file. `next lint` may silently use minimal defaults. No custom rules enforced.
- **Fix:** Create `eslint.config.mjs` with `eslint-config-next`, `@typescript-eslint`, `react-hooks` rules.

---

## All Findings by Phase

### Phase 1: Code Quality & Architecture
- **Code Quality:** 7 Critical, 12 High, 15 Medium, 10 Low (44 total)
- **Architecture:** 2 Critical, 5 High, 14 Medium, 5 Low + 3 Positive (29 total)
- [Full details](.full-review/01-quality-architecture.md)

### Phase 2: Security & Performance
- **Security:** 6 Critical, 7 High, 8 Medium, 5 Low (26 total)
- **Performance:** 6 Critical, 10 High, 13 Medium, 9 Low (38 total)
- [Full details](.full-review/02-security-performance.md)

### Phase 3: Testing & Documentation
- **Testing:** 5 Critical, 7 High, 5 Medium (17 total)
- **Documentation:** 5 Critical, 6 High, 6 Medium, 3 Low (20 total)
- [Full details](.full-review/03-testing-documentation.md)

### Phase 4: Best Practices & Standards
- **Best Practices:** 1 Critical, 6 High, 13 Medium, 12 Low (32 total)
- **Standards:** 1 Critical, 5 High, 10 Medium, 8 Low + 5 Positive (29 total)
- [Full details](.full-review/04-best-practices-standards.md)

---

## Remediation Roadmap

### Week 1: Security Emergency (Findings 1-6, 10)

**Goal:** Eliminate all exploitable vulnerabilities.

| Priority | Finding | Effort | Risk if Deferred |
|----------|---------|--------|------------------|
| P0 | #1 Open redirect — add auth + domain allowlist | 1 hour | Active phishing vector |
| P0 | #3 Seed endpoint — add `NODE_ENV` guard | 15 min | Data destruction by any user |
| P0 | #4 XSS in emails — add `escapeHtml()` | 2 hours | Account compromise via email |
| P0 | #5 Client pricing — server-side lookup | 2 hours | Revenue loss / fraud |
| P0 | #2 Webhook errors — return 500 | 30 min | Payment desync |
| P0 | #6 Remove `new Function()` + `unsafe-eval` | 2 hours | CSP bypass |
| P0 | #10 Upload IDOR — validate storage key prefix | 30 min | Cross-user data access |

**Estimated effort:** 1-2 days

### Week 2: Data Integrity (Findings 7-8, 17)

**Goal:** Make the database match what the code expects.

| Priority | Finding | Effort |
|----------|---------|--------|
| P1 | #7 Add 6 missing tables with RLS + indexes | 4 hours |
| P1 | #8 Add 3 missing profile columns | 1 hour |
| P1 | #17 Webhook service role key + signature verification | 3 hours |

**Estimated effort:** 1-2 days

### Week 3: Testing Foundation (Finding 9)

**Goal:** Establish test infrastructure and write critical security tests.

| Priority | Finding | Effort |
|----------|---------|--------|
| P1 | Set up Vitest + React Testing Library | 2 hours |
| P1 | Write security regression tests (open redirect, IDOR, pricing, XSS) | 8 hours |
| P1 | Write webhook handler integration tests | 4 hours |
| P1 | Write image processing unit tests | 4 hours |

**Estimated effort:** 3-4 days

### Weeks 4-5: Performance & Architecture (Findings 14-16)

**Goal:** Eliminate timeouts and N+1 patterns.

| Priority | Finding | Effort |
|----------|---------|--------|
| P2 | #14 Background job system for processing pipelines | 2-3 days |
| P2 | #15 Atomic position updates (single SQL) | 2 hours |
| P2 | #16 R2 client singleton | 30 min |
| P2 | #12 Rate limiting on sensitive endpoints | 4 hours |
| P2 | #11 Zod validation on API routes | 1-2 days |

**Estimated effort:** 5-7 days

### Weeks 6-8: Modernization (Findings 18-20)

**Goal:** Adopt Next.js 16 best practices and establish tooling.

| Priority | Finding | Effort |
|----------|---------|--------|
| P3 | #18 Migrate key pages to Server Components | 3-5 days |
| P3 | #19 Wire up Sentry properly (`@sentry/nextjs` config) | 4 hours |
| P3 | #20 ESLint flat config + Prettier + pre-commit hooks | 4 hours |
| P3 | #13 Fix `capturePhoto()` async bug | 1 hour |
| P3 | Expand test coverage to 60% | 1-2 weeks |

**Estimated effort:** 2-3 weeks

---

## Appendix: Files Referenced

### Most-Cited Files (appearing in 3+ findings)

| File | Finding Count | Key Issues |
|------|--------------|------------|
| `src/app/api/photos/serve/route.ts` | 5 | Open redirect, no auth |
| `src/app/api/webhooks/stripe/route.ts` | 5 | Error swallowing, anon key, wrong table |
| `src/app/api/upload/complete/route.ts` | 4 | IDOR, inline Supabase, timeout |
| `src/app/api/process/develop/route.ts` | 4 | Sync processing, wrong table, timeout |
| `supabase/migrations/001_create_all_tables.sql` | 4 | Missing tables, columns, constraints |
| `src/lib/storage/r2.ts` | 3 | Client recreation, memory buffering |
| `src/hooks/useCameraCapture.ts` | 3 | capturePhoto null return |
| `src/lib/push.ts` | 3 | new Function, any cast |
| `next.config.ts` | 3 | CSP unsafe-eval, unsafe-inline |
| `src/app/(app)/feed/page.tsx` | 3 | Duplicated logic, race condition |

### Supplementary Analysis Files
- `roll-app/TEST_COVERAGE_AUDIT.md` — Detailed test coverage audit with Vitest code examples
- `roll-app/PERFORMANCE_ANALYSIS.md` — Detailed performance analysis with benchmarks
