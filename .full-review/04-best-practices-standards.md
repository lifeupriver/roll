# Phase 4: Best Practices & Standards

## 4A: Framework & Language Best Practices

**Summary: 1 Critical, 6 High, 13 Medium, 12 Low (32 findings)**

### Critical

**BP-32. Open Redirect in `/api/photos/serve`**
- **Severity:** Critical
- **File:** `src/app/api/photos/serve/route.ts:13-15`
- **Description:** The `key` query parameter is taken from user input and, if it starts with `http://` or `https://`, is used directly in `NextResponse.redirect(key)`. An attacker can redirect users to arbitrary domains.
- **Fix:** Validate redirect targets against an allowlist of known domains (R2 public URL, picsum.photos).

### High

**BP-10. Supabase Client Instantiated Inline in Multiple API Routes**
- **Severity:** High
- **Files:** `src/app/api/upload/presign/route.ts:11-24`, `src/app/api/upload/complete/route.ts:11-24`, `src/app/api/photos/[id]/route.ts:12-25`, `src/app/api/process/filter/route.ts`
- **Description:** 4+ routes create the Supabase server client inline with identical cookie boilerplate, despite `createServerSupabaseClient()` existing in `src/lib/supabase/server.ts`. Risks inconsistency if the pattern needs updating.
- **Fix:** Replace all inline usages with `createServerSupabaseClient()`.

**BP-12. CSP Allows `unsafe-eval` for Scripts**
- **Severity:** High
- **File:** `next.config.ts:14`
- **Description:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'` significantly weakens XSS protection. `unsafe-eval` should only be used in development.
- **Fix:** Remove `unsafe-eval` from production CSP. Use nonce-based CSP with Next.js's built-in support.

**BP-15. All Pages Use `useEffect` + `fetch` Instead of Server Components**
- **Severity:** High
- **Files:** All pages under `src/app/(app)/` — `feed/page.tsx`, `library/page.tsx`, `circle/[id]/page.tsx`, etc.
- **Description:** Every page is a Client Component that loads data via `useEffect` + `fetch` to its own API routes. This is the pre-App Router (Pages Router) pattern. The App Router's core advantage is server-side data fetching, which sends less JS, avoids loading waterfalls, and enables streaming.
- **Fix:** Split pages into Server Component (data fetching) + Client Component (interactivity). Example:
```typescript
// feed/page.tsx (Server Component — no 'use client')
export default async function FeedPage() {
  const supabase = await createServerSupabaseClient();
  const { data: photos } = await supabase.from('photos').select('*')...;
  return <FeedView initialPhotos={photos ?? []} />;
}
```

**BP-16. `capturePhoto()` Always Returns null**
- **Severity:** High
- **File:** `src/hooks/useCameraCapture.ts:92-118`
- **Description:** `canvas.toBlob()` is callback-based and asynchronous, but `capturePhoto()` returns `file` synchronously. The variable is always `null` when returned.
- **Fix:** Make the function async and promisify `toBlob`:
```typescript
const capturePhoto = useCallback(async (): Promise<File | null> => {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  );
  if (!blob) return null;
  const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
  setCapturedPhotos((prev) => [...prev, file]);
  return file;
}, [isActive]);
```

**BP-23. `/api/search` Fetches ALL User Photos for Filter Options**
- **Severity:** High
- **File:** `src/app/api/search/route.ts:86-102`
- **Description:** After fetching search results, runs a second unbounded query for ALL user photos to build filter dropdowns. For users with thousands of photos, this is a major performance issue.
- **Fix:** Use Postgres `DISTINCT` via RPC or cache filter options separately.

**BP-24. Synchronous Sequential Processing in HTTP Request**
- **Severity:** High
- **File:** `src/app/api/process/develop/route.ts:127-157`
- **Description:** Processes every photo sequentially with `await delay(100)` per photo in a single HTTP request. For 36 photos = 3.6s minimum blocking time. Should be a background job.
- **Fix:** Insert a processing_job record and return immediately. Client already has polling logic.

