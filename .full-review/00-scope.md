# Review Scope

## Target
Full comprehensive code review of the **Roll** application — a Next.js 16 photo roll app with Supabase backend, Stripe billing, Cloudflare R2 storage, Prodigi print fulfillment, and Capacitor mobile support.

## Project Overview
- **Framework**: Next.js 16 (App Router, Turbopack) with React 19
- **Backend**: Supabase (auth, database, SSR), Next.js API routes
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Payments**: Stripe (subscriptions & checkout)
- **Storage**: Cloudflare R2 via AWS SDK
- **Image Processing**: Sharp
- **Email**: Resend
- **Print Fulfillment**: Prodigi
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Mobile**: Capacitor (iOS/Android)
- **Language**: TypeScript 5.9

## Files

### Configuration & Root
- `roll-app/package.json` — Dependencies and scripts
- `roll-app/next.config.ts` — Next.js configuration
- `roll-app/tsconfig.json` — TypeScript configuration
- `roll-app/capacitor.config.ts` — Capacitor mobile config
- `roll-app/postcss.config.mjs` — PostCSS config
- `roll-app/vercel.json` — Vercel deployment config
- `roll-app/.env.local.example` — Environment variable template
- `roll-app/supabase/migrations/001_create_all_tables.sql` — Database schema

### API Routes (30 routes)
- `src/app/api/billing/` — Stripe checkout, portal, print-checkout
- `src/app/api/circles/` — Social circles CRUD, invites, comments, reactions, members, posts
- `src/app/api/collections/` — Photo collections
- `src/app/api/favorites/` — Favorite photos
- `src/app/api/memories/` — Memory generation
- `src/app/api/orders/` — Print orders
- `src/app/api/people/` — People/faces
- `src/app/api/photos/` — Photo CRUD, tags, map, serve
- `src/app/api/process/` — Image processing (develop, filter, status)
- `src/app/api/push/` — Push notification subscription
- `src/app/api/referrals/` — Referral system
- `src/app/api/rolls/` — Roll CRUD, photos, reorder, suggest
- `src/app/api/search/` — Search
- `src/app/api/seed/` — Data seeding
- `src/app/api/subscriptions/` — Print subscriptions
- `src/app/api/upload/` — Presigned URL upload, completion
- `src/app/api/webhooks/` — Stripe & Prodigi webhooks
- `src/app/api/year-in-review/` — Year in review

### Pages (App Router)
- `src/app/page.tsx` — Landing page
- `src/app/(auth)/` — Login, callback, signup
- `src/app/(app)/` — Authenticated app shell (feed, library, upload, rolls, circles, map, search, collections, memories, year-in-review, account, onboarding, seed)

### Components (22 components)
- `src/components/ui/` — Button, Input, Empty, Modal, Skeleton, Badge, ErrorBoundary, Spinner, Card, Toast, OfflineBanner
- `src/components/photo/` — PhotoCard, PhotoGrid, PhotoLightbox, PhotoUpload, CameraCapture, PhotoTagOverlay, ContentModePills
- `src/components/roll/` — RollCard, FilmProfileSelector, FilmStripProgress, HeartButton, CheckmarkButton
- `src/components/circle/` — ShareToCircleModal, CirclePostCard
- `src/components/landing/` — EmailCaptureForm, FilmProfileShowcase
- `src/components/layout/` — AppLayout, AuthLayout
- `src/components/providers/` — AnalyticsProvider

### Libraries & Utilities
- `src/lib/supabase/` — Client & server Supabase clients
- `src/lib/storage/r2.ts` — Cloudflare R2 storage
- `src/lib/stripe.ts` — Stripe client
- `src/lib/prodigi.ts` — Prodigi print API
- `src/lib/push.ts` — Push notifications
- `src/lib/email/` — Resend email client & templates
- `src/lib/analytics.ts` — PostHog analytics
- `src/lib/sentry.ts` — Sentry error tracking
- `src/lib/native.ts` — Capacitor native bridge
- `src/lib/processing/` — Image processing pipeline (blur, duplicate, document, exposure, screenshot detection; film profiles; sharp utilities)
- `src/lib/utils/` — Constants, upload batch utility

### Hooks (8 hooks)
- `src/hooks/useAuth.ts` — Authentication
- `src/hooks/useUser.ts` — User state
- `src/hooks/usePhotos.ts` — Photo operations
- `src/hooks/useRoll.ts` — Roll operations
- `src/hooks/useCameraCapture.ts` — Camera access
- `src/hooks/useNetworkStatus.ts` — Online/offline detection
- `src/hooks/useServiceWorker.ts` — Service worker registration
- `src/hooks/usePushNotifications.ts` — Push notification management

### Stores (8 Zustand stores)
- `src/stores/photoStore.ts` — Photo state
- `src/stores/rollStore.ts` — Roll state
- `src/stores/circleStore.ts` — Circle state
- `src/stores/favoriteStore.ts` — Favorites state
- `src/stores/filterStore.ts` — Filter state
- `src/stores/printStore.ts` — Print/order state
- `src/stores/userStore.ts` — User state
- `src/stores/toastStore.ts` — Toast notifications

### Types (10 type files)
- `src/types/` — auth, circle, favorite, hooks, people, photo, print, push, referral, roll

### Middleware
- `src/middleware.ts` — Next.js middleware (auth routing)

### Database
- `supabase/migrations/001_create_all_tables.sql` — Full database schema

## Flags
- Security Focus: no
- Performance Critical: no
- Strict Mode: no
- Framework: Next.js 16 (auto-detected)

## Review Phases
1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report
