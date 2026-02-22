# Roll — Claude Code Kickoff Prompt

> Copy everything below this line and paste it into Claude Code to start building Phase 1.

---

## Before You Start

Read `CLAUDE for Roll.md` in the root of this repo first — it is your single source of truth for the entire project.

Then read every document in the repo in this order:
1. rollPRD.md
2. rollARCHITECTURE.md
3. rollDESIGN_SYSTEM.md
4. rollDATA_MODEL.md
5. rollFRONTEND.md
6. rollBACKEND.md
7. rollSECURITY.md
8. rollDEPLOYMENT.md
9. rollAPI_INTEGRATIONS.md
10. rollROADMAP.md

These documents contain all specifications, patterns, and requirements you need to build Phase 1 without asking questions.

---

## Project Overview

Roll is a web application that rescues photos from the digital graveyard. Here's what it does:

- **Upload & Filter**: Users upload photo libraries; the system automatically filters out junk (screenshots, duplicates, blurry photos, over/under-exposed images, documents)
- **Selection**: Users checkmark exactly 36 photos into a "roll" (their curated selection)
- **Film Processing**: Roll applies film aesthetic profiles (color correction via eyeQ, custom LUTs, grain) to create a cohesive visual style
- **Print Delivery**: Real prints are manufactured and shipped via Prodigi API
- **Circle Sharing**: Roll+ subscribers can create private circles to share rolls with friends
- **Future**: Film marketplace, unlimited rolls, print analytics

**Tech Stack**: Next.js 15 (App Router), React 19, TypeScript (strict mode), Tailwind CSS 4, Supabase (PostgreSQL + Auth), Cloudflare R2 (object storage), Sharp (image processing), Zustand (state), Vercel (hosting), Prodigi API (print on demand), eyeQ/Perfectly Clear (color correction), Resend (email)

**Current Phase**: Phase 1 — Foundation + Core Loop (Weeks 1–4)

---

## What Phase 1 Includes

Phase 1 covers weeks 1–4 and establishes the foundation for Roll. By the end of Phase 1, the app is a deployed web application where users can:

1. Sign up with a magic link or password
2. Upload a photo library
3. See their photos automatically filtered (junk removed)
4. Browse a clean feed with content mode switching (All / People / Landscapes)
5. Manually hide individual photos they don't want to see

**Phase 1 does NOT include**: roll building, film selection, processing, favorites, prints, Circle, or marketplace features. These are Phase 2+.

---

## Phase 1 Detailed Task List

**Do these tasks in order.** Read the relevant documentation section before implementing each task. After completing each task, verify it works before moving to the next.

### Week 1: Project Scaffolding, Design System, Base Components, State Management

**Task 1: Initialize Next.js 15 project**
- Initialize with `create-next-app` using Next.js 15, App Router, TypeScript (strict mode), Tailwind CSS 4
- Configure `tsconfig.json` with strict mode enabled, path aliases (`@/*` → `src/*`)
- Set up `.env.local` with placeholders for Supabase URL, anon key, service role key, Cloudflare R2 variables, Prodigi API key, Resend key
- Install dependencies: `zustand`, `@supabase/supabase-js`, `sharp`, `js-sha256`, `resend`, `tailwindcss-animate` (see rollBACKEND.md for full list)
- Reference: rollARCHITECTURE.md "Project Structure"

**Task 2: Set up directory structure**
- Create folders per CLAUDE for Roll.md project structure: `src/app`, `src/components` (with `ui/`, `photo/`, `circle/`, `print/`, `layout/`), `src/lib` (with `supabase/`, `processing/`, `prodigi/`, `storage/`, `utils/`), `src/stores`, `src/types`, `src/hooks`, `public`, `supabase`
- Create `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/storage/r2.ts`, `src/lib/processing/pipeline.ts` as placeholders (will be filled in later tasks)
- Reference: rollARCHITECTURE.md "Project Structure"

