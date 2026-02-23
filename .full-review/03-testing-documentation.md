# Phase 3: Testing & Documentation Review

## Test Coverage Findings

**Summary: 5 Critical, 7 High, 5 Medium findings (17 total)**

**The Headline: The Roll application has ZERO automated tests.** No test files, no test configuration (`vitest.config`, `jest.config`, `playwright.config`), no test runner dependencies in `package.json`, no `"test"` script. Every code path in all 154 source files ships completely unverified. The `devDependencies` contain only ESLint.

See full detailed analysis with Vitest code examples: `roll-app/TEST_COVERAGE_AUDIT.md`

### Critical Findings

**TEST-1. No Test Infrastructure Exists**
- **Severity:** Critical
- **Description:** Zero test files, zero config, zero CI integration. No test runner in dependencies. The only quality gate is ESLint. Every deployment is untested.
- **Recommendation:** Set up Vitest with React Testing Library. Add `vitest.config.ts`, test setup file, and `"test"` script to package.json. Target: 200 tests, 60% coverage within 4 weeks.

**TEST-2. Open Redirect Has No Security Test**
- **Severity:** Critical
- **File:** `src/app/api/photos/serve/route.ts:14`
- **Description:** The open redirect vulnerability (accepts any `https://` URL) has no test to prevent regression once fixed.
- **Recommended Test:**
```typescript
describe('/api/photos/serve', () => {
  it('rejects redirect to external domains', async () => {
    const res = await GET(new NextRequest('http://localhost/api/photos/serve?key=https://evil.com'));
    expect(res.status).toBe(403);
  });
  it('requires authentication', async () => {
    const res = await GET(new NextRequest('http://localhost/api/photos/serve?key=photos/test.jpg'));
    expect(res.status).toBe(401);
  });
});
```

**TEST-3. Seed Endpoint Production Guard Has No Test**
- **Severity:** Critical
- **File:** `src/app/api/seed/route.ts`
- **Description:** The seed endpoint using service role key has no test verifying it's blocked in production.
- **Recommended Test:** Assert that POST and DELETE return 403 when `NODE_ENV=production`.

**TEST-4. Client-Controllable Pricing Has No Validation Test**
- **Severity:** Critical
- **File:** `src/app/api/billing/print-checkout/route.ts:23-33`
- **Description:** No test verifies that the server looks up pricing from the database rather than trusting client input.
- **Recommended Test:** Submit mismatched `photoCount` and verify the server uses the DB value.

**TEST-5. Stripe Webhook Error Handling Has No Test**
- **Severity:** Critical
- **File:** `src/app/api/webhooks/stripe/route.ts:83-86`
- **Description:** No test verifies that database failures result in 500 (not 200) responses to Stripe.
- **Recommended Test:**
```typescript
describe('Stripe webhook', () => {
  it('returns 500 on database error so Stripe retries', async () => {
    // Mock Supabase to throw on .update()
    const res = await POST(webhookRequest);
    expect(res.status).toBe(500);
  });
});
```

### High Findings

**TEST-6. XSS in Email Templates — No Escaping Tests**
- **Severity:** High
- **File:** `src/lib/email/templates.ts`
- **Description:** User-provided values (`rollName`, `inviterName`, `circleName`) interpolated into HTML with no escaping and no test for HTML injection.
- **Recommended Test:** Assert that `<script>alert(1)</script>` in display name is escaped in output HTML.

**TEST-7. Upload Storage Key Injection — No Authorization Test**
- **Severity:** High
- **File:** `src/app/api/upload/complete/route.ts:79`
- **Description:** No test verifies that storage keys are validated against the authenticated user's prefix.
- **Recommended Test:** Submit `storageKey: 'originals/other-user-id/photo.jpg'` and assert 403.

**TEST-8. Circle Join Race Condition — No Concurrency Test**
- **Severity:** High
- **File:** `src/app/api/circles/join/[token]/route.ts:76-89`
- **Description:** Read-modify-write race on `member_count` with no concurrent test.
- **Recommended Test:** Fire 10 concurrent join requests and verify `member_count` equals 10.

**TEST-9. `capturePhoto()` Returns null — No Regression Test**
- **Severity:** High
- **File:** `src/hooks/useCameraCapture.ts:106-117`
- **Description:** `canvas.toBlob()` is async but function returns synchronously. No test catches this.
- **Recommended Test:** Mock `canvas.toBlob`, call `capturePhoto()`, assert result is a File (not null).

**TEST-10. Perceptual Hash Wrong Pixel Subset — No Unit Test**
- **Severity:** High
- **File:** `src/lib/processing/duplicateDetection.ts:7-28`
- **Description:** Resizes to 32x32 (1024 pixels) but hashes only first 64 (top-left 6.25%). No test validates hash quality.
- **Recommended Test:** Generate two images differing only in bottom-right quadrant, verify different hashes.

**TEST-11. Entire Image Processing Pipeline Untested**
- **Severity:** High
- **Files:** `src/lib/processing/` (6 detection modules + pipeline orchestrator)
- **Description:** Pure computational functions (blur detection, screenshot detection, exposure detection, document detection, duplicate detection) have zero tests despite being ideal candidates for unit testing.
- **Recommended Tests:** Test each detection module with known-good and known-bad sample images.

