# Phase 2: Security & Performance Review

## Security Findings

**Summary: 6 Critical, 7 High, 8 Medium, 5 Low findings (26 total)**

### Critical Findings

**SEC-1. Open Redirect on Unauthenticated `/api/photos/serve` Endpoint**
- **Severity:** Critical | **CWE-601** (Open Redirect)
- **File:** `src/app/api/photos/serve/route.ts:6-25`
- **Description:** The photo serving endpoint takes a `key` query parameter and redirects to it. No authentication check. Lines 13-15 redirect to any URL starting with `http://` or `https://`. The middleware explicitly excludes `/api` routes from auth checking.
- **Attack Scenario:** An attacker crafts `https://roll.photos/api/photos/serve?key=https://evil.com/fake-login` and sends it to a victim. The victim sees the trusted domain and clicks. The redirect takes them to a phishing page.
- **Fix:** Add authentication, restrict redirects to allowed hostnames (`R2_PUBLIC_URL` domain only).

**SEC-2. Seed Endpoint Exposes Service Role Key to Any Authenticated User**
- **Severity:** Critical | **CWE-269** (Improper Privilege Management)
- **File:** `src/app/api/seed/route.ts`
- **Description:** Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass all RLS. No environment check, no admin role verification. Any authenticated user can: POST to create 92+ mock photos with fake member profiles inserted into the global `profiles` table, or DELETE to wipe data. Line 795 deletes ALL profiles matching `@example.com` globally.
- **Attack Scenario:** Authenticated user calls `DELETE /api/seed` to destroy data, or `POST /api/seed` to inject fake profiles visible to other users via circle membership queries.
- **Fix:** Guard with `if (process.env.NODE_ENV === 'production') return 403`.

**SEC-3. XSS in Email Templates via Unescaped User Input**
- **Severity:** Critical | **CWE-79** (Cross-site Scripting)
- **File:** `src/lib/email/templates.ts:43,59,86-91,143,171`
- **Description:** User-controlled values (`inviterName`, `rollName`, `circleName`, `displayName`) are interpolated directly into HTML email templates without escaping. A user setting their display name to `<img src=x onerror=alert(document.cookie)>` would inject executable HTML into emails sent to other users.
- **Attack Scenario:** Attacker sets display name to malicious HTML, invites victim to a circle. Victim's email client renders the injected HTML.
- **Fix:** Create `escapeHtml()` utility and apply to all user-provided values in templates.

**SEC-4. `new Function()` Eval Patterns Force `unsafe-eval` in CSP**
- **Severity:** Critical | **CWE-95** (Eval Injection)
- **Files:** `src/lib/push.ts:31`, `src/lib/native.ts:36`
- **Description:** Both files use `new Function('mod', 'return require(mod)')` or equivalent, which is functionally equivalent to `eval()`. The CSP in `next.config.ts` includes `'unsafe-eval'` to accommodate this, weakening the entire Content Security Policy.
- **Attack Scenario:** If any XSS vulnerability exists, `unsafe-eval` allows the attacker to execute arbitrary JavaScript via `eval()` or `new Function()`.
- **Fix:** Replace with standard `require()` or `import()`. Remove `'unsafe-eval'` from CSP.

**SEC-5. Client-Controllable Pricing in Print Checkout**
- **Severity:** Critical | **CWE-472** (External Control of Assumed-Immutable Web Parameter)
- **File:** `src/app/api/billing/print-checkout/route.ts:23-33`
- **Description:** Accepts `photoCount` and `printSize` from request body to compute Stripe checkout price. A malicious client can submit `photoCount: 0` or manipulated values.
- **Attack Scenario:** Attacker modifies request to `{ photoCount: 1, printSize: "4x6" }` for a 36-photo roll, paying $0.30 + $4.99 instead of $10.80 + $4.99.
- **Fix:** Look up actual photo count and print size from the database order record.