**Task 3: Configure Tailwind CSS v4 design tokens**
- Roll uses **Tailwind CSS v4's native `@theme` configuration** — there is NO `tailwind.config.ts`. All tokens are defined in `src/app/globals.css` inside `@theme {}` blocks.
- Copy the complete `@theme` block from rollDESIGN_SYSTEM.md Section 2.1 into `globals.css`. This includes:
  - **Primitive color tokens** named from film photography: `--color-paper`, `--color-darkroom`, `--color-safelight`, `--color-fixer`, `--color-developer`, `--color-stock-*` (6 film profiles), etc.
  - **Semantic color tokens** that map primitives to usage: `--color-surface`, `--color-ink`, `--color-action`, `--color-border`, etc.
  - **Typography:** `--font-display` (Cormorant Garamond), `--font-body` (Plus Jakarta Sans), `--font-mono` (Space Mono); type scale from `--text-caption` (12px) to `--text-logotype` (48px)
  - **Spacing:** `--space-micro` (4px) through `--space-hero` (64px)
  - **Radii:** `--radius-sharp` (4px), `--radius-card` (8px), `--radius-modal` (12px), `--radius-pill` (9999px)
  - **Shadows:** `--shadow-raised`, `--shadow-floating`, `--shadow-overlay` — warm-tinted, using darkroom color
- Add the dark mode tokens from rollDESIGN_SYSTEM.md Section 2.2 using `@custom-variant dark` and `@layer base`
- Add the film grain texture CSS from rollDESIGN_SYSTEM.md Section 7
- Add accessibility overrides: high-contrast mode (`@media (prefers-contrast: high)`), reduced motion (`@media (prefers-reduced-motion: reduce)`), focus ring using `--color-border-focus`
- Reference: rollDESIGN_SYSTEM.md Sections 2, 7, 9

**Task 4: Create base UI components**
- Implement these reusable components in `src/components/ui/`, following the design language in rollDESIGN_SYSTEM.md Section 5:
  - `Button.tsx` — Primary (safelight: `--color-action` bg, `--color-ink-inverse` text, `--radius-sharp`), Secondary (outlined, `--color-border-strong`), Ghost (text-only, underline on hover). Active state: `scale(0.98)` like a shutter release. See rollDESIGN_SYSTEM.md 5.1.
  - `Input.tsx` — Sunken surface (`--color-surface-sunken`), `--color-border` border, `--color-border-focus` on focus-visible. Error state with `--color-error`.
  - `Card.tsx` — `--color-surface-raised` background, `--radius-card`, `--shadow-raised`, padding `--space-component`. See rollDESIGN_SYSTEM.md Section 4 elevation system.
  - `Modal.tsx` — `--color-surface-overlay` (darkroom) background, `--shadow-overlay`, focus trap, close on Escape. Opening animation: 300ms cubic-bezier(0.16, 1, 0.3, 1) — the darkroom door swing.
  - `Spinner.tsx` — `--color-processing` (amber), centered
  - `Badge.tsx` — Status variants using `--color-developed`, `--color-processing`, `--color-action`
  - `Empty.tsx` — Empty state with `--color-ink-tertiary` text, `--text-body`
  - `ErrorBoundary.tsx` — Catches errors, displays fallback with `--color-error`, logs to console
- All components must reference design tokens by CSS variable (never hardcoded hex values), support TypeScript, include JSDoc comments
- Reference: rollDESIGN_SYSTEM.md Sections 4–5, rollFRONTEND.md Section 3 (Component Specs)

**Task 5: Create layout components**
- Implement `src/components/layout/RootLayout.tsx` — Auth check, loads Google Fonts (Cormorant Garamond 300/400/500/700, Plus Jakarta Sans 300/500/600, Space Mono 400/700), applies film grain texture class to body, mobile-first responsive
- Implement `src/components/layout/AuthLayout.tsx` — Centered form on `--color-surface` background, max-width 400px, vertical centering, "ROLL" logotype above form in `--font-display` with wide tracking
- Implement `src/components/layout/AppLayout.tsx` — Authenticated app shell: desktop has left sidebar (240px, same surface as canvas + border separator), mobile has bottom tab bar (56px, 4 icons + labels). Navigation uses Lucide icons at 24px/1.5px stroke.
- All layouts: use design tokens from `globals.css`, support `@custom-variant dark` preparation, include meta tags
- Reference: rollFRONTEND.md Section 3.1 (AppShell), rollDESIGN_SYSTEM.md Sections 8, 10

