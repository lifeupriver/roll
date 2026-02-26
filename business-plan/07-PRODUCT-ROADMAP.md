# 07 — Product Roadmap & Feature Pipeline

---

## Development Phases

### Phase 1: Foundation + Core Loop (Weeks 1-4) — COMPLETE

**Deliverable:** User can sign in, upload photos, see filtered feed with content modes.

**What was built:**
- Next.js 16 project with App Router, TypeScript, Tailwind CSS 4
- Supabase project (Auth, PostgreSQL, RLS)
- Full design system (Cormorant Garamond, Plus Jakarta Sans, Space Mono, film-inspired tokens)
- Base UI components (Button, Card, Input, Modal, Toast, Badge, Pill, ProgressBar, Skeleton)
- Authentication (magic link + password)
- Photo upload (batch, drag-and-drop, HEIC conversion, EXIF extraction)
- Filtering pipeline (screenshot, blur, duplicate, exposure, document detection)
- Filtered feed with PhotoGrid, PhotoCard, content modes (All, People, Landscapes)
- Manual hide with undo
- Onboarding flow (5 screens)
- Zustand stores (photo, roll, user, filter)
- Cloudflare R2 storage with presigned URLs
- 24 database tables with full RLS policies

### Phase 2: Roll Building + Processing (Weeks 5-8) — COMPLETE

**Deliverable:** User can build a roll, choose film, develop it, see processed photos.

**What was built:**
- Checkmark gesture on photos
- Film strip progress bar (signature UI element with sprocket holes)
- Roll auto-creation, auto-close at 36, manual close at 10+
- Drag-to-reorder, remove from roll
- Film profile selector (horizontal scroll, live preview)
- 6 .cube LUT files + 6 grain texture overlays
- eyeQ API integration (cloud color correction)
- Full processing pipeline: eyeQ → LUT → grain → vignette → R2 storage
- Real-time processing status UI
- Developed roll gallery with lightbox
- Library tab (Rolls with status badges)
- Tier-based film profile locking (Free = Warmth only)

### Phase 3: Favorites + Prints + Circle (Weeks 9-11) — COMPLETE

**Deliverable:** Full prototype feature-complete: hearts, prints, private sharing.

**What was built:**
- Heart gesture on developed photos
- Favorites section in Library
- Print ordering flow (product selection, address form, confirmation)
- Free first roll detection and offer
- Prodigi integration (order submission, webhooks, status tracking)
- Order tracking UI (pending → printing → shipped → delivered)
- Circle creation (Roll+ only), invite links (7-day expiry)
- Circle feed (chronological, no algorithm)
- "Share to Circle" from Favorites
- Circle reactions (heart, smile, wow)
- 4 email templates via Resend (magic link, roll developed, prints shipped, circle invite)
- PostHog analytics integration
- Sentry error tracking

### Phase 4: Landing Page + Polish + Launch (Weeks 12-14) — IN PROGRESS

**Deliverable:** Deployed prototype at roll.photos, performance-tuned, launch-ready.

**What is being built:**
- Landing page (hero, problem, how-it-works, film profiles, free roll, Circle, pricing, CTA)
- ROLL logotype SVG
- OG image, meta tags, structured data
- Lighthouse optimization (target >90 on mobile)
- Accessibility audit (keyboard nav, screen reader, focus states)
- Security headers audit
- Production Vercel deployment
- DNS configuration for roll.photos
- Stripe integration (real payments)
- Admin dashboard

---

## Post-Launch Roadmap

### Phase 5: Real Payments + Growth (Month 1-3 Post-Launch)

| Feature | Priority | Revenue Impact | Effort |
|---------|----------|---------------|--------|
| Stripe subscription billing (Roll+) | P0 | Direct MRR | Medium |
| Annual billing option ($47.99/year) | P0 | Reduced churn, upfront cash | Small |
| Payment method management (Stripe portal) | P0 | Reduces failed payments | Small |
| Photo-level captions (expand beyond Books) | P1 | Engagement → retention | Medium |
| Roll-level stories (narrative text field) | P1 | Engagement → retention | Small |
| Backup status indicator (Account page) | P1 | Perceived value → retention | Small |
| Landing page copy enhancements | P1 | Conversion rate improvement | Small |
| Privacy section on landing page | P1 | Trust → conversion | Small |
| Referral program infrastructure | P2 | Viral growth | Medium |
| UTM tracking for acquisition channels | P2 | Marketing optimization | Small |

### Phase 6: iOS Native App (Month 3-6)

| Feature | Priority | Why |
|---------|----------|-----|
| SwiftUI native app | P0 | Primary platform for target users |
| Sign in with Apple | P0 | Frictionless auth |
| On-device camera roll access | P0 | No more file picker; scan entire library |
| Apple Vision framework for filtering | P0 | Superior face/scene detection |
| Background photo sync | P0 | Automatic backup |
| Push notifications (native) | P0 | Roll developed, prints shipped, Circle activity |
| RevenueCat subscription management | P0 | Apple IAP compliance |
| Haptic feedback on checkmark/heart | P1 | Premium feel |
| Widget (favorite photo of the day) | P2 | Home screen presence |

**Key insight:** The Supabase backend transfers 1:1 to iOS. No backend rewrite needed. All RLS policies, Edge Functions, and API patterns work with the Swift Supabase client.

### Phase 7: Products & Revenue Expansion (Month 6-9)

