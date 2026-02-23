# Phase 1: Code Quality & Architecture Review

## Code Quality Findings

**Summary: 7 Critical, 12 High, 15 Medium, 10 Low findings**

### Critical Findings

**CQ-1. Stripe Webhook Silently Swallows Errors — Data Loss Risk**
- **Severity:** Critical
- **File:** `src/app/api/webhooks/stripe/route.ts:83-86`
- **Description:** The catch block returns `{ received: true }` with HTTP 200 on any error. Stripe considers the event delivered and will never retry. If the database update fails (e.g., writing `tier: 'plus'` to profiles), the user pays but never gets upgraded. This is a permanent data loss scenario.
- **Fix:** Return HTTP 500 on processing failures so Stripe retries (up to 72 hours).

**CQ-2. Race Condition in Circle Join — Member Count Drift**
- **Severity:** Critical
- **File:** `src/app/api/circles/join/[token]/route.ts:76-93`
- **Description:** Classic read-modify-write race: reads `member_count`, increments in JS, writes back. Two concurrent joins both read N and write N+1 instead of N+2.
- **Fix:** Use `supabase.rpc('increment_member_count', ...)` with an atomic SQL function, or a database trigger on `circle_members` insert.

**CQ-3. `capturePhoto` Always Returns null**
- **Severity:** Critical
- **File:** `src/hooks/useCameraCapture.ts:92-118`
- **Description:** `canvas.toBlob()` is callback-based. The function returns `file` synchronously before the callback fires. Any caller relying on the return value gets `null`.
- **Fix:** Convert to `Promise<File | null>` wrapping `canvas.toBlob` in a Promise.

**CQ-4. Seed Endpoint Exposed in Production — Deletes All User Data**
- **Severity:** Critical
- **File:** `src/app/api/seed/route.ts:121, 717, 795`
- **Description:** Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Any authenticated user can call POST to overwrite data or DELETE to wipe it. Line 795 deletes ALL profiles with `@example.com` emails globally.
- **Fix:** Guard with `if (process.env.NODE_ENV === 'production') return 403`.

**CQ-5. Upload Complete Lacks Authorization on Photo Ownership**
- **Severity:** Critical
- **File:** `src/app/api/upload/complete/route.ts:60-72`
- **Description:** Does not verify `storageKey` belongs to the authenticated user. A malicious user can submit another user's `originals/{otherUserId}/...` keys and create photo records pointing to their storage.
- **Fix:** Validate `storageKey.startsWith(`originals/${user.id}/`)`.

**CQ-6. R2 Client Recreated on Every Call — No Singleton**
- **Severity:** Critical
- **File:** `src/lib/storage/r2.ts:4-21`
- **Description:** `getR2Client()` creates a new `S3Client` on every invocation. During batch uploads of 500 photos, hundreds of client instances are created. Each constructor establishes new HTTP connections.
- **Fix:** Use singleton pattern (same as `getStripe()` in `stripe.ts`).

**CQ-7. Develop Endpoint is Synchronous — Will Timeout on Large Rolls**
- **Severity:** Critical
- **File:** `src/app/api/process/develop/route.ts:127-157`
- **Description:** Processes all 36 photos in a sequential `for` loop within a single HTTP request. Minimum 3.6s with simulated delay; real processing would take minutes and hit serverless timeouts. The `useRoll` hook expects a `jobId` for async polling, but the API processes synchronously.
- **Fix:** Create a job record, return `jobId` immediately, process asynchronously via background worker or `waitUntil()`.

### High Findings

**CQ-8. Duplicated Supabase Client Creation in Upload Routes**
- **Severity:** High
- **Files:** `src/app/api/upload/presign/route.ts:10-24`, `src/app/api/upload/complete/route.ts:10-24`
- **Description:** Both routes manually create Supabase server clients with inline cookie handling instead of using `createServerSupabaseClient()`. Cookie handling logic could diverge from the canonical implementation.

**CQ-9. Auth Boilerplate Duplicated in Every API Route (30x)**
- **Severity:** High
- **Files:** All 30 API route files
- **Description:** Every route repeats the same 5-line auth pattern. Any auth change requires editing all 30 files.
- **Fix:** Extract `withAuth()` higher-order function.

**CQ-10. Duplicated Photo Query Logic Between Hook and Server**
- **Severity:** High
- **Files:** `src/hooks/usePhotos.ts:37-54`, `src/lib/supabase/server.ts:47-76`
- **Description:** Identical Supabase query building for content mode filtering, cursor pagination, and ordering duplicated between client hook and server helper.