**Task 6: Set up Zustand stores**
- Create `src/stores/userStore.ts` with fields: user, session, loading, error, login(), logout(), setUser()
- Create `src/stores/photoStore.ts` with fields: photos (array), contentMode ('all' | 'people' | 'landscapes'), selectedPhotoIds (Set), setPhotos(), setContentMode(), togglePhotoSelection(), hidePhoto()
- Create `src/stores/filterStore.ts` with fields: contentMode, sortOrder, isFilterPanelOpen, setContentMode(), setSortOrder(), toggleFilterPanel()
- Create `src/stores/rollStore.ts` with fields: currentRoll, rollCount (0–36), filmProfile, setRoll(), incrementCount(), setFilmProfile() — stub for Phase 2 but structure now
- Each store must export the hook (useUserStore, usePhotoStore, useFilterStore, useRollStore) and define TypeScript types for state
- Reference: rollFRONTEND.md Section 4 (State Management), rollARCHITECTURE.md "State Management"

**Task 7: Create authentication type definitions**
- Create `src/types/auth.ts` with TypeScript interfaces:
  - `User` (id, email, display_name, created_at, updated_at, subscription_tier)
  - `Session` (access_token, refresh_token, expires_in, user)
  - `LoginCredentials` (email, password)
  - `SignupCredentials` (email, password, confirm_password, display_name)
- Add validation utility functions: `isValidEmail()`, `isValidPassword()` (per rollSECURITY.md requirements)
- Reference: rollDATA_MODEL.md "profiles table" (Section 2.1), rollSECURITY.md "Input Validation"

**Task 8: Create photo type definitions**
- Create `src/types/photo.ts` with TypeScript interfaces matching rollDATA_MODEL.md Section 2.2:
  - `Photo` (id, user_id, storage_key, thumbnail_url, lqip_base64, filename, content_hash, content_type, size_bytes, width, height, date_taken, latitude, longitude, camera_make, camera_model, filter_status, filter_reason, aesthetic_score, phash, face_count, scene_classification, created_at, updated_at)
  - `FilterStatus` (type: 'pending' | 'visible' | 'filtered_auto' | 'hidden_manual')
  - `FilterReason` (type: 'blur' | 'screenshot' | 'duplicate' | 'exposure' | 'document' | null)
  - `ContentMode` (type: 'all' | 'people' | 'landscapes')
  - `UploadProgress` (file, progress, status)
- Reference: rollDATA_MODEL.md Section 2.2 "photos table"

**Task 9: Create shared hook definitions**
- Create `src/types/hooks.ts` and `src/hooks/useUser.ts` (returns current user and loading state)
- Create `src/hooks/useAuth.ts` (returns login, logout, signup functions)
- Create `src/hooks/usePhotos.ts` (returns photos, filter, selection, loading state)
- Each hook must integrate with Zustand stores and handle error states
- Reference: rollFRONTEND.md Section 4 (State Management — stores define the hook interfaces)

### Week 2: Authentication & Photo Upload

**Task 10: Set up Supabase client**
- Create `src/lib/supabase.ts` with:
  - Supabase client initialization (URL, anon key from env)
  - Auth helper functions: `signUpWithPassword()`, `signInWithPassword()`, `signInWithMagicLink()`, `signOut()`, `getCurrentUser()`
  - Session persistence (check auth on app load)
- Add RLS policy placeholders (will configure in Week 3)
- Reference: rollBACKEND.md "Supabase Setup", rollSECURITY.md "RLS Policies"

**Task 11: Implement magic link auth flow**
- Create `src/app/(auth)/login/page.tsx`:
  - Email input field
  - "Send Magic Link" button (primary CTA)
  - Password login form below (secondary)
  - Loading state, error display
  - Success message: "Check your email for a link to sign in"