**SEC-6. Stripe Webhook Swallows Errors — Payment State Desync**
- **Severity:** Critical | **CWE-755** (Improper Handling of Exceptional Conditions)
- **File:** `src/app/api/webhooks/stripe/route.ts:83-86`
- **Description:** Catch block returns `{ received: true }` with HTTP 200 on any error. Stripe considers the event delivered and will not retry. If DB update fails during `checkout.session.completed`, user pays but tier is never upgraded.
- **Attack Scenario:** Transient database error during checkout completion. User is charged but never receives Roll+ subscription. Stripe won't redeliver.
- **Fix:** Return HTTP 500 on processing failures. Add Sentry reporting. Implement idempotency checks.

### High Findings

**SEC-7. No Storage Key Ownership Validation in Upload Complete (IDOR)**
- **Severity:** High | **CWE-639** (Authorization Bypass Through User-Controlled Key)
- **File:** `src/app/api/upload/complete/route.ts:60-72`
- **Description:** Does not verify that `storageKey` belongs to the authenticated user. A malicious user can submit `originals/{otherUserId}/...` keys.
- **Fix:** Validate `storageKey.startsWith(`originals/${user.id}/`)`.

**SEC-8. No Runtime Input Validation on Any API Route**
- **Severity:** High | **CWE-20** (Improper Input Validation)
- **Files:** All 30 API routes
- **Description:** Every route uses TypeScript `as` casts (compile-time only). No runtime type checking. Malformed input reaches database queries or processing logic.
- **Fix:** Adopt Zod for request validation at API boundaries.

**SEC-9. No Rate Limiting on Any Endpoint**
- **Severity:** High | **CWE-770** (Allocation of Resources Without Limits)
- **File:** `src/middleware.ts` (handles only auth redirects)
- **Description:** No rate limiting on any endpoint. Resource-intensive endpoints include `/api/process/develop` (Sharp processing), `/api/upload/presign` (R2 URL generation), `/api/billing/checkout` (Stripe sessions).
- **Fix:** Implement per-user rate limiting via `@upstash/ratelimit` or similar.

**SEC-10. Client-Controllable Stripe Redirect URLs**
- **Severity:** High | **CWE-601** (Open Redirect)
- **Files:** `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/print-checkout/route.ts`
- **Description:** Success/cancel URLs for Stripe checkout may be controllable or predictable. If constructed from client input without validation, an attacker could redirect post-payment to a malicious site.
- **Fix:** Hardcode success/cancel URLs server-side using known application routes.

