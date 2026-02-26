# 01 — Product Overview & Vision

## What Is Roll?

Roll is a photo and video application that rescues people's photo libraries from digital oblivion. It takes the 20,000+ photos buried on a user's phone — most of them screenshots, duplicates, and blurry throwaway shots — and transforms the meaningful ones into beautiful, film-inspired prints delivered to their door.

**Core Promise:** Your phone captures everything. Roll turns it into something worth keeping.

**Tagline:** "Develop your roll."

Roll is not a photo editor. It is not a social network. It is not a cloud storage service. It is a **photo lab** — a modern digital darkroom that does the work professional photographers and film labs used to do, but for everyday people, automatically.

---

## How It Works: The Core Product Loop

Roll operates on a **Four-Tier Curation Model** that progressively narrows thousands of photos down to the handful that matter most:

### Tier 1: Raw Library (Everything Uploaded)
The user uploads their camera roll — hundreds to thousands of photos. This is the chaos. Screenshots of recipes, seven nearly-identical shots of the same moment, dark blurry photos from a pocket, screenshots of text conversations, duplicate photos sent over iMessage.

### Tier 2: Filtered Feed (Intelligent Cleanup)
Roll's server-side processing pipeline automatically removes the noise:
- **Screenshots** detected via dimension analysis + missing camera EXIF data
- **Blurry photos** caught via Laplacian variance (blur detection)
- **Near-duplicates** collapsed using perceptual hashing (hamming distance < 5)
- **Extreme exposure** (very dark or blown-out) via histogram analysis
- **Documents and text-heavy images** via OCR confidence scoring

**Result:** 30-50% of uploads are filtered out. The user sees only what's worth looking at. Content modes ("People Only," "Landscapes") further narrow the view.

### Tier 3: Developed Rolls (Curated + Processed)
The user checkmarks their favorite 36 photos to fill a "roll" — exactly like a 36-exposure roll of 35mm film. They choose one of six film stock profiles (Warmth, Golden, Vivid, Classic, Gentle, Modern). Roll then:

1. Sends each photo through **eyeQ cloud color correction** — professional white balance, exposure, skin tone accuracy, sharpening, noise reduction
2. Applies the selected **film LUT** (3D color lookup table) via Sharp
3. Adds **film grain** texture and subtle **vignette**
4. Stores the processed version alongside the original

**Result:** Photos that look like they were shot on film and developed by a great lab. Zero manual editing required.

### Tier 4: Favorites (Portfolio Grade)
After developing, the user hearts their absolute best photos. These collect in a Favorites portfolio — the best of the best, across all rolls. Favorites unlock album printing, Circle sharing, book creation, and Year in Review features.

---

## The Two-Gesture Interaction Model

Roll's entire user interaction collapses to two gestures:

| Gesture | Symbol | Meaning | Where |
|---------|--------|---------|-------|
| **Checkmark** | ✓ | "Develop this" — select for a roll | Filtered Feed (Tier 2 → 3) |
| **Heart** | ♥ | "Treasure this" — mark as a favorite | Developed Gallery (Tier 3 → 4) |

This radical simplicity is intentional. There are no sliders, no editing tools, no exposure controls, no cropping interfaces. The user makes two types of decisions — "include this" and "love this" — and Roll handles everything else.

---

## Key Product Features

### Photo Processing
- **Six film profiles:** Warmth (warm color, default), Golden (punchy nostalgic amber), Vivid (saturated bold color), Classic (high-contrast B&W), Gentle (soft B&W), Modern (clean contemporary B&W)
- **Cloud color correction** via eyeQ/Perfectly Clear API before LUT application
- **Film grain + vignette** composited per profile for authentic analog feel
- **36-photo roll constraint** — mirrors real 35mm film, creates satisfying completion mechanic

### Physical Prints
- **Free first roll:** 36 4×6 prints, free shipping, no credit card required — the most powerful acquisition hook
- **Ongoing prints:** 4×6 and 5×7 prints via Prodigi (Fujifilm Frontier lab printers)
- **Hardcover photo books:** $29.99+, auto-assembled from Favorites
- **Magazines (planned):** $9.99-$14.99 softcover alternative to books
- **Print & magazine subscriptions (planned):** Monthly auto-delivery

### Circle (Private Sharing)
- Private groups with invite-only access (7-day expiring links)
- Chronological feed — no algorithm, no ads, no public profiles
- Reactions (heart, smile, wow) — private, visible only to the poster
- Members can order prints from shared photos
- **Positioned directly against Instagram** — "Remember when social media was just photos from people you love?"

### Video/Reels
- Same four-tier model applied to video clips
- eyeQ frame sampling + LUT application across all frames
- Film stock profiles applied to video for consistent aesthetic
- Audio mood options (original, quiet film, silent film, ambient)