- Create `src/app/(auth)/callback/page.tsx`:
  - Handles `?code=` and `?error=` query params from Supabase magic link
  - Sets session from magic link token
  - Redirects to `/(app)` on success or back to `/(auth)/login` on error
- Integrate with `src/lib/supabase/client.ts` magic link functions
- Reference: rollBACKEND.md "Magic Link Auth", rollFRONTEND.md Section 2.2–2.3 (Auth pages)

**Task 12: Implement password signup and login**
- Create `src/app/auth/signup/page.tsx`:
  - Fields: email, password, confirm password, display name
  - Client-side validation (email format, password strength per rollSECURITY.md)
  - Sign up button, link to login
  - Error handling (email exists, weak password, mismatch)
- Create `src/app/auth/login/page.tsx`:
  - Fields: email, password
  - Login button, link to signup, link to magic link
  - Error handling (invalid credentials)
- Both pages use `src/components/layout/AuthLayout.tsx` for consistent styling
- Reference: rollBACKEND.md "Password Auth", rollFRONTEND.md Section 2.2 (Login page), rollSECURITY.md "Password Requirements"

**Task 13: Create authenticated user session check**
- Create `src/middleware.ts` that:
  - Checks for valid session on every route
  - Redirects unauthenticated users to `/auth/login`
  - Allows access to `/auth/*` for non-authenticated users
  - Adds `user` object to request headers for use in API routes
- Create `src/lib/auth.ts` with `getServerSession()` helper for API routes
- Reference: rollBACKEND.md "Session Management", rollFRONTEND.md Section 1.3 (Middleware)

**Task 14: Set up Cloudflare R2 connection**
- Create `src/lib/r2.ts` with:
  - R2 client initialization (account ID, bucket name, access key, secret from env)
  - Function `getPresignedUploadUrl(filename, contentType)` → returns { url, headers }
  - Function `deleteObject(filename)` → deletes from R2
  - Function `getPresignedDownloadUrl(filename)` → returns signed URL valid for 1 hour
- Add error handling for missing credentials
- Reference: rollBACKEND.md "Cloudflare R2 Setup", rollAPI_INTEGRATIONS.md "R2 API"

**Task 15: Implement HEIC/HEIF to JPEG conversion with Sharp**
- Create `src/lib/sharp.ts` with:
  - Function `convertHeicToJpeg(buffer)` → returns JPEG Buffer
  - Function `createThumbnail(buffer)` → returns WebP thumbnail Buffer (400px wide, preserving aspect ratio)
  - Function `getImageDimensions(buffer)` → returns { width, height }
  - Proper error handling (invalid image, unsupported format)
- Use Sharp with progressive JPEG, quality 85 for originals, quality 75 for thumbnails
- Reference: rollBACKEND.md "Image Processing", rollAPI_INTEGRATIONS.md "Sharp Library"

**Task 16: Create two-step photo upload endpoints**
- Create `src/app/api/upload/presign/route.ts` (POST) per rollBACKEND.md Section 2.1:
  - Accepts JSON: `{ files: [{ filename, contentType, sizeBytes }] }`
  - Validates: max 500 files, max 50MB each, allowed content types (image/jpeg, image/heic, image/png, image/webp)
  - Generates presigned R2 upload URLs for each file
  - Returns: `{ uploads: [{ filename, uploadUrl, storageKey, headers }] }`
- Create `src/app/api/upload/complete/route.ts` (POST) per rollBACKEND.md Section 2.2:
  - Accepts JSON with uploaded file details (storageKey, contentHash, dimensions, EXIF data, thumbnailBase64)
  - Checks for duplicate content_hash → skip duplicates
  - Inserts photo records into `photos` table (batch insert)
  - Generates 400px WebP thumbnails via Sharp, uploads to R2
  - Queues filtering job via `processing_jobs` table
  - Returns: `{ created, duplicatesSkipped, photoIds, filterJobId }`