**CQ-11. Sequential N+1 Database Calls in Roll Photo DELETE**
- **Severity:** High
- **File:** `src/app/api/rolls/[id]/photos/route.ts:173-180`
- **Description:** When removing a photo, issues individual UPDATE for every remaining photo's position. 35 sequential updates for removing position 1 from a 36-photo roll.
- **Fix:** Use single SQL `UPDATE roll_photos SET position = position - 1 WHERE position > $removed`.

**CQ-12. Year-in-Review Fires 7-8 Sequential Database Queries**
- **Severity:** High
- **File:** `src/app/api/year-in-review/route.ts:32-100`
- **Description:** All queries are independent but run sequentially. Response time is sum (~350ms+) instead of maximum (~50ms).
- **Fix:** `Promise.all()` for all independent queries.

**CQ-13. No Timeout on Develop Polling Loop**
- **Severity:** High
- **File:** `src/hooks/useRoll.ts:284-336`
- **Description:** `developRoll` polls `/api/process/status/{jobId}` every 2 seconds indefinitely. No max iterations or timeout. If server gets stuck, client polls forever.
- **Fix:** Add `MAX_POLL_ATTEMPTS = 150` (5 minutes at 2s intervals).

**CQ-14. Print Price Calculation Is Client-Controllable**
- **Severity:** High
- **File:** `src/app/api/billing/print-checkout/route.ts:23-33`
- **Description:** Accepts `photoCount` and `printSize` from request body to compute price. Malicious client can manipulate totals.
- **Fix:** Look up the actual values from the database order record.

**CQ-15. Stripe Webhook and Develop Route Reference Different Tables**
- **Severity:** High
- **Files:** `src/app/api/webhooks/stripe/route.ts:29` (uses `profiles`), `src/app/api/process/develop/route.ts:50` (uses `users`)
- **Description:** User data accessed via both `profiles` and `users` table names. Could cause silent failures if these are not aliased.

**CQ-16. `useCallback` Unstable Dependencies in `usePhotos`**
- **Severity:** High
- **File:** `src/hooks/usePhotos.ts:76`
- **Description:** `loadPhotos` has `cursor` in dependency array. Cursor changes on every load, giving `loadPhotos` a new identity each time. Cascades to `setContentMode` and `loadMore` via their dependency arrays.
- **Fix:** Read cursor from store via `usePhotoStore.getState()` inside the callback.

**CQ-17. `new Function()` Used for Dynamic Import — CSP Violation**
- **Severity:** High
- **Files:** `src/lib/push.ts:31`, `src/lib/native.ts:36`
- **Description:** `new Function('mod', 'return require(mod)')` is equivalent to `eval()`. Blocked by CSP without `'unsafe-eval'`.
- **Fix:** Use standard `require()` or `import()`.

**CQ-18. Prodigi API Hardcoded to Sandbox URL**
- **Severity:** High
- **File:** `src/lib/prodigi.ts:48`
- **Description:** `PRODIGI_API_URL` hardcoded to `https://api.sandbox.prodigi.com/v4.0/orders`. Production orders will never be fulfilled.
- **Fix:** Use `process.env.PRODIGI_API_URL` with sandbox as default.

**CQ-19. Non-Atomic Optimistic Updates in `checkPhoto`**
- **Severity:** High
- **File:** `src/hooks/useRoll.ts:109-163`
- **Description:** If API call fails after roll creation, revert only unchecks the photo but the empty roll persists in both database and store. Error handling check is racy.

### Medium Findings

**CQ-20.** Magic number 36 hardcoded instead of `MAX_ROLL_PHOTOS` constant — `rollStore.ts:42`, `rolls/[id]/photos/route.ts:55,84,189`
**CQ-21.** `useToast` hook defined inside `toastStore.ts` store file (violates separation of concerns)
**CQ-22.** `PhotoCard` uses mutable `let` variable for timer instead of `useRef` — long-press is uncancelable — `PhotoCard.tsx:35-51`
**CQ-23.** `useNetworkStatus` memory leak: `setTimeout` never cleared on unmount — `useNetworkStatus.ts:15-19`
**CQ-24.** Perceptual hash uses wrong pixel subset (first 64 of 1024 pixels from 32x32 resize) — `duplicateDetection.ts:4-31`
**CQ-25.** Duplicate detection has O(n^2) complexity with `Array.includes()` instead of `Set` — `duplicateDetection.ts:47-72`
**CQ-26.** `uploadPhotos` doesn't validate `uploads` response length matches `files` length — `uploadBatch.ts:38-42`
**CQ-27.** Content hash computed client-side but never verified server-side — `uploadBatch.ts:96-101`
**CQ-28.** `contentMode` state duplicated in `filterStore` and `photoStore` — sync risk
**CQ-29.** `useRoll` uses `useRollStore.getState()` 8 times — acceptable but undocumented pattern
**CQ-30.** Duplicate `removeFromRoll` and `uncheckPhoto` logic — `useRoll.ts:168-249`
**CQ-31.** API routes don't validate UUID format for path parameters
**CQ-32.** XSS risk in email templates — user-controlled values interpolated into HTML without escaping — `templates.ts:43,59,86-91,143,171`
**CQ-33.** Unused `options` parameter in middleware cookie `setAll` — `middleware.ts:17`
**CQ-34.** `RollCard` injects `<style>` tag on every render (10 cards = 10 identical style blocks) — `RollCard.tsx:102-122`

