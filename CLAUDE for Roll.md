# CLAUDE.md — Roll

> Single source of truth for Claude Code. Read this file first before any task.

## Project Overview

**Roll** is a web application (Next.js prototype) that rescues photos from the digital graveyard. It cleans up uploaded photo libraries by removing junk (screenshots, duplicates, blurry shots), lets users checkmark their best 36 shots to fill a "roll," processes those selections with cloud color correction and film-aesthetic profiles, and delivers real photographic prints to their door. Users then heart their absolute favorites from developed rolls, building a portfolio over time.

This is the **web prototype** that validates the core product loop before native iOS development. The Supabase backend is built to production standards — it transfers 1:1 to iOS. The Next.js frontend is disposable.

**For:** Parents with young children (20,000–50,000 photos, zero prints). Secondary: mom groups, family circles, small business owners.

**What makes it different:** Four-tier curation (raw → filtered → developed → favorites), cloud color correction via eyeQ before LUT application, physical print delivery, and private Circle sharing — all in one flow.

## Core Principles

1. **Analog soul, digital intelligence.** Every design decision should feel like it was made by someone who loves film photography, not a SaaS product manager.
2. **Two gestures, two meanings.** ✓ Checkmark = "develop this." ♥ Heart = "treasure this." The entire product interaction collapses to these two actions.
3. **Zero friction to value.** A new user must see their cleaned-up photo library within 60 seconds of uploading photos.
4. **Do the work for them.** The app makes choices. Users confirm or adjust. They never start from scratch.
5. **Privacy first.** No ads. No algorithmic feed. No selling data. No public profiles. Photos encrypted in transit and at rest.
6. **Beautiful by default.** Every processed image should look like it was shot on film and developed by a good lab. The aesthetic is the product.
7. **Ship the backend for production.** Supabase schema, RLS policies, Edge Functions, and storage architecture must be production-grade even though the frontend is a prototype.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 (App Router) | Web framework, SSR, API routes |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety throughout |
| Tailwind CSS | 4.x | Styling with custom design tokens |
| Supabase | Latest | Auth, PostgreSQL, RLS, Edge Functions, Realtime |
| Cloudflare R2 | — | Photo file storage (S3-compatible, zero egress) |
| Sharp | Latest | Server-side image processing (LUT, grain, vignette) |
| Zustand | Latest | Client state management |
| Vercel | — | Hosting and deployment |
| Prodigi API | v4.0 | Print fulfillment (optional in prototype) |
| eyeQ / Perfectly Clear | Web API | Cloud color correction (prototype phase) |
| Resend | — | Transactional email (order confirmations, magic links) |
| RevenueCat | — | Subscription management (post-prototype, iOS) |

## Project Structure

