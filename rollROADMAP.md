# Roll — Roadmap

> Phased build plan with week-by-week task checklists for the web prototype.

---

## 1. Phase Overview

| Phase | Weeks | Focus | Deliverable |
|---|---|---|---|
| **Phase 1** | 1–4 | Foundation + Core Loop | User can sign in, upload photos, see filtered feed with content modes |
| **Phase 2** | 5–8 | Roll Building + Processing | User can build a roll, choose film, develop it, see processed photos |
| **Phase 3** | 9–11 | Favorites + Prints + Circle | Full prototype feature-complete: hearts, prints, private sharing |
| **Phase 4** | 12–14 | Landing Page + Polish + Launch | Deployed prototype at roll.photos, performance-tuned, launch-ready |

Each phase produces a deployable, usable app — not a broken work-in-progress.

---

## 2. Phase 1: Foundation + Core Loop (Weeks 1–4)

### Week 1 — Project Scaffolding + Design System

- [ ] Initialize Next.js 15 project with App Router, TypeScript strict mode, Tailwind CSS 4
- [ ] Configure full project directory structure per CLAUDE.md (src/app, src/components, src/lib, src/stores, src/types)
- [ ] Set up Supabase project (us-east-1 region to match Vercel)
- [ ] Create `.env.local` with all required environment variables (see DEPLOYMENT.md Section 2)
- [ ] Implement CSS custom properties for design tokens (colors, typography, spacing — see DESIGN_SYSTEM.md Section 2–5)
- [ ] Configure Cormorant Garamond (serif display), Plus Jakarta Sans (body), Space Mono (monospace) via `next/font`
- [ ] Implement film grain CSS overlay effect (DESIGN_SYSTEM.md Section 8.4)
- [ ] Build base UI components per DESIGN_SYSTEM.md:
  - [ ] Button (primary, secondary, ghost, danger — with loading spinner)
  - [ ] Card (photo card, roll card, film profile card)
  - [ ] Input (text, email — with label, error, and focus states)
  - [ ] Modal (centered overlay with backdrop)
  - [ ] Toast (slide-in notification with auto-dismiss)
  - [ ] Badge (status indicators)
  - [ ] Pill (content mode selector)
  - [ ] ProgressBar (linear progress)
  - [ ] Skeleton (loading placeholder)
- [ ] Set up Zustand stores: photoStore, rollStore, userStore, filterStore (see FRONTEND.md Section 4)
- [ ] Configure ESLint, Prettier, and TypeScript paths

### Week 2 — Authentication + Photo Upload

- [ ] Implement Supabase Auth with magic link (primary) and email+password (fallback)
- [ ] Build login page: ROLL logotype, "Develop your roll." tagline, email input, CTA button (see CONTENT_STRATEGY.md Section 2.1)
- [ ] Implement auth callback handler at `/auth/callback` with PKCE flow
- [ ] Set up Next.js middleware for `(app)` route group protection
- [ ] Configure session management: httpOnly cookies via `@supabase/ssr`, 1-hour access token, 7-day refresh
- [ ] Create `profiles` table and auto-creation trigger on user signup (DATA_MODEL.md Section 1)
- [ ] Build upload page: drag-and-drop zone + file picker, supports JPEG/HEIC/PNG/WebP up to 50MB
- [ ] Implement R2 presigned URL generation for client-side upload (BACKEND.md Section 2.1)
- [ ] Build client-side upload with individual + batch progress indicators
- [ ] Handle HEIC → JPEG conversion server-side via Sharp
- [ ] Generate 400px WebP thumbnails on upload completion
- [ ] Extract and store EXIF metadata (date taken, GPS, camera info, orientation)
- [ ] Implement content hash deduplication (skip exact duplicate uploads)

### Week 3 — Filtering Pipeline + Database

- [ ] Run all 8 database migrations in order (DATA_MODEL.md Section 7):
  1. profiles
  2. photos
  3. rolls + roll_photos
  4. favorites
  5. circles + circle_members + circle_invites
  6. circle_posts + circle_post_photos + circle_reactions
  7. print_orders + print_order_items
  8. processing_jobs + utility functions + triggers