- Both endpoints: authenticate (check Supabase session)
- Reference: rollBACKEND.md Sections 2.1–2.2, rollSECURITY.md "File Validation"

**Task 17: Create upload UI component**
- Create `src/components/PhotoUpload.tsx`:
  - Drag-and-drop zone + click to browse
  - Multi-file selection (accept image formats)
  - Shows upload progress per file (% complete)
  - Displays errors (file too large, invalid format, network error)
  - After upload, shows success toast
  - Disable inputs while uploading
- Use `src/hooks/usePhotos.ts` to update photo store after each upload
- Reference: rollFRONTEND.md Section 3 (Component Specs)

**Task 18: Create batch upload handler**
- Create `src/lib/uploadBatch.ts`:
  - Function `uploadPhotos(files)` → uploads all files concurrently (max 5 parallel)
  - Tracks progress per file
  - Returns array of upload results with errors
  - Includes retry logic for failed uploads (max 2 retries)
- Called from PhotoUpload component
- Reference: rollBACKEND.md "Batch Upload"

### Week 3: Database Migrations, RLS, Filtering Pipeline

**Task 19: Create Supabase database schema**
- Create migration file that creates all 14 tables per rollDATA_MODEL.md Section 1:
  - profiles, photos, rolls, roll_photos, favorites, circles, circle_members, circle_invites, circle_posts, circle_post_photos, circle_reactions, print_orders, print_order_items, processing_jobs
- Copy exact column definitions, constraints, and indexes from rollDATA_MODEL.md Sections 2.1–2.14
- Key: `photos` table uses `filter_status` enum (pending/visible/filtered_auto/hidden_manual) and `filter_reason` — NOT boolean flags
- Enable RLS on all tables
- Add created_at and updated_at columns (with defaults) to all tables
- Migration should be idempotent (run `CREATE TABLE IF NOT EXISTS`)
- Reference: rollDATA_MODEL.md Sections 2.1–2.14

**Task 20: Implement RLS policies**
- Create migration file with RLS policies per rollSECURITY.md and rollDATA_MODEL.md:
  - `profiles`: users can SELECT any profile, UPDATE only their own (WHERE user_id = auth.uid())
  - `photos`: users can only SELECT/INSERT/UPDATE/DELETE their own photos (WHERE user_id = auth.uid())
  - `rolls`: users can manage only their own rolls
  - `processing_jobs`: users can SELECT their own jobs
  - Future tables: circles, prints, favorites, etc. (placeholder policies for Phase 1)
- Use `auth.uid()` in all policies
- Test policies with mock requests
- Reference: rollSECURITY.md "RLS Policies", rollDATA_MODEL.md Sections 3.1–3.14

**Task 21: Create photos table Supabase API integration**
- Implement in `src/lib/supabase/server.ts`:
  - `insertPhotos(photos[])` → batch inserts rows into `photos` table, returns photo objects
  - `getVisiblePhotos(userId, contentMode)` → fetches photos with `filter_status = 'visible'`; if contentMode is 'people', add `face_count > 0`; if 'landscapes', filter by `scene_classification`
  - `getPhotoById(photoId)` → fetches single photo
  - `updatePhotoFilterStatus(photoId, filterStatus, filterReason)` → updates filter_status and filter_reason columns
  - `hidePhoto(photoId)` → sets `filter_status = 'hidden_manual'`
- All queries must use typed responses (Photo type from rollDATA_MODEL.md Section 2.2). Note: metadata fields (filter_status, filter_reason, aesthetic_score, phash, face_count, scene_classification) are ON the `photos` table — there is no separate metadata table.
- Reference: rollBACKEND.md "Photo CRUD", rollDATA_MODEL.md Section 2.2

**Task 22: Implement screenshot detection filter**
- Create `src/lib/processing/screenshotDetection.ts`:
  - Function `detectScreenshot(metadata, exifData)` → returns boolean
  - Logic per rollBACKEND.md Section 3.2: Dimension ratio 9:16 or 9:19.5 + no camera_make in EXIF