### Medium (13 findings)

| ID | File | Description |
|----|------|-------------|
| BP-2 | `tsconfig.json` | `target: "ES2017"` too conservative — should be `ES2022` |
| BP-4 | `native.ts`, `push.ts` | Blanket `any` casts with eslint-disable suppressions |
| BP-5 | 30+ files | Pervasive `as Type` casts on Supabase results — use generated types |
| BP-7 | Circle pages | `params.id as string` instead of typed `useParams<{ id: string }>()` |
| BP-8 | `printStore.ts` | `status as PrintOrder['status']` on unvalidated string |
| BP-9 | Entire app | Zero Server Actions — all mutations via client fetch to API routes |
| BP-11 | 9+ routes | Missing `loading.tsx` and `error.tsx` boundaries |
| BP-14 | `layout.tsx` | Google Fonts via `<link>` tags instead of `next/font` (causes FOUT) |
| BP-17 | `PhotoCard.tsx` | Mutable `let` timer variable instead of `useRef` (memory leak) |
| BP-21 | `feed/page.tsx` | Duplicates roll check/uncheck logic already in `useRoll` hook |
| BP-22 | `r2.ts` | S3Client recreated on every request instead of singleton |
| BP-25 | `package.json` | `cap:sync` uses deprecated `next export` (removed in Next.js 13.5+) |
| BP-26 | `push.ts` | `new Function('mod', 'return require(mod)')` anti-pattern |
| BP-30 | `sentry.ts` | Manual `Sentry.init()` instead of official `@sentry/nextjs` config files |
| BP-31 | Supabase files | Non-null assertions (`!`) on environment variables |

### Low (12 findings)

| ID | File | Description |
|----|------|-------------|
| BP-1 | `package.json` | `@types/*` in `dependencies` instead of `devDependencies` |
| BP-3 | `tsconfig.json` | `jsx: "react-jsx"` should be `"preserve"` for Next.js |
| BP-6 | Stripe webhook | `as string` on union types (idiomatic for webhooks but risky) |
| BP-13 | `next.config.ts` | `serverActions` in `experimental` (stable since Next.js 14) |
| BP-18 | `PhotoCard.tsx` | Stale `useCallback` deps (fixed by BP-17 useRef fix) |
| BP-19 | `toastStore.ts` | Hook co-located with store (should be in hooks/) |
| BP-20 | `Toast.tsx`, `RollCard.tsx` | Inline `<style>` tags for keyframes (move to globals.css) |
| BP-27 | `stripe.ts` | `typescript: true` option deprecated/no-op in Stripe SDK v14+ |
| BP-28 | `package.json` | `postcss` in `dependencies` (should be devDependencies) |
| BP-29 | `src/app/` | Missing `not-found.tsx` at app root |

---

## 4B: Standards & Conventions Compliance

**Summary: 1 Critical, 5 High, 10 Medium, 8 Low, 5 Positive (29 findings)**

### Positive Findings (worth noting)

- **STD-5:** Consistent file naming conventions throughout all 154 files (PascalCase components, camelCase hooks/stores, use prefix for hooks, Store suffix for stores)
- **STD-18:** Good ARIA usage — 49 `aria-*` attributes across 19 files, proper roles on interactive components
- **STD-19:** Touch target sizes meet 44px minimum (WCAG 2.5.5 AAA)
- **STD-20:** Comprehensive reduced motion support at global and component levels
- **STD-28:** Lock file committed for reproducible builds

### Critical

**STD-30. CSP Contains `unsafe-eval` and `unsafe-inline`**
- **Severity:** Critical
- **File:** `next.config.ts:13-14`
- **Description:** `unsafe-eval` allows arbitrary code execution. `unsafe-inline` for scripts defeats CSP entirely.
- **Fix:** Remove `unsafe-eval`. Use nonce-based CSP for inline scripts.

### High