- [ ] Implement RLS policies on all 14 tables (DATA_MODEL.md — policies defined per table)
- [ ] Verify RLS: test queries as anon, authenticated, and cross-user
- [ ] Build filtering pipeline (BACKEND.md Section 3):
  - [ ] Screenshot detection: dimension ratio analysis + missing EXIF camera info
  - [ ] Blur detection: Laplacian variance via Sharp (threshold from BACKEND.md)
  - [ ] Near-duplicate detection: perceptual hash (pHash) + hamming distance < 5
  - [ ] Dark/bright detection: histogram analysis (>80% pixels in extreme 10%)
- [ ] Create async job runner using `processing_jobs` table
- [ ] Implement photo status transitions: `pending` → `filtered` or `visible`
- [ ] Build thumbnail CDN: Cloudflare Worker proxying R2 `thumbnails/` prefix (DEPLOYMENT.md Section 5.3)
- [ ] Test end-to-end: upload → thumbnail → filter → store metadata

### Week 4 — Feed + Navigation + Onboarding

- [ ] Build app shell layout with 4-tab bottom navigation: Feed, Library, Circle, Account
- [ ] Implement tab navigation as mobile-style bottom bar (FRONTEND.md Section 1.3)
- [ ] Build PhotoGrid component: CSS Grid (3-col desktop, 2-col mobile, 4px gap), infinite scroll
- [ ] Build PhotoCard component: thumbnail, checkmark overlay, hide context menu
- [ ] Implement feed page: query visible photos, sort by date descending, paginated
- [ ] Build ContentModePills: "All · People · Landscapes" (pill-shaped selector, persists across sessions)
- [ ] Implement People mode: face detection via Sharp/TensorFlow.js
- [ ] Implement Landscapes mode: no faces + outdoor scene indicators
- [ ] Build manual hide: right-click/long-press → "Hide" → photo disappears with undo toast
- [ ] Implement Account → Filtered Photos (recoverable, distinguished auto-filtered vs manual)
- [ ] Build onboarding flow (5 screens per PRD Section 6):
  1. Splash + Auth (film grain animation, ROLL logotype)
  2. Upload ("Upload your photos and we'll clean up the noise")
  3. Processing (animated film roll loader)
  4. Filtered feed reveal ("We removed [N] screenshots…")
  5. Two-gesture tutorial overlay (checkmark + heart explanation)
- [ ] Add empty states with CTAs for all screens (CONTENT_STRATEGY.md Section 2)
- [ ] Test Phase 1 end-to-end: signup → upload → filter → browse feed → switch modes → hide photo

### Phase 1 — Definition of Done

- [ ] User can sign up via magic link or password
- [ ] User can upload 100+ photos and see progress
- [ ] Filtering removes 30–50% of uploads (screenshots, blurry, duplicates, dark/bright)
- [ ] Filtered feed displays thumbnails in responsive grid
- [ ] Content modes (All, People, Landscapes) work correctly
- [ ] Manual hide works with undo
- [ ] Onboarding flow completes without errors
- [ ] All database tables created with RLS policies active
- [ ] No server-only environment variables exposed to client bundle
- [ ] Lighthouse performance score > 80 on mobile
- [ ] Deployed to Vercel preview environment

---

## 3. Phase 2: Roll Building + Processing (Weeks 5–8)

### Week 5 — Checkmark + Roll Building

- [ ] Implement checkmark gesture on PhotoCard (single tap/click to select for current roll)
- [ ] Build FilmStripProgress component: film-strip metaphor showing "23 / 36" with visual fill (signature UI element)
- [ ] Implement roll auto-creation on first checkmark (auto-named from date range)
- [ ] Handle roll auto-close at 36 photos with celebration moment
- [ ] Support "Develop now" for manual close at ≥10 photos
- [ ] Build roll name editing (auto-generated from dominant date range, e.g., "February 12–18")
- [ ] Implement drag-to-reorder photos within a pending roll
- [ ] Support removing a photo from pending roll (returns to filtered feed)
- [ ] Persist checkmark state across sessions (Zustand + Supabase)
- [ ] Show roll counter in app shell when roll is active

### Week 6 — Film Selection + Processing Pipeline

