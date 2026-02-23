# Roll — Deployment Guide

## Architecture Overview

Roll is a Next.js 16 App Router application deployed on Vercel. It uses:

- **Vercel** — Hosting, serverless functions, edge middleware
- **Supabase** — PostgreSQL database, authentication, Row Level Security
- **Cloudflare R2** — S3-compatible photo storage with public CDN
- **Stripe** — Subscription billing (Roll+) and print order payments
- **Prodigi** — Print fulfillment and shipping
- **Resend** — Transactional email delivery
- **Sentry** — Error monitoring and performance tracing
- **PostHog** — Product analytics and event tracking
- **Web Push (VAPID)** — Browser push notifications

---

## Prerequisites

### Accounts Required

| Service | Purpose | Pricing Tier Needed |
|---------|---------|-------------------|
| [Vercel](https://vercel.com) | Hosting | Pro (for 300s function timeout) |
| [Supabase](https://supabase.com) | Database + Auth | Pro (for production SLA) |
| [Cloudflare](https://cloudflare.com) | R2 storage + CDN | Pay-as-you-go |
| [Stripe](https://stripe.com) | Payments | Standard |
| [Prodigi](https://prodigi.com) | Print fulfillment | Standard |
| [Resend](https://resend.com) | Email | Free tier to start |
| [Sentry](https://sentry.io) | Error tracking | Free tier to start |
| [PostHog](https://posthog.com) | Analytics | Free tier to start |

### Domain Setup

1. Register `roll.photos` (or your domain)
2. Point DNS to Vercel (CNAME or A records)
3. Create `photos.roll.photos` subdomain pointing to your R2 bucket's public URL
4. Configure email DNS records (SPF, DKIM, DMARC) via Resend dashboard

---

## Environment Variables

Copy `.env.local.example` to `.env.local` for local development. Set these in Vercel's dashboard for production.

### Required — Core

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Never expose client-side

# App
NEXT_PUBLIC_APP_URL=https://roll.photos   # No trailing slash
```

### Required — Storage

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=roll-photos                # "roll-photos-dev" for staging
R2_PUBLIC_URL=https://photos.roll.photos  # Public bucket URL or custom domain
```

### Required — Payments

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...            # Roll+ subscription price ID
```

### Required — Email

```bash
# Resend
RESEND_API_KEY=re_...
```

### Required — Monitoring

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Optional — Print Fulfillment

```bash
# Prodigi (set ENABLE_PRINT_FULFILLMENT=true when ready)
PRODIGI_API_KEY=your-api-key
PRODIGI_WEBHOOK_SECRET=your-webhook-secret
ENABLE_PRINT_FULFILLMENT=false            # true = live orders to Prodigi
```

### Optional — Push Notifications

```bash
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
```

---

## Supabase Setup

### 1. Create Project

Create a new Supabase project. Note the URL, anon key, and service role key.

### 2. Database Schema

The application expects these tables (with Row Level Security enabled):

- `profiles` — User profiles with tier, stripe IDs, avatar
- `photos` — Photo metadata, storage keys, processing status
- `rolls` — Film rolls with status machine (building → ready → processing → developed)
- `roll_photos` — Many-to-many: photos assigned to rolls with positions
- `print_orders` — Print order records with shipping info
- `print_order_items` — Individual photos in a print order
- `circles` — Social sharing groups
- `circle_members` — Group membership with roles
- `circle_posts` — Shared posts within circles
- `circle_post_photos` — Photos in circle posts
- `circle_comments` — Comments on posts
- `circle_reactions` — Reactions on posts
- `circle_invites` — Invite tokens with expiry
- `favorites` — User photo favorites
- `collections` — User-created photo collections
- `collection_photos` — Photos in collections
- `people` — Named people/faces
- `photo_tags` — Tags linking photos to people
- `push_subscriptions` — Web Push subscription endpoints
- `processing_jobs` — Background job queue
- `referrals` — Referral tracking

### 3. Authentication

Configure in Supabase Dashboard → Authentication:

- Enable **Email/Password** sign-in
- Enable **Magic Link** (OTP) sign-in
- Set redirect URLs to your domain (`https://roll.photos/*`)
- Configure email templates if desired

### 4. Row Level Security

Enable RLS on all tables. Policies should ensure users can only access their own data. Webhook handlers use the service role key to bypass RLS.

---

## Cloudflare R2 Setup

1. Create an R2 bucket (e.g., `roll-photos`)
2. Enable public access or set up a custom domain (`photos.roll.photos`)
3. Create an API token with read/write permissions for the bucket
4. Note the Account ID, Access Key ID, and Secret Access Key

### CORS Configuration

Configure R2 CORS to allow uploads from your domain:

```json
[
  {
    "AllowedOrigins": ["https://roll.photos"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Stripe Setup

### 1. Products & Prices

Create in Stripe Dashboard:

- **Roll+ Subscription** — Monthly recurring price. Note the `price_xxx` ID.
- Print orders use dynamic pricing calculated server-side (no Stripe product needed).

### 2. Webhook Endpoint

Add webhook endpoint in Stripe Dashboard → Developers → Webhooks:

- **URL:** `https://roll.photos/api/webhooks/stripe`
- **Events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Note the signing secret (`whsec_...`)

### 3. Customer Portal

Enable the Customer Portal in Stripe Dashboard → Settings → Customer Portal. This lets users manage their subscription.

---

## Prodigi Setup

1. Create a Prodigi account and get API credentials
2. Start in **sandbox mode** (`ENABLE_PRINT_FULFILLMENT=false`)
3. Add webhook endpoint: `https://roll.photos/api/webhooks/prodigi`
4. Note the webhook secret for signature verification
5. When ready to go live, set `ENABLE_PRINT_FULFILLMENT=true` and switch to production API URL

---

## Vercel Deployment

### 1. Connect Repository

```bash
vercel link
```

### 2. Set Environment Variables

Set all environment variables in Vercel Dashboard → Settings → Environment Variables. Use different values for Preview vs Production (e.g., Stripe test keys for preview).

### 3. Deploy

```bash
vercel --prod
```

### 4. Function Configuration

The `vercel.json` configures extended timeouts for long-running functions:

- `/api/process/**` — 300s (image processing pipeline)
- `/api/upload/**` — 30s (presigned URL generation)

This requires Vercel Pro plan.

---

## Local Development

```bash
cd roll-app
cp .env.local.example .env.local
# Fill in your development credentials

npm install
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm test` | Run test suite (191 tests) |
| `npm run test:watch` | Run tests in watch mode |

---

## Monitoring & Observability

### Sentry

All API route errors are captured via `captureError()` with context tags:

- `context: 'stripe-webhook'` — Stripe webhook processing errors
- `context: 'prodigi-webhook'` — Prodigi webhook errors
- `context: 'email'` — Email delivery failures
- `context: 'push-notification'` — Push notification failures
- `context: 'upload-presign'` / `'upload-complete'` — Upload pipeline errors
- `context: 'print-checkout'` — Payment processing errors
- `context: 'process-develop'` — Image processing errors

Client-side errors are captured via `Sentry.captureException()` in the ErrorBoundary and push notification hooks.

### PostHog

Key events tracked for product metrics:

- Funnel: `photos_uploaded` → `roll_created` → `roll_develop_started` → `roll_develop_completed` → `print_order_started` → `print_order_completed`
- Engagement: `circle_created`, `circle_invite_sent`, `circle_joined`
- Revenue: `upgrade_started`, `upgrade_completed`

---

## Security

### Headers

The `next.config.ts` applies security headers to all routes:

- HSTS with 2-year max-age and preload
- Content Security Policy restricting script/style/connect sources
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting

In-memory rate limiters protect sensitive endpoints:

- Auth endpoints: 10 requests/minute
- Billing endpoints: 5 requests/minute
- Upload endpoints: 20 requests/minute
- Order creation: 5 requests/minute
- Circle invites: 10 requests/minute

### Input Validation

All API routes use Zod schemas for request body validation. Schemas are defined in `src/lib/validation.ts`.