```
roll/
├── CLAUDE for Roll.md           # This file — read first
├── rollCLAUDE_CODE_PROMPT.md    # Kickoff prompt for Claude Code
├── rollprd.md                   # Product requirements
├── rollARCHITECTURE.md          # System architecture
├── rollFRONTEND.md              # Frontend specification
├── rollBACKEND.md               # Backend specification
├── rollDESIGN_SYSTEM.md         # Design system & tokens
├── rollDATA_MODEL.md            # Database schema
├── rollSECURITY.md              # Security & auth
├── rollROADMAP.md               # Build phases
├── rollAPI_INTEGRATIONS.md      # Third-party APIs
├── rollCONTENT_STRATEGY.md      # Content & copy
├── rollDEPLOYMENT.md            # Deployment config
├── rollLANDING_PAGE.md          # Landing page spec
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing/marketing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── (app)/               # Authenticated app routes
│   │   │   ├── layout.tsx       # App shell with tab navigation
│   │   │   ├── feed/page.tsx    # Tab 1: Filtered photo feed
│   │   │   ├── library/page.tsx # Tab 2: Developed rolls + Favorites
│   │   │   ├── circle/page.tsx  # Tab 3: Private sharing feed
│   │   │   ├── account/page.tsx # Tab 4: Settings, subscription, history
│   │   │   ├── roll/
│   │   │   │   ├── [id]/page.tsx        # Roll detail/review
│   │   │   │   └── develop/page.tsx     # Film stock selection + processing
│   │   │   ├── upload/page.tsx          # Photo upload interface
│   │   │   └── onboarding/page.tsx      # First-run experience
│   │   └── api/
│   │       ├── process/route.ts         # Photo processing pipeline
│   │       ├── eyeq/route.ts            # eyeQ color correction proxy
│   │       ├── prodigi/route.ts         # Print order submission
│   │       └── webhooks/
│   │           ├── prodigi/route.ts     # Print status webhooks
│   │           └── stripe/route.ts      # Payment webhooks (future)
│   ├── components/
│   │   ├── ui/                  # Base design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Pill.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── photo/               # Photo-specific components
│   │   │   ├── PhotoGrid.tsx
│   │   │   ├── PhotoCard.tsx
│   │   │   ├── CheckmarkButton.tsx
│   │   │   ├── HeartButton.tsx
│   │   │   ├── FilmStripProgress.tsx
│   │   │   ├── ContentModePills.tsx
│   │   │   ├── FilmProfileSelector.tsx
│   │   │   └── PhotoLightbox.tsx
│   │   ├── circle/              # Circle feature components
│   │   │   ├── CircleFeed.tsx
│   │   │   ├── CircleCard.tsx
│   │   │   ├── CreateCircle.tsx
│   │   │   └── InviteSheet.tsx
│   │   ├── print/               # Print ordering components
│   │   │   ├── PrintOrderFlow.tsx
│   │   │   ├── AddressForm.tsx
│   │   │   └── OrderConfirmation.tsx
│   │   └── layout/              # Layout components
│   │       ├── AppShell.tsx
│   │       ├── TabBar.tsx
│   │       ├── Header.tsx
│   │       └── OnboardingShell.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Server Supabase client
│   │   │   ├── middleware.ts    # Auth middleware
│   │   │   └── types.ts         # Generated DB types
│   │   ├── processing/
│   │   │   ├── filter.ts        # Photo filtering logic (blur, duplicate, etc.)
│   │   │   ├── lut.ts           # LUT application via Sharp
│   │   │   ├── grain.ts         # Film grain compositing
│   │   │   ├── pipeline.ts      # Full processing pipeline orchestrator
│   │   │   └── eyeq.ts          # eyeQ API client
│   │   ├── prodigi/
│   │   │   └── client.ts        # Prodigi API client
│   │   ├── storage/
│   │   │   └── r2.ts            # Cloudflare R2 operations
│   │   └── utils/
│   │       ├── image.ts         # Image utility functions
│   │       ├── formatting.ts    # Date, number, string formatting
│   │       └── constants.ts     # App-wide constants
│   ├── stores/
│   │   ├── photoStore.ts        # Photo library state (Zustand)
│   │   ├── rollStore.ts         # Roll building state
│   │   ├── filterStore.ts       # Content mode + filter state
│   │   └── userStore.ts         # Auth + preferences state
│   ├── hooks/
│   │   ├── usePhotos.ts         # Photo data fetching
│   │   ├── useRoll.ts           # Roll management
│   │   ├── useFilter.ts         # Filtering logic
│   │   ├── useCircle.ts         # Circle data
│   │   └── useProcessing.ts     # Processing pipeline status
│   └── types/
│       ├── database.ts          # Supabase generated types
│       ├── photo.ts             # Photo-related types
│       ├── roll.ts              # Roll types
│       ├── circle.ts            # Circle types
│       └── print.ts             # Print order types
├── public/
│   ├── luts/                    # .cube LUT files (6 film profiles)
│   │   ├── warmth.cube
│   │   ├── golden.cube
│   │   ├── vivid.cube
│   │   ├── classic.cube
│   │   ├── gentle.cube
│   │   └── modern.cube
│   ├── grain/                   # Grain texture overlays per profile
│   └── fonts/                   # Self-hosted serif + sans fonts
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── functions/               # Edge Functions
│   │   ├── process-roll/
│   │   ├── prodigi-webhook/
│   │   └── send-notification/
│   └── seed.sql                 # Development seed data
├── next.config.ts               # Tailwind v4 uses @theme in globals.css — no tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

## Documentation Index

Read these documents in this order before starting any work:

1. `rollprd.md` — What to build (features, interactions, user flows)
2. `rollARCHITECTURE.md` — How the system is structured (data flow, processing pipeline)
3. `rollDESIGN_SYSTEM.md` — Visual design rules (colors, typography, components)
4. `rollFRONTEND.md` — Frontend implementation (pages, components, state, routing)
5. `rollBACKEND.md` — Backend implementation (API routes, Edge Functions, storage)
6. `rollDATA_MODEL.md` — Full database schema (every table, column, RLS policy)
7. `rollAPI_INTEGRATIONS.md` — Third-party services (eyeQ, Prodigi, R2)
8. `rollSECURITY.md` — Auth, encryption, privacy requirements
9. `rollCONTENT_STRATEGY.md` — Sample data, copy, content structure
10. `rollDEPLOYMENT.md` — Environment variables, Vercel config, domains
11. `rollLANDING_PAGE.md` — Marketing/landing page specs
12. `rollROADMAP.md` — Build phases and week-by-week plan (what order to build)

## Development Rules

### Component Conventions
- All components are TypeScript functional components with explicit prop types
- Component files are PascalCase: `PhotoGrid.tsx`, `FilmStripProgress.tsx`
- One component per file. No barrel exports (`index.ts`) — import directly
- Colocate component-specific types in the component file unless shared

### File Organization
- Pages go in `src/app/` following Next.js App Router conventions
- Reusable components go in `src/components/[domain]/`
- Business logic goes in `src/lib/[domain]/`
- State stores go in `src/stores/`
- Custom hooks go in `src/hooks/`
- Types shared across domains go in `src/types/`

### Styling Rules
- Tailwind CSS only. No CSS modules, no styled-components, no inline styles
- Use design tokens from `globals.css` `@theme` block (Tailwind CSS v4) — never hardcode colors, spacing, or fonts
- Mobile-first responsive design. Breakpoints: `sm:`, `md:`, `lg:`
- The app should feel like a native mobile app viewed in a browser — bottom tab bar, full-bleed layouts, touch-friendly targets (min 44px)

### Code Style
- Use `async/await`, never `.then()` chains
- Prefer `const` over `let`. Never use `var`
- Use early returns to reduce nesting
- Error handling: try/catch with specific error types, never swallow errors
- Comments only for "why", never "what" — code should be self-documenting

### Git Commits
- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`
- Examples: `feat(feed): add content mode pill selector`, `fix(roll): correct auto-close at 36 photos`