- [ ] Build film profile selector page: horizontal scroll with live preview on a sample roll photo
- [ ] Source or create 6 `.cube` LUT files: Warmth, Golden, Vivid, Classic, Gentle, Modern
- [ ] Create 6 grain texture overlays (`.webp`, tileable, distinct per profile)
- [ ] Implement 3D LUT parsing and pixel mapping via Sharp (BACKEND.md Section 4.2)
- [ ] Implement grain composite overlay via Sharp (Sharp composite with blend mode)
- [ ] Implement subtle vignette effect (radial gradient darken on edges)
- [ ] Integrate eyeQ API: POST correction request with signed R2 URL, download corrected result (API_INTEGRATIONS.md Section 1)
- [ ] Build full processing pipeline: eyeQ → LUT → grain → vignette → store in R2
- [ ] Implement eyeQ fallback: if API fails, skip correction and apply LUT to original (API_INTEGRATIONS.md Section 1.6)
- [ ] Store processed photos: `processed/{user_id}/{roll_id}/{position}_{profile}.jpg`

### Week 7 — Processing Status + Developed Gallery

- [ ] Build real-time processing status UI: "Developing your roll… Photo X of N" (CONTENT_STRATEGY.md Section 2.6)
- [ ] Enable Supabase Realtime on `rolls` and `photos` tables
- [ ] Implement processing job error handling: per-photo retry (3 attempts), skip on persistent failure
- [ ] Build developed roll gallery: grid of processed photos
- [ ] Build PhotoLightbox: full-resolution viewing with swipe/arrow navigation, signed URLs
- [ ] Build Library tab — Rolls section with status badges: Building, Ready to develop, Developing…, Developed, Printed
- [ ] Implement roll card: "[N] photos · [Profile] · Developed [Date]"
- [ ] Handle multiple rolls in various states simultaneously

### Week 8 — Tier Gates + Phase 2 Polish

- [ ] Implement tier-based film profile locking: Free = Warmth only, Roll+ = all 6
- [ ] Build upgrade prompt for locked profiles (frontend gate + backend validation per SECURITY.md Section 3.3)
- [ ] Add "Simulate Roll+" toggle in Account settings (no real payment)
- [ ] Build roll detail page: review photos before developing, remove/reorder
- [ ] Add empty states for Library (no rolls, no favorites)
- [ ] Polish processing completion celebration
- [ ] Test Phase 2 end-to-end: checkmark 36 → auto-close → select film → develop → view processed photos

### Phase 2 — Definition of Done

- [ ] User can checkmark photos and fill a 36-photo roll
- [ ] Roll auto-closes at 36 with celebration
- [ ] User can select from 6 film profiles (1 free, 5 locked)
- [ ] Processing pipeline completes within 2 minutes for 36 photos
- [ ] Real-time progress updates work
- [ ] Developed photos display with correct film profile applied
- [ ] Lightbox works for full-resolution viewing
- [ ] Library shows rolls with correct status badges
- [ ] eyeQ fallback works when API is unavailable

---

## 4. Phase 3: Favorites + Prints + Circle (Weeks 9–11)

### Week 9 — Favorites + Print Ordering

- [ ] Implement heart gesture on developed photos (HeartButton component — different from checkmark)
- [ ] Build Favorites section in Library tab (grid of all hearted photos across rolls)
- [ ] Implement favorites database operations (insert/delete with RLS)
- [ ] Build print ordering flow:
  1. "Order prints" CTA on developed roll
  2. Product selection (Roll Prints 4×6 or Individual)
  3. Address form (name, line1, line2, city, state, zip, country)
  4. Confirmation screen with order summary
- [ ] Implement free first roll detection and banner ("Your first roll of prints is free")
- [ ] Build Prodigi order submission (API_INTEGRATIONS.md Section 2.3)
- [ ] Implement `ENABLE_PRINT_FULFILLMENT` toggle: real API or simulated response
- [ ] Build Prodigi webhook handler with signature verification (API_INTEGRATIONS.md Section 2.5)
- [ ] Build order tracking UI: pending → printing → shipped → delivered
- [ ] Send "Prints shipped" email via Resend (API_INTEGRATIONS.md Section 4.3)

### Week 10 — Circle

- [ ] Build Circle page: list of user's circles, create button
- [ ] Implement circle creation (Roll+ only): name input, optional cover photo
- [ ] Build invite link generation with 7-day expiry and clipboard copy
- [ ] Implement circle invite acceptance flow (join via link)
- [ ] Build circle feed: chronological, newest first, photos from all members
- [ ] Implement "Share to Circle" from favorites (default suggests favorites, not full roll)
- [ ] Copy shared photos to circle namespace in R2: `circle/{circle_id}/{post_id}/`
- [ ] Build circle reactions: heart, smile, wow (private, visible only to poster)
- [ ] Enable Supabase Realtime on `circle_posts` for live feed
- [ ] Implement circle member management (view members, leave circle)
- [ ] Enforce Roll+ gate on circle creation (frontend + backend)

