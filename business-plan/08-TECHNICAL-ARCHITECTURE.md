# 08 — Technical Architecture & Infrastructure

> This document provides the technical context needed to assess Roll's technology strategy, infrastructure costs, scalability, build-vs-buy decisions, and technical competitive moats.

---

## Technology Stack

| Layer | Technology | Why This Choice |
|-------|-----------|----------------|
| **Frontend framework** | Next.js 16 (App Router) | SSR for SEO (landing page), API routes for backend, React 19 ecosystem |
| **UI library** | React 19 | Industry standard, component model, ecosystem |
| **Language** | TypeScript 5.9 (strict) | Type safety across full stack; catches errors at compile time |
| **Styling** | Tailwind CSS 4 | Design tokens via @theme, no CSS-in-JS overhead, utility-first |
| **State management** | Zustand | Lightweight, no boilerplate, perfect for photo selection state |
| **Database** | Supabase (PostgreSQL) | Auth + DB + RLS + Realtime + Edge Functions in one platform |
| **Auth** | Supabase Auth | Magic links (primary), passwords (fallback), PKCE flow |
| **Photo storage** | Cloudflare R2 | S3-compatible, zero egress fees (critical for photo-heavy app) |
| **Image processing** | Sharp | Server-side LUT application, grain, vignette, HEIC conversion |
| **Color correction** | eyeQ / Perfectly Clear | Professional auto-correction (white balance, exposure, skin tones) |
| **Print fulfillment** | Prodigi API v4.0 | Global POD network, Fujifilm Frontier printers, webhooks |
| **Payments** | Stripe | Subscriptions, checkout, customer portal, webhooks |
| **Email** | Resend | Transactional email with React-based templates |
| **Analytics** | PostHog | Product analytics, event tracking, funnels |
| **Error tracking** | Sentry | Server + client error monitoring |
| **Push notifications** | Web Push API | Browser push for roll developed, prints shipped, Circle activity |
| **Hosting** | Vercel | Serverless deployment, preview environments, CDN |
| **AI insights (admin)** | Claude API | Admin dashboard anomaly detection, growth analysis |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│   Next.js App Router │ React 19 │ Zustand │ Tailwind│
└────────────┬────────────────────────────┬───────────┘
             │ HTTPS                      │ WebSocket
             ▼                            ▼