### Performance Budgets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Photo grid: virtualized rendering, lazy load images, LQIP placeholders
- Bundle size: < 200KB initial JS

### Accessibility
- All interactive elements have visible focus states
- All images have descriptive alt text
- Minimum touch target: 44×44px
- Support `prefers-reduced-motion`
- Color contrast: WCAG AA minimum (4.5:1 for text)

## Key Decisions Log

| Decision | Choice | Why |
|---|---|---|
| Web prototype before iOS | Next.js on Vercel | Validate the four-tier model, checkmark mechanic, and film profile emotional response before committing to native iOS. Supabase backend transfers 1:1. |
| Auth for prototype | Supabase email + magic links | Simulates Sign in with Apple simplicity. One-tap auth. No passwords to remember. |
| Photo storage | Cloudflare R2 | Zero egress fees critical for photo-heavy app. S3-compatible. Supabase Storage for metadata only. |
| Image processing | Sharp (server-side) | Handles LUT application, grain compositing, vignette in Node.js. Runs on Vercel serverless or standalone. |
| Color correction | eyeQ Web API (prototype) | ~$0.02–$0.05/photo. Zero infrastructure for validation phase. Docker deployment post-prototype. |
| Film profile names | Trademark-safe (Warmth, Golden, Vivid, Classic, Gentle, Modern) | Never use Kodak/Fuji stock names in UI. Internal reference only. |
| Roll size | 36 photos (min 10 for manual close) | Mirrors 35mm film roll. Creates satisfying completion mechanic. |
| Filtering approach | Server-side blur/duplicate/quality detection | Web prototype can't use iOS Vision framework. Use Sharp + perceptual hashing for similar results. |
| Content modes | Face detection (People Only), scene classification | Simulated server-side for prototype. Powers the key "People Only" marketing feature. |
| State management | Zustand | Lightweight, no boilerplate, works perfectly for photo selection state and roll building. |
| Subscription for prototype | Simulated tiers (free/plus) | No real payment processing in prototype. Toggle tier in account settings for testing. |
| Print ordering | Optional Prodigi integration | Full UI flow always. Actual API calls toggled by env variable. |

## Important Notes

- **The film profiles ARE the product.** Spend whatever time it takes to get the LUT files right. Mediocre filters kill the entire value proposition. Every processed photo must look like it was shot on film and developed by a great lab.
- **The "your roll is developed" moment must land.** The push notification / in-app moment when processing completes is the emotional peak. Design it with care.
- **Never use real film stock names in the UI.** "Warmth" not "Portra 400." "Classic" not "Tri-X." Trademark-safe only.
- **36 is a magic number.** The roll fills to 36. This creates a satisfying constraint and completion mechanic. Don't change it.
- **Hearts are NOT likes.** Hearts mark Favorites (portfolio tier). They are personal, not social. Visible only to the user in their Library. Distinct from Circle reactions.
- **The web prototype uploads photos via file picker.** It cannot access a camera roll. The filtering, checkmarking, and developing flow should feel the same — just with uploaded photos instead of automatic library scanning.
- **Brand voice:** Warm. Honest. A little poetic. Like a good photo lab that's been in business for 40 years. NOT tech-startup. NOT precious. NOT SaaS.