### Week 11 — Email + Notifications + Integration Testing

- [ ] Build 4 email templates with Resend (API_INTEGRATIONS.md Section 4):
  1. Magic link: "Sign in to Roll" with cream background, terracotta CTA
  2. Roll developed: "Your roll is developed ✓" with 2×2 photo preview
  3. Prints shipped: "Your prints are on the way" with tracking link
  4. Circle invite: "[Name] invited you to [Circle]" with join link
- [ ] Implement email sending triggered by appropriate events
- [ ] Add Skeleton loading states to all data-fetching screens
- [ ] Implement error boundaries for all `(app)` route segments
- [ ] Review and verify all empty states have CTAs
- [ ] Test Phase 3 end-to-end: heart photos → view favorites → order prints → create circle → invite → share → react

### Phase 3 — Definition of Done

- [ ] Heart gesture works on developed photos
- [ ] Favorites collection displays across all rolls
- [ ] Print ordering flow completes (real or simulated)
- [ ] Prodigi webhook updates order status correctly
- [ ] Circle creation, invite, and feed work end-to-end
- [ ] "Share to Circle" copies photos to isolated namespace
- [ ] All 4 email templates render correctly
- [ ] Error boundaries catch and display errors gracefully
- [ ] All features respect Free vs Roll+ tier gates

---

## 5. Phase 4: Landing Page + Polish + Launch (Weeks 12–14)

### Week 12 — Landing Page

- [ ] Build landing page per LANDING_PAGE.md (all 9 sections):
  1. Hero: ROLL logotype, tagline, email input + CTA, "Free to try. No credit card."
  2. Problem: "20,000 photos on your phone. Zero on your wall."
  3. How It Works: 3-step visual (upload → pick → prints)
  4. Film Profiles Showcase: same photo in all 6 profiles, horizontal scroll
  5. Free First Roll: "Your first roll is free." with terracotta CTA
  6. Circle: "Share with the people who matter." with feed mockup
  7. Pricing: Free vs Roll+ comparison (text lists, no checkmark grids)
  8. Footer CTA: repeated email input + "No ads. No algorithm."
  9. Footer: minimal, warm brown text, privacy/terms/contact links
- [ ] Create ROLL logotype SVG (Cormorant Garamond, 700 weight)
- [ ] Implement smooth-scroll from all CTAs to email input
- [ ] Configure static generation: `export const dynamic = 'force-static'`
- [ ] Add meta tags, Open Graph, Twitter Card (LANDING_PAGE.md Section 5.1)
- [ ] Add structured data JSON-LD (LANDING_PAGE.md Section 5.2)
- [ ] Optimize hero image: WebP, responsive sizes, LQIP placeholder
- [ ] Test responsive behavior: mobile (<768px) and desktop (≥768px)

### Week 13 — Performance + Accessibility + Security

- [ ] Run Lighthouse audit on all pages, fix until score > 90 on mobile
- [ ] Optimize all images: WebP format, lazy loading below fold, LQIP placeholders
- [ ] Verify bundle size < 200KB initial JavaScript
- [ ] Verify Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Test photo grid scroll performance at 60fps
- [ ] Full keyboard navigation audit (focus rings, tab order, arrow key navigation in grids)
- [ ] Screen reader testing: verify all interactive elements have labels
- [ ] Reduce motion: respect `prefers-reduced-motion` for all animations
- [ ] Run securityheaders.com — verify all HTTP security headers (SECURITY.md Section 7)
- [ ] Verify no server-only env vars in client bundle (`npx next build` + check output)
- [ ] Test RLS policies: attempt cross-user data access via API
- [ ] Test signed URL expiry (1-hour for display, 24-hour for Prodigi)
- [ ] Verify rate limiting on all API routes

### Week 14 — Deployment + Launch