- Reference: rollBACKEND.md Section 3.2 "Filter Thresholds"

**Task 23: Implement blur detection filter**
- Create `src/lib/processing/blurDetection.ts`:
  - Function `detectBlur(image)` → returns number (Laplacian variance score)
  - Logic: Laplacian variance analysis via Sharp, threshold < 100 = blurry
- Reference: rollBACKEND.md Section 3.2

**Task 24: Implement duplicate detection filter**
- Create `src/lib/processing/duplicateDetection.ts`:
  - Function `computePerceptualHash(image)` → returns string (64-bit hex pHash)
  - After batch processing, compare pHash hamming distances. If distance < 5, mark as duplicate — keep the photo with highest aesthetic_score
- Reference: rollBACKEND.md Section 3.1 "Duplicate collapsing"

**Task 25: Implement exposure + document detection filters**
- Create `src/lib/processing/exposureDetection.ts`:
  - Function `detectExposure(stats)` → returns { isOverExposed, isUnderExposed }
  - Logic: Mean pixel value > 230 = over-exposed, < 25 = under-exposed
- Create `src/lib/processing/documentDetection.ts`:
  - Function `detectTextRegions(image)` → returns number (text region ratio, 0–1)
  - If text region > 0.4, mark as document
- Reference: rollBACKEND.md Section 3.2

**Task 26: Create filtering pipeline + face detection + scene classification**
- Create `src/lib/processing/pipeline.ts` per rollBACKEND.md Section 3.1:
  - Function `filterPhoto(photo)` → runs all 5 detections + face detection + scene classification, returns `FilterResult`
  - FilterResult: `{ filter_status, filter_reason, aesthetic_score, face_count, scene_classification, phash }`
  - `filter_status`: 'filtered_auto' if any filter triggers, otherwise 'visible'
  - `filter_reason`: first triggering filter ('screenshot' | 'blur' | 'exposure' | 'document' | 'duplicate') or null
  - `face_count`: number of detected faces (for People content mode)
  - `scene_classification`: string[] labels (for Landscapes content mode)
  - Updates photo record directly on `photos` table (no separate metadata table)
  - Process in parallel (Promise.allSettled with concurrency limit of 5), target 100 photos in < 30s
- Called after `POST /api/upload/complete` queues the filtering job
- Reference: rollBACKEND.md Section 3.1 "Filtering Pipeline"

**Task 27: Create feed data fetching (client-side Supabase query)**
- The feed is NOT a separate API route — it's a client-side Supabase query via `src/lib/supabase/client.ts` and the `usePhotos` hook.
- Implement feed query logic in `src/hooks/usePhotos.ts`:
  - Query param `contentMode` ('all' | 'people' | 'landscapes')
  - Base query: `photos` table WHERE `user_id = auth.uid()` AND `filter_status = 'visible'`
  - Content mode filters:
    - `all`: just the base query (all visible photos)
    - `people`: add `face_count > 0`
    - `landscapes`: add `scene_classification` contains landscape-related labels
  - Pagination: 20 photos per page, cursor-based (ordered by date_taken DESC, then created_at DESC)
  - Authenticated via Supabase client (RLS enforces user_id automatically)
- Reference: rollFRONTEND.md Section 2.5 (Feed page), rollDATA_MODEL.md Section 2.2

### Week 4: App Shell, Photo Display, Manual Hide, Onboarding

**Task 28: Create app shell with tab navigation**
- Create `src/app/app/layout.tsx` (authenticated app root):
  - Desktop: Left sidebar (240px), same `--color-surface` as canvas, separated by `--color-border` line. "ROLL" logotype in `--font-display` at top. Nav items with Lucide icons (24px, 1.5px stroke).
  - Mobile: Bottom tab bar (56px height), 4 tabs: Feed (`grid-3x3`), Library (`image`), Circle (`users`), Account (`user`). Active tab: `--color-action`. Inactive: `--color-ink-tertiary`.
  - Page transitions: 250ms cubic-bezier(0.16, 1, 0.3, 1) — the photo-book page flip deceleration