**STD-1. No ESLint Configuration File**
- **Severity:** High
- **File:** Missing — expected `eslint.config.mjs`
- **Description:** `package.json` declares ESLint dependencies and a `lint` script, but no config file exists. Next.js 16 with ESLint 9 requires a flat config. Without one, `next lint` may silently use minimal defaults.
- **Fix:** Create `eslint.config.mjs` with `eslint-config-next`, `@typescript-eslint`, and `react-hooks` rules.

**STD-8. Sentry `captureError` Defined But Never Called**
- **Severity:** High
- **File:** `src/lib/sentry.ts:30` (defines function); 0 files import it
- **Description:** The function wraps `Sentry.captureException` with context support, but no API route, hook, or component calls it. All error handling uses `console.error` (13 occurrences). Sentry receives zero programmatic error reports.
- **Fix:** Replace `console.error` calls in catch blocks with `captureError(err, { context: 'routeName' })`.

**STD-11. Stripe Webhook Swallows Errors with HTTP 200**
- **Severity:** High
- **File:** `src/app/api/webhooks/stripe/route.ts:83-86`
- **Description:** Catch block logs to console but returns `{ received: true }` with HTTP 200. Stripe will not retry. Error is silently lost.
- **Fix:** Return 500 status so Stripe retries. Add `captureError()`.

**STD-13. No Input Validation — Raw `as` Casts on 23 Routes**
- **Severity:** High
- **Files:** 23 API routes use `body as { field: type }`
- **Description:** Zero runtime validation. `{ name: 123 }` would be accepted as a string without error. Affects every mutable endpoint.
- **Fix:** Install `zod`, create schemas per route, validate with `schema.safeParse()`, return 400 with field errors.

**STD-16. Unauthenticated Photo Serve with Open Redirect**
- **Severity:** High
- **File:** `src/app/api/photos/serve/route.ts:6-25`
- **Description:** No auth check. Blindly redirects to any URL in `key` parameter starting with `http://`.
- **Fix:** Add auth check. Validate key against allowlist pattern. Remove external URL redirect path.

### Medium (10 findings)

| ID | Category | Description |
|----|----------|-------------|
| STD-2 | Formatting | No Prettier configuration — formatting depends on individual editors |
| STD-3 | Git Hygiene | No pre-commit hooks (husky/lint-staged) — nothing prevents unlinted commits |
| STD-9 | Observability | Missing Sentry instrumentation config files (server/edge errors not captured) |
| STD-10 | Logging | No structured logging — inconsistent `console.*` with varying formats |
| STD-12 | API Design | Inconsistent response envelope (some `{ data }`, some flat, some `{ success }`) |
| STD-14 | API Design | 4 routes duplicate Supabase client creation inline |
| STD-15 | API Design | Non-null assertions `!` on env vars (14 occurrences) |
| STD-21 | a11y | Modal missing focus trap — Tab can escape to elements behind overlay |
| STD-23 | a11y | Context menu not keyboard accessible (no Shift+F10, no arrow keys) |
| STD-25 | i18n | All strings hardcoded in English — no i18n framework or string catalog |

### Low (8 findings)

| ID | Category | Description |
|----|----------|-------------|
| STD-4 | Git Hygiene | No `.editorconfig` |
| STD-6 | Organization | No barrel exports (`index.ts`) in component directories |
| STD-7 | Error Handling | Unused `error` param in error boundary pages (not logged to Sentry) |
| STD-17 | API Design | Auth boilerplate duplicated across 35+ routes (could use `withAuth` wrapper) |
| STD-22 | a11y | Modal missing `aria-labelledby` |
| STD-24 | a11y | High contrast mode only covers light theme, misses dark |
| STD-26 | i18n | No RTL support (acceptable for English-only product) |
| STD-27 | Git Hygiene | `.gitignore` missing `.turbo`, `ios/`, `android/` directories |
| STD-29 | Config | `vercel.json` references non-existent `eyeq` and `prodigi` paths |