| Feature | Priority | Revenue Impact | Effort |
|---------|----------|---------------|--------|
| Magazine product ($9.99-$14.99) | P0 | New revenue stream, fills price gap | Medium |
| Magazine subscription ($9.99/month) | P0 | Recurring physical product revenue | Medium |
| Print subscription ($11.99/month) | P0 | Recurring revenue, existing API | Small |
| Book templates (Baby's First Year, Year in Review) | P1 | Book purchase conversion | Medium |
| Auto-book assembly from Favorites | P1 | Removes friction → more book orders | Medium |
| Auto-layout engine (varied page templates) | P1 | Professional-quality books | Large |
| Collaborative books (Circle members contribute) | P2 | Higher AOV, social engagement | Medium |
| 5×7 and 8×10 print options | P2 | Higher margin per order | Small |
| Wall art / framed prints | P2 | Premium margin product | Medium |

### Phase 8: Business Tier + Advanced Features (Month 9-12)

| Feature | Priority | Revenue Impact | Effort |
|---------|----------|---------------|--------|
| Roll Business tier ($9.99/month) | P0 | Higher-ARPU segment | Medium |
| Public portfolio pages (roll.photos/[username]) | P0 | Business tier core feature | Large |
| Blog posts with photos | P1 | Business content creation | Medium |
| Web gallery embeds | P1 | Business website integration | Medium |
| Batch film stock processing | P1 | Business efficiency | Small |
| Brand profiles (locked film stock) | P2 | Business brand consistency | Small |
| Collaborative books from Circle | P2 | Social commerce | Medium |
| Year in Review auto-generation | P2 | Annual engagement peak | Medium |
| Privacy dashboard | P2 | Trust + GDPR compliance | Medium |

### Phase 9: Scale + Growth (Month 12-18)

| Feature | Priority | Revenue Impact | Effort |
|---------|----------|---------------|--------|
| Digital frame integration (Aura, Nixplay) | P1 | Partnership revenue, premium feature | Medium |
| "Send prints to someone" (gift feature) | P1 | New purchase occasions | Medium |
| AI-suggested captions (opt-in) | P2 | Engagement → retention | Medium |
| Best-of-burst photo picker | P2 | Improved curation quality | Medium |
| People tagging + face search | P2 | Powerful organization | Large |
| QR codes on prints (link to video/story) | P2 | Bridge physical + digital | Small |
| Android app (Capacitor or native) | P1 | Market expansion | Large |
| International shipping optimization | P1 | Market expansion | Medium |
| Enterprise/education tier | P2 | New segment | Medium |

---

## Feature Prioritization Framework

Every feature is evaluated on three axes:

### 1. Revenue Impact
- **Direct revenue:** Does this feature generate new revenue or increase ARPU?
- **Retention impact:** Does it reduce churn? (Indirect revenue)
- **Acquisition impact:** Does it drive new user signups? (Growth → future revenue)

### 2. Strategic Value
- **Competitive moat:** Does it make Roll harder to replicate?
- **Platform lock-in:** Does it increase switching costs?
- **Brand reinforcement:** Does it strengthen the "photo lab" identity?

### 3. Effort & Risk
- **Development effort:** Small (days), Medium (1-2 weeks), Large (4+ weeks)
- **Technical risk:** Does it require new infrastructure or third-party dependencies?
- **Design risk:** Does it require significant UX exploration?

### Priority Matrix

```
                HIGH REVENUE IMPACT
                       |
   Magazine product  [Stripe billing]   Print subscriptions
                |        |                    |
LOW EFFORT -----+--------+-------------------+---- HIGH EFFORT
                |        |                    |
        Caption nudges  iOS app        Public portfolios
                       |
               LOW REVENUE IMPACT
```

---

## Technical Debt & Infrastructure Priorities

| Item | Priority | Why |
|------|----------|-----|
| Self-hosted eyeQ Docker | P0 (Month 3) | 4-5x cost reduction on largest variable cost |
| Database connection pooling | P1 (Month 6) | Required for >10K concurrent users |
| CDN optimization for photo delivery | P1 (Month 6) | Performance at scale |
| Automated backup verification | P2 (Month 9) | Data integrity assurance |
| Horizontal scaling for processing pipeline | P2 (Month 12) | Handle 50K+ rolls/month |

---

## Key Milestones

| Milestone | Target Date | Validates |
|-----------|------------|----------|
| Production deploy | Week 14 | Core product works end-to-end |
| 100 paying subscribers | Month 2 | People will pay for this |
| 1,000 paying subscribers | Month 4 | Repeatable conversion |
| $10K MRR | Month 5-6 | Subscription revenue is real |
| iOS app in App Store | Month 6 | Primary platform live |
| Magazine product launched | Month 7 | Print revenue diversification |
| $50K MRR | Month 9-10 | Path to sustainability |
| Roll Business tier live | Month 10 | Revenue expansion working |
| 10,000 paying subscribers | Month 12 | Scale proof |
| $100K MRR | Month 14-16 | Series A readiness |
| Self-sustaining (breakeven) | Month 18-24 | Business viability |

---

## What We Will NOT Build

Clarity on what we won't do is as important as what we will:

1. **Manual photo editing tools** — No sliders, no crop, no exposure controls. Ever. The zero-editing philosophy is core to the brand.
2. **Public social profiles** — No follower counts, no discoverability, no algorithmic feed. Circle is private by design.
3. **AI chatbot / assistant** — We don't "talk to you about your photos." We process and print them.
4. **NFTs or digital collectibles** — Not aligned with physical print philosophy.
5. **Calendar, mug, or novelty print products** — Focus on prints, books, and magazines. Quality over breadth.
6. **Video editing timeline** — Reels are auto-assembled, not manually edited. Same zero-effort philosophy as photos.
7. **Integration with Instagram/TikTok for posting** — Roll is the alternative, not a tool for those platforms.