- Create `src/app/app/page.tsx` (Feed page, default tab)
- Reference: rollFRONTEND.md Section 2 (Page Specs), rollDESIGN_SYSTEM.md Sections 8, 10

**Task 29: Create PhotoGrid and PhotoCard components**
- Create `src/components/PhotoGrid.tsx` — **Contact sheet grid**, NOT masonry:
  - Desktop (≥1024px): 3 columns. Tablet (768–1024px): 2 columns. Mobile (<768px): 2 columns.
  - Gap: `var(--space-micro)` (4px) — contact sheet gap, photos nearly touching. NOT 8px or larger.
  - **No border-radius** on grid photos — contact sheets have sharp rectangular frames
  - Preserved aspect ratio (no cropping) — every frame shows the full image
  - Max content width: 1200px
  - Reference: rollDESIGN_SYSTEM.md Section 6 "The Contact Sheet Grid"
- Create `src/components/PhotoCard.tsx`:
  - Displays thumbnail with `object-fit: cover` in grid, preserved aspect ratio
  - Checkmark button: top-right, 8px inset, 28px circle. Unchecked: semi-transparent overlay + white border. Checked: `--color-action` fill + white checkmark. Spring animation on toggle (see rollDESIGN_SYSTEM.md 5.2).
  - Hover metadata: bottom gradient (`--color-darkroom` → transparent), date + location in `--text-caption`
  - Loading: skeleton pulse (2000ms ease-in-out, `--color-surface-raised`)
  - Error state: image icon + "Error loading photo" in `--color-ink-tertiary`
  - Long-press menu: "Hide · View detail · View cluster"
  - Reference: rollDESIGN_SYSTEM.md 5.7, rollFRONTEND.md Section 6

**Task 30: Create Feed page with content mode switching**
- Create `src/app/app/feed/page.tsx`:
  - Content mode pills at top: "All · People · Landscapes" (with photo counts). See rollDESIGN_SYSTEM.md 5.5 for pill styling: `--radius-pill`, inactive on `--color-surface-raised`, active on `--color-ink` with `--color-ink-inverse` text.
  - Uses `usePhotos()` to get photos, filter, selection
  - Queries Supabase `photos` table directly (client-side) with `filter_status = 'visible'` and content mode filter (default: All)
  - Displays contact sheet PhotoGrid of PhotoCard components
  - Infinite scroll: loads next 20 when scrolling near bottom
  - Loading: skeleton grid pulse (2000ms ease-in-out) — the app breathes while waiting
  - Empty state: "No photos yet. Upload your first roll." — `--font-display` heading, `--color-ink-secondary` body, upload icon
  - Manual hide: PhotoCard long-press/right-click menu with "Hide" → calls `PATCH /api/photos/[id]` with `{ filter_status: 'hidden_manual' }`. Hide animation: 300ms ease-in slide off (rollDESIGN_SYSTEM.md Section 7, "Photo hide").
- Reference: rollFRONTEND.md Section 2.5 (Feed page), rollDESIGN_SYSTEM.md Sections 5.5, 5.7, 6

**Task 31: Create manual hide API endpoint**
- Create `src/app/api/photos/[id]/route.ts` (PATCH):
  - Updates `filter_status` to `'hidden_manual'` on the `photos` table
  - Validates user owns the photo (RLS will enforce, but check on client too)
  - Returns updated Photo object
  - Authenticated (check session)
- Reference: rollBACKEND.md "Hide Photo Endpoint", rollDATA_MODEL.md Section 2.2 (filter_status enum)

**Task 32: Create onboarding flow**
- Create `src/app/app/onboarding/page.tsx`:
  - Step 1: Welcome screen with "ROLL" logotype (`--font-display`, `--text-logotype`, 0.15em tracking), tagline in `--text-display`, "Upload your first roll" CTA button (`--color-action`)
  - Step 2: Photo upload component (PhotoUpload) with the film strip progress bar showing upload count toward 36
  - Step 3: "Photos uploaded! Your library is being analyzed." — processing state with `--color-processing` amber spinner
  - Progress: film strip progress bar at top (see rollDESIGN_SYSTEM.md 5.4) — the signature element, introduced immediately during onboarding
  - Page transitions between steps: 250ms cubic-bezier(0.16, 1, 0.3, 1) — chemical emergence timing
  - After completion, redirect to `/app` (feed)