- [ ] Create Vercel project and link to GitHub repo
- [ ] Set all environment variables in Vercel (DEPLOYMENT.md Section 2)
- [ ] Configure `vercel.json` with function timeouts and security headers (DEPLOYMENT.md Section 3.1)
- [ ] Configure DNS for roll.photos: A record → Vercel, CNAME www → Vercel, CNAME photos → Worker
- [ ] Deploy thumbnail CDN Worker to Cloudflare (DEPLOYMENT.md Section 5.3)
- [ ] Apply R2 CORS policy on production bucket
- [ ] Run all database migrations on production Supabase
- [ ] Enable Realtime on production tables (rolls, photos, circle_posts)
- [ ] Configure Supabase redirect URLs for production domain
- [ ] Verify domain verification for Resend (noreply@roll.photos)
- [ ] Test production auth flow: magic link + password
- [ ] Test production: upload → filter → develop → view → order prints
- [ ] Verify SSL on all domains (roll.photos, photos.roll.photos)
- [ ] Run full pre-launch checklist (DEPLOYMENT.md Section 8)
- [ ] Deploy to production
- [ ] Smoke test live site

### Phase 4 — Definition of Done

- [ ] Landing page converts at design spec quality
- [ ] Lighthouse > 90 on mobile for all pages
- [ ] All Core Web Vitals within budget
- [ ] Full keyboard and screen reader accessibility
- [ ] Security headers pass audit
- [ ] Production deployment stable on roll.photos
- [ ] Auth, upload, filter, develop, print, and circle flows work on production
- [ ] SSL active on all domains

---

## 6. Post-Prototype Roadmap

These phases happen after prototype validation with real users:

| Phase | Focus | Key Items |
|---|---|---|
| **Phase 5** | Real Payments | Stripe integration, RevenueCat for subscriptions, real Roll+ billing |
| **Phase 6** | iOS Native | SwiftUI app using same Supabase backend, Sign in with Apple, on-device Vision framework for filtering |
| **Phase 7** | Advanced Features | Comments in Circle, Year in Review, people tagging, AI-suggested checkmarks, bound photo books |
| **Phase 8** | Scale + Growth | Digital frame integration (Aura), social sharing, referral program, CDN optimization |
| **Phase 9** | Expansion | Calendar prints, magnets, additional print products, business accounts |

---

## 7. Dependencies & Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| eyeQ API availability | Processing pipeline blocked | Low | Fallback: skip correction, apply LUT to original |
| eyeQ API cost at scale | Unsustainable processing costs | Medium | Post-prototype: self-hosted Docker container |
| LUT quality / look | Film profiles don't look good | Medium | Iterate with colorist, test on 20+ diverse photos before shipping |
| Prodigi sandbox limitations | Can't test full print lifecycle | Low | Sandbox simulates full lifecycle including webhooks |
| HEIC conversion reliability | Some uploads fail silently | Medium | Sharp handles HEIC; fallback to rejecting with clear error |
| R2 egress costs | Unexpected bills from photo viewing | Low | R2 has zero egress fees — this is why we chose it |
| Supabase free tier limits | Hit connection or storage limits during testing | Medium | Monitor usage; upgrade to Pro before limits hit |
| Face detection accuracy | People mode shows wrong photos | Medium | Conservative threshold; manual hide as safety valve |
| Thumbnail CDN cache invalidation | Users see stale thumbnails | Low | Content-hash URLs are immutable — no invalidation needed |
| Bundle size exceeding 200KB | Poor mobile performance | Medium | Code splitting, lazy loading, tree shaking; monitor with each PR |

---

## 8. Definition of Done — General

Every phase is considered done when:

1. **All checklist items completed** — every `[ ]` is `[x]`
2. **End-to-end flow tested** — the core user journey for that phase works without errors
3. **No critical bugs** — no crashes, data loss, or security vulnerabilities
4. **Performance budgets met** — Lighthouse > 80 (Phase 1–3), > 90 (Phase 4)
5. **Empty states handled** — every screen has appropriate empty state with CTA
6. **Error states handled** — network errors, API failures, and edge cases show user-friendly messages
7. **Deployed to preview** — Vercel preview deployment works (production for Phase 4)
8. **Documentation updated** — any deviations from spec are documented

---

## 9. Key Milestones

| Milestone | Target | Validates |
|---|---|---|
| First filtered feed | End of Week 4 | Core value proposition — "we clean up the noise" |
| First developed roll | End of Week 7 | Processing pipeline — photos look like film |
| First print order | End of Week 9 | Physical product loop — digital to tangible |
| First circle share | End of Week 10 | Social loop — sharing with people who matter |
| Production deploy | End of Week 14 | The whole thing works, publicly |