**TEST-12. Both Webhook Handlers Untested**
- **Severity:** High
- **Files:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/prodigi/route.ts`
- **Description:** Stripe subscription lifecycle (checkout, renewal, cancellation) and Prodigi fulfillment status updates have no integration tests.
- **Recommended Tests:** Test each event type with mock payloads, verify DB state changes.

### Medium Findings

**TEST-13.** All 8 Zustand stores have state transition logic with no tests
**TEST-14.** Roll status machine (5 states with validated transitions) has no tests
**TEST-15.** Middleware auth flow (protected route enforcement, auth page redirects) has no tests
**TEST-16.** Upload validation (file size limits, content type allowlists, batch limits) has no tests
**TEST-17.** Roll creation has no idempotency mechanism against rapid double-clicks

### Recommended Test Infrastructure

```json
// package.json additions
{
  "devDependencies": {
    "vitest": "^3.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@vitejs/plugin-react": "^4.x"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Recommended Test Pyramid (4-week plan)
- **Week 1:** Infrastructure + 40 unit tests for processing pipeline, stores, and utilities
- **Week 2:** 60 unit tests for API route handlers (security-critical paths first)
- **Week 3:** 40 integration tests for webhook handlers, upload flow, billing flow
- **Week 4:** 20 E2E tests for critical user journeys + performance benchmarks
- **Target:** ~200 tests, 60% line coverage

---

## Documentation Findings

**Summary: 5 Critical, 6 High, 6 Medium, 3 Low findings (20 total)**

### Critical Findings

**DOC-1. Database Schema Documentation Doesn't Match Migration**
- **Severity:** Critical
- **Files:** `rollDATA_MODEL.md` vs `supabase/migrations/001_create_all_tables.sql`
- **Description:** The data model documentation describes tables and columns that don't exist in the actual migration. 6 tables referenced in code (`push_subscriptions`, `referrals`, `people`, `photo_tags`, `circle_comments`, `collections`) are missing from the migration. 3 profile columns (`stripe_customer_id`, `stripe_subscription_id`, `referral_code`) are missing.
- **Recommendation:** Reconcile documentation with actual migration. Add migration for missing tables. Mark planned-but-unimplemented features clearly.

**DOC-2. Architecture Documentation Describes Aspirational, Not Actual, System**
- **Severity:** Critical
- **Files:** `rollARCHITECTURE.md` vs actual source code
- **Description:** Architecture docs describe background job processing, queue systems, and async pipelines. The actual implementation processes everything synchronously within HTTP request handlers. The develop route simulates processing with `delay(100)` instead of actual Sharp transformations.
- **Recommendation:** Rewrite architecture docs to reflect current synchronous implementation. Add a "Future Architecture" section for the planned async pipeline.

**DOC-3. Security Documentation Doesn't Match Actual Security Posture**
- **Severity:** Critical
- **Files:** `rollSECURITY.md` vs actual implementation
- **Description:** Security docs may describe rate limiting, webhook signature verification, and input validation that don't exist. CSP headers in `next.config.ts` include `unsafe-eval` and `unsafe-inline` not mentioned in security docs. The `/api/photos/serve` open redirect and unauthenticated `/api` routes are not documented as known risks.
- **Recommendation:** Audit security docs against actual implementation. Document known vulnerabilities and their remediation timeline.

**DOC-4. API Endpoint Documentation Incomplete or Missing**
- **Severity:** Critical
- **Description:** 30 API routes exist with no API documentation (no OpenAPI spec, no request/response schemas documented, no error code catalog). The `rollBACKEND.md` may describe intended APIs but doesn't match the actual inconsistent response envelope (some use `{ data }`, some flat objects, some `{ success: true }`).
- **Recommendation:** Generate API documentation from actual route handlers. Document request/response schemas, auth requirements, and error codes for all 30 endpoints.

**DOC-5. Environment Variable Documentation Insufficient**
- **Severity:** Critical
- **File:** `roll-app/.env.local.example`
- **Description:** Lists 22 environment variables with no guidance on which are required vs optional, no descriptions, no example values for non-secret vars. Missing vars for features like web push (`VAPID_PRIVATE_KEY`). The `EYEQ_*` vars are referenced but the eyeQ integration doesn't appear in the actual code.
- **Recommendation:** Add inline comments with: required/optional status, description, example value (for non-secrets), and which features depend on each var.

### High Findings

**DOC-6.** No README.md in the `roll-app/` directory — no setup instructions, no dev workflow, no contribution guide
**DOC-7.** Processing pipeline has zero inline documentation — complex algorithms (blur detection via Laplacian variance, perceptual hashing, exposure histogram analysis) have no explanatory comments
**DOC-8.** Deployment documentation (`rollDEPLOYMENT.md`) doesn't cover Vercel function timeouts, R2 bucket setup, or Supabase migration process
**DOC-9.** No ADRs (Architecture Decision Records) for key choices: why Zustand over Context, why R2 over Supabase Storage, why Sharp over client-side processing
**DOC-10.** `rollFRONTEND.md` and `rollBACKEND.md` describe planned features as if implemented — misleading for developers joining the project
**DOC-11.** Develop route queries `users` table instead of `profiles` — discrepancy between code and any documentation referencing the data model

### Medium Findings

**DOC-12.** No changelog or version history — 11 development phases with no documented breaking changes
**DOC-13.** Webhook integration docs don't include payload examples or testing instructions
**DOC-14.** Capacitor mobile configuration documented but no mobile build/test instructions
**DOC-15.** Design system documentation (`rollDESIGN_SYSTEM.md`) may not match actual Tailwind CSS 4 implementation
**DOC-16.** No runbook for common operational tasks (database migrations, monitoring alerts, incident response)
**DOC-17.** PRD feature scope drift — features described in `rollprd.md` that don't exist in code, and code features not in PRD

### Low Findings

**DOC-18.** No JSDoc/TSDoc on exported functions across library modules
**DOC-19.** No inline comments on complex regex patterns or magic numbers in processing modules
**DOC-20.** File-level documentation (module purpose headers) missing across all source files