### Low Findings

**CQ-35.** Non-null assertions on env vars throughout (no early validation)
**CQ-36.** `STRIPE_CONFIG` uses empty string defaults instead of throwing
**CQ-37.** Inconsistent error response format across API routes
**CQ-38.** `filterStore` uses `persist` with no version/migration strategy
**CQ-39.** Missing return type annotations on API route handlers
**CQ-40.** `PhotoLightbox` hardcodes animation timings coupled to CSS
**CQ-41.** `toastCounter` module-level mutable state (won't survive HMR)
**CQ-42.** `PhotoGrid` skeleton keys stable but no fade transition
**CQ-43.** `IntersectionObserver` callback can fire after unmount — `PhotoGrid.tsx:35-50`
**CQ-44.** `useUser` always refetches on mount with no staleness check

---

## Architecture Findings

**Summary: 2 Critical, 5 High, 14 Medium, 5 Low findings + 3 Positive Observations**

### Critical Findings

**AR-1. Missing 6 Tables in Database Migration**
- **Severity:** Critical
- **File:** `supabase/migrations/001_create_all_tables.sql`
- **Description:** The migration declares 14 tables, but app code references 6 additional tables that don't exist: `push_subscriptions`, `referrals`, `people`, `photo_tags`, `circle_comments`, `collections`. These features are completely non-functional. This is a deployment blocker.
- **Fix:** Add supplementary migration with all 6 tables including RLS policies, indexes, and triggers.

**AR-2. Missing Columns on `profiles` Table**
- **Severity:** Critical
- **File:** `supabase/migrations/001_create_all_tables.sql:16-28`
- **Description:** `stripe_customer_id`, `stripe_subscription_id`, and `referral_code` columns are written by application code but absent from the schema. Stripe subscription management is completely non-functional — users pay but never receive Roll+ tier. Subscription changes (cancellation, renewal) are never reflected.
- **Fix:** `ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT, ADD COLUMN stripe_subscription_id TEXT, ADD COLUMN referral_code TEXT UNIQUE;`

### High Findings

**AR-3. `print_size`/`product` CHECK Constraint Mismatch with TypeScript Types**
- **Severity:** High
- **File:** `supabase/migrations/001_create_all_tables.sql:335-336` vs `types/print.ts:1-3`
- **Description:** DB allows `('4x6', '5x7')` but TypeScript/Prodigi include `'8x8'`. DB allows `('roll_prints', 'album_prints', 'individual')` but TypeScript includes `'photo_book'`. Orders with `8x8` or `photo_book` will fail with CHECK constraint violation after user has entered payment details.

**AR-4. Inconsistent Supabase Client Initialization in Upload Routes**
- **Severity:** High
- **Description:** Same as CQ-8. Upload routes duplicate cookie handling inline instead of using shared helper.

**AR-5. No Request Body Validation Library Across 30 Routes**
- **Severity:** High
- **Description:** Every route uses TypeScript `as` casts (type assertions, not runtime checks). Malformed input produces opaque 500 errors or corrupted data.
- **Fix:** Adopt Zod for request validation at API boundaries.

**AR-6. Missing Auth + Open Redirect on `/api/photos/serve`**
- **Severity:** High
- **File:** `src/app/api/photos/serve/route.ts:6-25`
- **Description:** No authentication check. Redirects to any URL starting with `http://` — exploitable for phishing (CWE-601). Middleware excludes `/api` from auth checking.

**AR-7. Feed Page Duplicates `useRoll` Hook Logic (115 lines)**
- **Severity:** High
- **File:** `src/app/(app)/feed/page.tsx:81-196` vs `src/hooks/useRoll.ts`
- **Description:** Feed page imports `useRollStore` directly, reimplements `handleCheck`, `handleAutoFill`, and active roll loading — all already provided by `useRoll` hook. Different error handling between implementations.

### Medium Findings

**AR-8.** `size_bytes` column typed `INT` (max 2.1GB) vs `storage_used_bytes` as `BIGINT` — inconsistency
**AR-9.** Day-approximation bug in memories date matching — month boundaries produce incorrect results — `memories/route.ts:63-67`
**AR-10.** Full table scan in memories endpoint — fetches ALL user photos then filters in JS — `memories/route.ts:33-39`
**AR-11.** Stripe webhook swallows errors (same as CQ-1) — always returns 200
**AR-12.** Year-in-review makes 7 sequential queries (same as CQ-12)
**AR-13.** No API rate limiting on processing/billing endpoints — `middleware.ts`
**AR-14.** Seed route accessible in production (same as CQ-4)
**AR-15.** `contentMode` state duplicated across 3 locations (same as CQ-28)
**AR-16.** Browser Supabase client not singleton — `lib/supabase/client.ts`
**AR-17.** Upload reads file twice (upload + hash computation) — `uploadBatch.ts:55-62,96-101`
**AR-18.** Upload always sends `width: 0, height: 0` — breaks screenshot detection entirely — `uploadBatch.ts:109-110`
**AR-19.** Processing pipeline runs inline in API route handler — will timeout for 36-photo rolls
**AR-20.** Inconsistent API response envelope (3+ different shapes across routes)
**AR-21.** No R2 object cleanup on user deletion — orphaned storage, GDPR risk

### Low Findings

**AR-22.** `PhotoCard` timer not stored in ref (same as CQ-22)
**AR-23.** S3Client recreated per request, not cached like Stripe (same as CQ-6)
**AR-24.** `isChecked` store method uses `get()` — doesn't trigger re-renders if used in JSX
**AR-25.** ErrorBoundary doesn't report to Sentry — `ErrorBoundary.tsx:29`
**AR-26.** `capturePhoto()` always returns null (same as CQ-3)

### Positive Observations

**P1. Clean Route Group Layout Architecture** — Textbook App Router design with `(app)/layout.tsx` for authenticated routes, `(auth)/layout.tsx` for auth pages, and root layout for global concerns only.

**P2. Comprehensive Security Headers** — `next.config.ts` includes HSTS (2-year max-age with preload), CSP with explicit allowlists, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.

**P3. Middleware Follows Supabase SSR Best Practices** — Correctly implements session refresh, cookie forwarding, and matcher patterns excluding static assets.

---

## Critical Issues for Phase 2 Context

The following findings should directly inform the Security & Performance review:

### Security-Critical
1. **Open redirect on `/api/photos/serve`** (AR-6) — unauthenticated endpoint redirects to arbitrary URLs
2. **Upload storage key injection** (CQ-5) — no ownership validation on storage keys
3. **Seed endpoint in production** (CQ-4/AR-14) — service role key accessible to any authenticated user
4. **XSS in email templates** (CQ-32) — unescaped user input in HTML emails
5. **`new Function()` eval equivalent** (CQ-17) — CSP bypass risk
6. **No request body validation** (AR-5) — all 30 routes use type assertions not runtime validation
7. **No API rate limiting** (AR-13) — processing/billing endpoints unprotected
8. **Client-controllable pricing** (CQ-14) — print checkout trusts client-provided price inputs
9. **Missing 6 database tables** (AR-1) — features with no RLS policies since tables don't exist

### Performance-Critical
1. **R2 client recreation** (CQ-6) — hundreds of S3Client instances per batch operation
2. **Synchronous develop pipeline** (CQ-7/AR-19) — 36-photo processing blocks HTTP request
3. **N+1 roll photo reorder** (CQ-11) — 35 sequential UPDATEs per photo removal
4. **Sequential year-in-review queries** (CQ-12) — 7-8 independent queries run serially
5. **Full table scan in memories** (AR-10) — fetches ALL photos then filters in JS
6. **O(n^2) duplicate detection** (CQ-25) — 124,750 comparisons for 500-photo batch
7. **Double file read in upload** (AR-17) — reads each file twice (upload + hash)
8. **Zero dimensions breaks screenshot detection** (AR-18) — `width: 0, height: 0` causes NaN ratios
9. **Browser Supabase client not singleton** (AR-16) — new instance on every hook call