**SEC-11. Webhook Handlers Use Anon Key — RLS Prevents Updates**
- **Severity:** High | **CWE-863** (Incorrect Authorization)
- **Files:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/prodigi/route.ts`
- **Description:** Webhook handlers create Supabase clients with the anon key (via `createServerSupabaseClient`). RLS policies require `auth.uid() = user_id` for updates. Since webhooks have no user session, database updates may silently fail.
- **Fix:** Use `SUPABASE_SERVICE_ROLE_KEY` for webhook handlers that need to update records without a user session, with proper webhook signature verification as the auth mechanism.

**SEC-12. Wrong Table Name in Develop Route**
- **Severity:** High | **CWE-284** (Improper Access Control)
- **File:** `src/app/api/process/develop/route.ts:50`
- **Description:** Queries `.from('users')` instead of `.from('profiles')` to check tier. If `users` is not a valid table/view, the tier check silently fails, potentially allowing free-tier users to access premium develop features.
- **Fix:** Standardize on `profiles` table name across the entire codebase.

**SEC-13. Missing Database Tables — 6 Features Without RLS**
- **Severity:** High | **CWE-862** (Missing Authorization)
- **File:** `supabase/migrations/001_create_all_tables.sql`
- **Description:** 6 tables referenced in code don't exist in migration: `push_subscriptions`, `referrals`, `people`, `photo_tags`, `circle_comments`, `collections`. If created manually without RLS policies, data would be accessible to all users.
- **Fix:** Add all 6 tables with proper RLS policies, indexes, and foreign keys.

### Medium Findings

**SEC-14.** Prodigi webhook lacks signature verification — `src/app/api/webhooks/prodigi/route.ts` — anyone can forge fulfillment status updates
**SEC-15.** `unsafe-inline` in CSP `script-src` — `next.config.ts` — weakens XSS protection
**SEC-16.** Circle invite tokens may be predictable or reusable — `src/app/api/circles/[id]/invite/route.ts` — token generation and expiry strategy
**SEC-17.** No CSRF protection on state-changing API routes — relies solely on cookie-based auth
**SEC-18.** Verbose error messages in production — some routes return raw Supabase error messages to clients
**SEC-19.** Missing `Permissions-Policy` for payment — camera allowed but payment not restricted
**SEC-20.** Race condition in circle join — member count read-modify-write not atomic
**SEC-21.** API route parameters not validated as UUID format — potential for injection in error messages

### Low Findings

**SEC-22.** `STRIPE_CONFIG` defaults to empty strings — silent misconfiguration
**SEC-23.** Non-null assertions on env vars — obscure runtime errors instead of clear messages
**SEC-24.** No `SameSite` attribute explicitly set on auth cookies (relies on Supabase defaults)
**SEC-25.** Missing `X-Request-ID` header for request tracing in security incidents
**SEC-26.** ErrorBoundary doesn't report to Sentry — rendering crashes invisible in production

---

## Performance Findings

**Summary: 6 Critical, 10 High, 13 Medium, 9 Low findings (38 total)**

See full detailed analysis with code examples: `roll-app/PERFORMANCE_ANALYSIS.md`

### Critical Findings

**PERF-01. S3Client Recreated on Every Call**
- **Severity:** Critical
- **File:** `src/lib/storage/r2.ts:4-21`
- **Impact:** ~50-100ms added per R2 operation. 72+ unnecessary TLS handshakes for 36-photo upload. Hundreds for 500-photo filter batch.
- **Fix:** Module-level singleton with lazy initialization.

**PERF-03. Filter Pipeline Blocks HTTP Request**
- **Severity:** Critical
- **Files:** `src/app/api/process/filter/route.ts:57-70`, `src/lib/processing/pipeline.ts:177-222`
- **Impact:** 500-photo batch at 2-5 seconds/photo = 200-500 seconds. Exceeds Vercel 300s timeout.
- **Fix:** Decouple processing from HTTP request. Return job ID immediately, process in background.

**PERF-10. Sequential Thumbnail Generation in Upload Complete**
- **Severity:** Critical
- **File:** `src/app/api/upload/complete/route.ts:60-113`
- **Impact:** Each photo: R2 download + Sharp thumbnail + R2 upload, done sequentially. 10 photos exceeds 30-second timeout.
- **Fix:** Parallelize with `Promise.all()` in batches, or defer to background job.

**PERF-12. Synchronous Develop Pipeline Blocks Request**
- **Severity:** Critical
- **File:** `src/app/api/process/develop/route.ts:127-157`
- **Impact:** 36 photos × (2 DB updates + 100ms delay) = 10-30 seconds minimum in single HTTP request.
- **Fix:** Create job record, return jobId immediately, process asynchronously.

**PERF-14. N+1 Sequential Position UPDATEs on Reorder**
- **Severity:** Critical
- **Files:** `src/app/api/rolls/[id]/photos/route.ts:173-179`, `src/app/api/rolls/[id]/reorder/route.ts:62-72`
- **Impact:** Removing position 1 from 36-photo roll = 35 individual UPDATE queries.
- **Fix:** Single SQL `UPDATE roll_photos SET position = position - 1 WHERE position > $removed`.

**PERF-34. Upload Complete Route Has 30-Second Timeout**
- **Severity:** Critical
- **File:** `vercel.json:11-13`
- **Impact:** Upload complete processes each photo sequentially (2-3s each). 10+ photos will timeout.
- **Fix:** Increase timeout or move processing to background job.

### High Findings

**PERF-04.** O(n^2) duplicate detection — 124,750 comparisons for 500 photos — `duplicateDetection.ts:47-72`
**PERF-06.** 7 separate Sharp decodes per photo in filter pipeline — `pipeline.ts:125-175`
**PERF-08.** Double file read in upload (upload + hash) — `uploadBatch.ts:55-58,96-101`
**PERF-09.** Sequential presigned URL generation — `upload/presign/route.ts:44-67`
**PERF-13.** N+1 counter update per photo in develop — `process/develop/route.ts:146-153`
**PERF-15.** Full table scan in /api/memories — fetches ALL photos — `memories/route.ts:32-39`
**PERF-16.** Sequential year-in-review queries (7 independent) — `year-in-review/route.ts:33-100`
**PERF-17.** Search fetches all photos twice — `search/route.ts:86-102`
**PERF-18.** Collections full table scan — `collections/route.ts:29-34`
**PERF-28.** Auto-fill sends 36 sequential API calls — `feed/page.tsx:178-190`

### Medium Findings

**PERF-02.** Full image buffered in memory (50MB per photo) — `r2.ts:77-91`
**PERF-05.** Expensive hamming distance (hex-to-binary string) — `duplicateDetection.ts:33-45`
**PERF-07.** Zero dimensions break screenshot detection — `uploadBatch.ts:103-112`
**PERF-11.** No EXIF extraction on upload — `uploadBatch.ts:103-112`
**PERF-19.** Missing composite sort index — `001_create_all_tables.sql:86,90`
**PERF-22.** Browser Supabase client not singleton — `supabase/client.ts:1-8`
**PERF-24.** Array copy on every photo append in store — `photoStore.ts:33-34`
**PERF-26.** No Zustand selectors in usePhotos — `usePhotos.ts:9-25`
**PERF-27.** FeedPage duplicates useRoll logic — `feed/page.tsx:36,81-141`
**PERF-29.** Render-blocking Google Fonts — `layout.tsx:49-55`
**PERF-32.** No Next.js Image optimization — multiple components use raw `<img>`
**PERF-35.** Race in roll creation on rapid clicks — `feed/page.tsx:99-117`
**PERF-37.** No caching on read-heavy endpoints — multiple routes

### Low Findings

**PERF-20.** No geo index for map queries — `photos/map/route.ts:26-34`
**PERF-21.** No trigram index for filename search — `search/route.ts:43`
**PERF-23.** Inconsistent server client usage — 4 API routes
**PERF-25.** Full sort on photo recovery — `photoStore.ts:50-55`
**PERF-30.** Mutable timer in PhotoCard — `PhotoCard.tsx:36`
**PERF-31.** RollCard injects style per instance — `RollCard.tsx:103-122`
**PERF-33.** lucide-react full bundle import — multiple components
**PERF-36.** Position race on concurrent adds — `rolls/[id]/photos/route.ts:44-74`
**PERF-38.** No request deduplication on load — `usePhotos.ts:78-81`

---

## Critical Issues for Phase 3 Context

### Issues Affecting Testing Requirements
1. **No test files exist** — the entire codebase has zero automated tests
2. **Critical security vulnerabilities** (SEC-1 through SEC-6) need security-focused test coverage
3. **Race conditions** (SEC-20, PERF-35, PERF-36) need concurrency testing
4. **Webhook handlers** (SEC-6, SEC-11, SEC-14) need integration tests with signature verification
5. **Image processing pipeline** (PERF-03, PERF-06, PERF-12) needs performance benchmarks
6. **Upload flow** (PERF-10, PERF-34) needs load testing against timeout constraints

### Issues Affecting Documentation Requirements
1. **6 missing database tables** (SEC-13) — migration documentation is incomplete
2. **Inconsistent API response formats** — need API documentation standardization
3. **Environment variable requirements** — `.env.local.example` may be incomplete for missing features
4. **Background job architecture** — processing pipeline redesign needs architecture documentation
5. **Security configuration** — CSP, rate limiting, and webhook verification need security docs