- Show onboarding only if user has 0 photos (check in layout)
- Reference: rollFRONTEND.md Section 2.4 (Onboarding), rollDESIGN_SYSTEM.md 5.4

**Task 33: Create account page stub**
- Create `src/app/(app)/account/page.tsx`:
  - User profile section: avatar (placeholder circle, `--radius-pill`), email, display name in `--font-body`
  - Subscription tier card: Free / Roll+ on `--color-surface-raised` with `--shadow-raised`
  - Logout button: ghost button style (see rollDESIGN_SYSTEM.md 5.1) — text-only, underline on hover
  - Section headings in `--font-display`, `--text-heading`
  - Basic styling, no editing yet (Phase 2)
- Reference: rollFRONTEND.md Section 2.10 (Account), rollDESIGN_SYSTEM.md 5.1

---

## Verification Checklist

After completing all 33 tasks, verify the following before marking Phase 1 complete:

- **Auth Flow**: Sign up with email/password, magic link auth, session persistence, logout all work
- **Upload**: Multi-file upload, HEIC conversion, thumbnail generation, presigned URLs all work
- **Database**: All 14 tables created (profiles, photos, rolls, roll_photos, favorites, circles, circle_members, circle_invites, circle_posts, circle_post_photos, circle_reactions, print_orders, print_order_items, processing_jobs), RLS policies enforced, photos inserted and fetched correctly using filter_status/filter_reason (NOT boolean flags)
- **Filtering**: Screenshot, blur, exposure, document, and duplicate detection all run and set filter_status/filter_reason correctly. Face detection and scene classification populate face_count and scene_classification columns.
- **Feed**: All/People/Landscapes content modes work, infinite scroll works, manual hide (sets filter_status = 'hidden_manual') works
- **UI/UX**: All design tokens from `@theme` block are used (no hardcoded hex values), responsive on mobile/tablet/desktop, loading states use skeleton pulse, error messages use `--color-error`. Run the four design system tests from rollDESIGN_SYSTEM.md Section 11: swap test, token test, signature test, squint test.
- **Deployment**: App builds without errors, can be deployed to Vercel with env vars set
- **No Phase 2 features**: No roll building, film selection, processing, favorites, printing, or Circle features

---

## Important Notes

1. **Read the docs first.** Every task has a reference section. If you're unsure how to implement something, check the relevant doc. rollDESIGN_SYSTEM.md and rollFRONTEND.md are the two most heavily referenced — read them completely before starting.
2. **No `tailwind.config.ts`.** Roll uses Tailwind CSS v4 with `@theme` blocks in `globals.css`. If you find yourself creating a `tailwind.config.ts`, stop — you're using the wrong Tailwind version pattern.
3. **No hardcoded colors.** Every color, spacing value, font, radius, and shadow must come from the design tokens in `globals.css`. If you write a hex value or a raw `px` value in a component, replace it with `var(--token-name)`.
4. **Contact sheet grid, not masonry.** The photo grid uses 4px gaps, no border-radius, preserved aspect ratio. If it looks like Pinterest or Instagram, it's wrong. It should look like a contact sheet on a light table.
5. **Don't improvise.** Build exactly what's specified. Do not add features, libraries, or patterns not mentioned.
6. **Test as you go.** After each task, verify it works before moving to the next.
7. **Run the design system tests** (rollDESIGN_SYSTEM.md Section 11) against every screen before considering it done.
8. **Phase 1 is complete when users can upload, see a filtered feed, and manually hide photos.** That's the entire goal of Phase 1.

Good luck. Build Phase 1 in its entirety, then we'll review before starting Phase 2.