┌────────────────────┐      ┌──────────────────────┐
│   Vercel Edge/Node │      │  Supabase Realtime    │
│   API Routes       │      │  (processing status,  │
│   /api/*           │      │   Circle feed)        │
└──┬─────┬─────┬─────┘      └──────────────────────┘
   │     │     │
   │     │     └──────────────────────┐
   ▼     ▼                            ▼
┌──────┐ ┌──────────┐    ┌──────────────────┐
│Stripe│ │ Supabase │    │  Cloudflare R2   │
│      │ │ Postgres │    │  (Photo Storage) │
│      │ │ + RLS    │    │  Zero egress     │
└──────┘ └──────────┘    └──────────────────┘
              │
              │ Edge Functions
              ▼
┌─────────────────────────────────────────┐
│         Processing Pipeline             │
│  ┌─────────┐  ┌─────┐  ┌───────────┐   │
│  │  eyeQ   │→│Sharp │→│  R2 Store  │   │
│  │  Color  │  │ LUT  │  │ Processed │   │
│  │Correct  │  │Grain │  │  Photos   │   │
│  └─────────┘  │Vign. │  └───────────┘   │
│               └─────┘                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────┐    ┌──────────────┐
│   Prodigi API       │    │   Resend     │
│   (Print Orders)    │    │   (Email)    │
└─────────────────────┘    └──────────────┘
```

---

## Database Schema (24 Tables)

### Core Tables

| Table | Purpose | Key Columns | RLS |
|-------|---------|------------|-----|
| `profiles` | User accounts | id, email, display_name, tier (free/plus), role (user/admin) | Own user only |
| `photos` | Every uploaded photo | id, user_id, storage_key, thumbnail_key, status, exif_data, filter_results, content_hash | Own user only |
| `rolls` | Photo roll collections | id, user_id, name, status, film_profile, photo_count | Own user only |
| `roll_photos` | Photos in a roll | roll_id, photo_id, position, processed_key, correction_applied | Roll owner only |
| `favorites` | Hearted photos | id, user_id, photo_id, roll_id | Own user only |

### Social Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `circles` | Private sharing groups | Circle members only |
| `circle_members` | Group membership + roles | Circle members only |
| `circle_invites` | 7-day expiring invite tokens | Creator only |
| `circle_posts` | Shared photos/reels in circle | Circle members only |
| `circle_post_photos` | Photos within a post | Circle members only |
| `circle_reactions` | Heart, smile, wow on posts | Circle members only |
| `circle_comments` | Comments on posts | Circle members only |

### Commerce Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `print_orders` | Prodigi print orders | Own user only |
| `print_order_items` | Line items per order | Own user only |

### Video Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `reels` | Video reel collections | Own user only |
| `reel_clips` | Clips within a reel | Own user only |
| `favorite_reels` | Hearted reels | Own user only |

### Organization Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `collections` | Photo groups (auto + manual) | Own user only |
| `collection_photos` | Photos in collections | Own user only |
| `people` | Detected faces / clusters | Own user only |
| `photo_tags` | Tags on photos | Own user only |

### System Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `processing_jobs` | Async job tracking | System |
| `push_subscriptions` | Web push endpoints | Own user only |
| `referrals` | Referral tracking | Own user only |

### Admin Tables

| Table | Purpose |
|-------|---------|
| `admin_audit_log` | All admin actions tracked |
| `admin_insights` | AI-generated anomalies and trends |
| `admin_analysis_runs` | Claude AI analysis results |
| `admin_notes` | Internal notes on users/orders |

---

## Key Build vs. Buy Decisions

| Decision | Choice | Why | Cost Impact |
|----------|--------|-----|------------|
| Color correction | **Buy** (eyeQ API → self-hosted Docker) | Core quality driver; building equivalent would take 6+ months and PhD-level expertise | $0.03/photo (API) → $0.01/photo (Docker) |
| Film profiles (LUTs) | **Build** (custom .cube files) | This IS the product; must be unique and high-quality | One-time creation cost + ongoing refinement |
| Print fulfillment | **Buy** (Prodigi API) | Building a print lab is capital-intensive; Prodigi has Fujifilm Frontier printers | COGS per order |
| Auth | **Buy** (Supabase Auth) | Magic links, session management, PKCE — commoditized | $0 (included in Supabase) |
| Database | **Buy** (Supabase/PostgreSQL) | Industry standard; RLS, Realtime, Edge Functions included | $25-$599/month |
| Image processing | **Build** (Sharp pipeline) | LUT application, grain, vignette are custom; Sharp is the tool | Open source |
| Photo storage | **Buy** (Cloudflare R2) | Zero egress is non-negotiable; building storage is wasteful | $0.015/GB/month |
| Analytics | **Buy** (PostHog) | Product analytics is commoditized | $0-$6K/month (scales) |
| Email | **Buy** (Resend) | Transactional email is commoditized | $0-$95/month |
| Payment processing | **Buy** (Stripe) | Industry standard; no reason to build | 2.9% + $0.30 |
| Mobile app | **Build** (SwiftUI native) | Camera roll access, Vision framework, performance require native | Development cost |
| Video processing | **Build** (Sharp + eyeQ + FFmpeg) | Same pipeline as photos; unique combination | Development cost |

---

## Technical Moats

### 1. Processing Pipeline Quality
The combination of eyeQ professional correction + custom LUTs + grain/vignette compositing creates output quality that generic filter apps cannot match. This is not a "slap a filter on" approach — it's a multi-stage pipeline where each stage matters:

```
Original → eyeQ (scene-aware correction) → LUT (film character) → Grain (texture) → Vignette (focus)
```

Each LUT is hand-tuned and tested on diverse photo types (portraits, landscapes, indoor, outdoor, skin tones). The grain textures are unique per profile and tileable. The pipeline is the product.

### 2. Zero-Egress Storage Architecture
Choosing Cloudflare R2 over AWS S3 is a strategic infrastructure decision that becomes more valuable at scale:

| Scale | Monthly Reads | S3 Egress Cost | R2 Egress Cost |
|-------|-------------|---------------|---------------|
| 10K users | ~50M | ~$4,500 | $0 |
| 100K users | ~500M | ~$45,000 | $0 |
| 500K users | ~2.5B | ~$225,000 | $0 |

This is a $225K/month structural cost advantage at 500K users.

### 3. Backend Portability (Web → iOS)
The Supabase backend is designed to transfer 1:1 to native iOS:
- Same PostgreSQL database
- Same RLS policies
- Same Edge Functions
- Same R2 storage
- Swift Supabase client mirrors JavaScript client

This means iOS development is **frontend only** — no backend rewrite, no data migration, no API redesign. Estimated 60% faster iOS launch than building from scratch.

### 4. RLS Security Model
Row Level Security on every table means the database is the security layer, not application code. This is:
- More secure than application-level auth checks (no "forgot to check permissions" bugs)
- Portable across clients (web, iOS, Android all use the same policies)
- Auditable (policies are SQL, stored in migrations)

---

## Scaling Considerations

### Photo Processing Pipeline

**Current:** Vercel serverless functions process photos sequentially.
- Capacity: ~500 rolls/day (18,000 photos)
- Bottleneck: eyeQ API rate limit (100 req/minute)
- Cost: Dominated by eyeQ API calls

**At 5K+ rolls/day (needed ~Month 6):**
- Move to self-hosted eyeQ Docker on dedicated GPU instance
- Implement parallel processing (batch 6-10 photos simultaneously)
- Queue-based architecture (processing_jobs table + Edge Function workers)
- Estimated capacity: 50K+ rolls/day

**At 50K+ rolls/day (needed ~Month 12-18):**
- Horizontal scaling with multiple processing instances
- Geographic distribution (process close to user for latency)
- Cost optimization: batch processing during off-peak hours

### Database Scaling

| Users | DB Size (est.) | Tier Needed | Monthly Cost |
|-------|---------------|------------|-------------|
| 10K | ~5GB | Supabase Pro | $25 |
| 50K | ~25GB | Supabase Team | $599 |
| 200K | ~100GB | Supabase Enterprise | Custom |
| 500K | ~250GB | Supabase Enterprise | Custom |

**Key scaling points:**
- Connection pooling required at ~10K concurrent users
- Read replicas needed at ~50K concurrent users
- Consider PgBouncer or Supabase connection pooler

### Storage Scaling

R2 scales linearly with users and photos. No architectural changes needed — just cost growth.

Critical optimization: aggressive thumbnail caching via Cloudflare Worker CDN (30-day cache, content-hash URLs are immutable). This reduces R2 read operations significantly.

---

## Security Architecture

### Defense in Depth

```
Layer 1: TLS 1.3 (encryption in transit)
Layer 2: Supabase Auth (session management, JWT)
Layer 3: Next.js middleware (route protection)
Layer 4: RLS policies (database-level access control)
Layer 5: Signed URLs (storage-level access control, 1-hour expiry)
Layer 6: AES-256 (encryption at rest)
Layer 7: Input validation (API route level)
Layer 8: Rate limiting (per-endpoint)
Layer 9: EXIF GPS stripping (privacy layer for Circle sharing)
```

### Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| GDPR | Compliant | Account deletion, data export, minimal data collection |
| CCPA | Compliant | Privacy policy, data deletion, no data sales |
| SOC 2 | Supabase Team tier includes | Infrastructure level |
| COPPA | Compliant by design | No child accounts, no public profiles |

### Key Security Decisions

1. **httpOnly cookies for sessions** — Not localStorage (XSS-resistant)
2. **Service role key server-side only** — Never exposed to client
3. **Signed URLs with short expiry** — 1 hour for display, 24 hours for Prodigi
4. **Circle photo isolation** — Photos copied to separate namespace, no cross-user URL guessing
5. **No third-party tracking** — PostHog (first-party) only; no Facebook Pixel, Google Analytics, or ad network SDKs

---

## Infrastructure Costs at Scale

### Monthly Infrastructure Summary

| Component | 10K Users | 50K Users | 100K Users | 500K Users |
|-----------|----------|----------|-----------|-----------|
| Vercel | $20 | $200 | $500 | $500+ |
| Supabase | $25 | $599 | $599 | Custom ($2K+) |
| R2 Storage | $488 | $2,438 | $4,875 | $24,375 |
| eyeQ (self-hosted) | — | $1,500 | $3,000 | $12,000 |
| PostHog | $345 | $1,725 | $3,450 | $17,250 |
| Sentry | $26 | $80 | $80 | $200 |
| Resend | $20 | $20 | $95 | Custom |
| Stripe Fees | $2,200 | $11,000 | $22,000 | $110,000 |
| GPU instances (processing) | — | $500 | $1,500 | $6,000 |
| **Total Infra** | **~$3,124** | **~$18,062** | **~$36,099** | **~$172,325** |
| **Per-user/month** | **$0.31** | **$0.36** | **$0.36** | **$0.34** |

**Key insight:** Infrastructure cost per user is remarkably flat (~$0.31-$0.36) across scale. The architecture scales efficiently. The dominant costs are Stripe fees (which are revenue-proportional) and R2 storage (which is linear and predictable).

---

## Technical Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| eyeQ API deprecated or pricing increase | Low | High | Self-hosted Docker; or evaluate alternatives (Photoroom, custom ML) |
| Vercel pricing changes | Low | Medium | Next.js is portable; can deploy on any Node.js host |
| Supabase outage | Low | High | Database backups, read replicas at scale |
| LUT quality issues on diverse photo types | Medium | High | Test on 500+ diverse photos before shipping; ongoing quality reviews |
| HEIC conversion failures | Medium | Low | Sharp handles HEIC well; fallback to rejecting with clear error |
| R2 pricing changes | Very Low | Medium | R2 is strategically priced by Cloudflare; can migrate to S3 if needed |
| Processing pipeline bottleneck | Medium | Medium | Queue-based architecture, horizontal scaling, off-peak batch processing |
| Mobile web performance issues | Medium | Medium | Native iOS app (Phase 6) resolves this for primary platform |

---

## Technology Timeline

| Month | Infrastructure Milestone |
|-------|------------------------|
| 0 | Web prototype on Vercel + Supabase Pro + R2 |
| 3 | Self-hosted eyeQ Docker deployment |
| 6 | iOS app launch; Supabase Team tier; connection pooling |
| 9 | Queue-based processing pipeline; geographic distribution |
| 12 | Horizontal scaling; read replicas; CDN optimization |
| 18 | Enterprise infrastructure; SOC 2 compliance; multi-region |