### Books & Albums
- Full book creation from Favorites
- Page-by-page layout with captions
- Templates (Baby's First Year, Year in Review — planned)
- Auto-assembly from Favorites (planned)
- Collaborative books from Circle members (planned)

### Cloud Backup
- Free tier: 100 photos backed up, full resolution, encrypted
- Roll+: Unlimited backup for entire library
- AES-256 encryption at rest, TLS 1.3 in transit

---

## Brand Identity

### Voice & Personality
Roll speaks like a warm, experienced photo lab owner — not a tech startup. The brand voice is:
- **Warm** — "Your roll is developed" not "Processing complete!"
- **Confident** — "We'll clean up the noise" not "Our AI-powered algorithm will attempt to..."
- **Honest** — "We removed 47 duplicates and blurry shots" not "We enhanced your experience"
- **Simple** — Short sentences. No exclamation marks. Photography language, not tech language.

### Anti-AI Positioning
Roll explicitly bans the words "AI-powered," "algorithm," "machine learning," and "neural network" from all user-facing copy. The technology is invisible. Users see outcomes ("We removed 47 screenshots"), not methodology. This is a deliberate brand strategy in response to widespread AI fatigue.

### Visual Design
- **Rooted in analog photography:** Darkrooms, contact sheets, film canisters, kraft paper envelopes
- **Colors:** Warm cream (#FAF7F2, unexposed photo paper), terracotta (#C45D3E, safelight amber), dark walnut (#1A1612, developer tray)
- **Typography:** Cormorant Garamond (display), Plus Jakarta Sans (body), Space Mono (technical details)
- **Signature element:** Film strip progress bar with sprocket holes and frame counter — uniquely Roll
- **Not** blue accents, white backgrounds, or SaaS templates. The aesthetic is photography monograph, not tech product.

---

## Long-Term Vision

### Phase 1: Web Prototype (Current)
Validate the core product loop — upload → filter → develop → print. Prove that people will pay for film-aesthetic prints of their own photos. Build on Next.js with Supabase backend designed to transfer 1:1 to native apps.

### Phase 2: Real Payments & iOS Native
Stripe integration for real transactions. SwiftUI native app with on-device camera roll access (Apple Vision framework for filtering), Sign in with Apple, and push notifications. The Supabase backend transfers directly.

### Phase 3: Expansion
- Magazine product ($9.99-$14.99, lower barrier than books)
- Print and magazine subscriptions (monthly auto-delivery)
- Roll Business tier ($9.99/month) for small business owners — public portfolio pages, blog posts, web gallery embeds, brand consistency tools
- Digital frame integration (Aura)
- Referral program and viral growth mechanics

### Phase 4: Platform
- Public portfolio pages (roll.photos/[username])
- Web gallery embeds for business websites
- Collaborative books from Circle groups
- Year in Review auto-generated annual books
- Partnerships with print labs, frame companies, and family-focused brands

### The End State
Roll becomes the default destination for people who want to **do something** with their photos — not just store them, not just share them ephemerally, but transform them into physical, beautiful, lasting artifacts. The business model is dual-revenue: subscriptions for ongoing access (MRR) and physical products for ongoing purchases (transaction revenue). Both grow with engagement.

---

## Why Now?

1. **Photo volume is at an all-time high.** The average smartphone user takes 2,000+ photos per year. Camera rolls have become unmanageable graveyards.
2. **Instagram has lost its way.** Users are actively seeking alternatives to algorithmic, ad-heavy feeds. Privacy-first, photo-only platforms have whitespace.
3. **AI fatigue is real.** Products that position technology as invisible and outcomes as magical have a brand advantage.
4. **Physical photo products are growing.** The global photo printing market is projected to reach $24B+ by 2028. People want tangible artifacts.
5. **Print-on-demand infrastructure is mature.** Services like Prodigi make it possible to offer professional prints without owning a lab.
6. **Cloud processing costs are falling.** APIs like eyeQ make professional color correction available at $0.02-$0.05 per photo.

---

## Key Metrics to Watch

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Filter precision | >90% | Core value prop — "we clean up the noise" |
| Time to first checkmark | <2 minutes | Speed to engagement |
| First roll completion rate | >60% of users who start | Validates the 36-frame mechanic |
| Favorites rate | >15% of developed photos | Proves emotional connection |
| Roll develop completion | >80% of filled rolls | Users follow through |
| Free-to-paid conversion | >5% within 30 days | Freemium model works |
| Print reorder rate | >40% within 60 days | Physical product creates habit |
| Circle invite acceptance | >50% | Social loop drives growth |
| Monthly churn (Roll+) | <5% | Subscription retention |
| NPS | >50 | Overall satisfaction |
