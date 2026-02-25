# Roll — Pain Points, Solutions & Implementation Plan

> Every feature, every word of copy, every design decision traces back to a specific human problem. This document maps each pain point to what Roll has built, what gaps remain, and exactly what to build next — organized for phased implementation.

Version 1.0 · February 2026

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Pain Point Matrix](#2-pain-point-matrix)
3. [Pain Point Deep Dives (#1–#14)](#3-pain-point-1-overwhelmed-by-photo-volume)
4. [Integrated Marketing Framework](#17-integrated-marketing-framework)
5. [Phased Implementation Roadmap](#18-phased-implementation-roadmap)
6. [Pricing Architecture](#19-pricing-architecture)
7. [The Complete User Journey](#20-the-complete-user-journey)

---

## 1. Executive Overview

### 1.1 The Core Realization

These 14 pain points are not independent problems. They are symptoms of a single underlying failure: digital photography made it infinitely easy to capture moments and infinitely hard to do anything meaningful with them. Every phone is a filing cabinet with 40,000 unsorted, unedited, unprinted, uncaptioned, unshared photos. Roll is not 14 separate features solving 14 separate problems. Roll is one coherent answer to one question: *what happens to all these photos?*

### 1.2 Document Purpose

This document is designed to be given directly to Claude Code as an implementation guide. Each pain point includes:
- Severity rating and current status
- What the codebase already has (with file/route references where known)
- Specific gaps identified
- Feature specifications detailed enough to build from
- Marketing copy recommendations
- Phase assignment for the development roadmap

---

## 2. Pain Point Matrix

| # | Pain Point | Status | Gap Severity | Phase | Effort | Impact |
|---|-----------|--------|-------------|-------|--------|--------|
| 1 | Overwhelmed by photo volume | **Strong** | Low | MVP | Done | Critical |
| 2 | Photos not backed up properly | **Partial** | Medium | MVP+ | Low | High |
| 3 | Photos not captioned (context lost) | **Partial** | High | MVP+ | Medium | Critical |
| 4 | Photos not printed | **Strong** | Low | MVP | Done | Critical |
| 5 | Instagram is broken | **Strong** | Medium | MVP | Done* | High |
| 6 | Parents don't make baby books | **Planned** | High | Phase 2 | High | Critical |
| 7 | Photo editing is too hard | **Strong** | Low | MVP | Done | High |
| 8 | Too many options / choice paralysis | **Strong** | Low | MVP | Done | Medium |
| 9 | Small biz: shareable galleries | **Weak** | High | Phase 2 | High | High |
| 10 | Video color correction is hard | **Architecture only** | Medium | Phase 3 | Very High | Medium |
| 11 | Book design is labor intensive | **Planned** | High | Phase 2 | High | High |
| 12 | Photo books are expensive | **Not addressed** | High | Phase 2 | Medium | High |
| 13 | AI fatigue | **Strong in brand** | Low | MVP | Low | High |
| 14 | Privacy concerns | **Strong in code** | Medium | MVP | Low | Critical |

*\*Circle is built but free Circle creation is a new MVP change (see Pain Point #5).*

---

## 3. Pain Point #1: Overwhelmed by Photo Volume

**SEVERITY: CRITICAL**

*"I have 43,000 photos on my phone. I can't find anything. I don't even want to open my camera roll anymore."*

### Current Status: Strong

The codebase has solid coverage:
- **Server-side filtering pipeline** (`/api/process/filter`) — automatically removes blur, screenshots, duplicates, extreme exposure, and documents. Typically filters 30–50% of uploads.
- **Content Modes** — All, People, Landscapes. "People Only" mode designed specifically for parents.
- **Four-tier curation model** — Raw Library → Filtered Feed → Developed Rolls → Favorites.
- **Smart Collections** (`/collections` page) — auto-groups photos by trips, seasons, people, cameras.
- **Photo stacks** (`/api/photos/stacks`) — groups similar photos together.
- **AI-suggested checkmarks** (`/api/rolls/suggest`) — recommends which photos to develop.

### Gaps Identified

Even after filtering, a 40,000-photo library still leaves 12,000–15,000 visible photos. That's still overwhelming for a parent trying to pick 36 for a roll. The filtered feed is chronological but has no "smart nudges" helping users find what to checkmark next. Users who open the app cold may feel lost staring at thousands of filtered photos.

### Enhancements Needed

#### Weekly Digest Notification (MVP+)

Push notification every Sunday evening. AI scans photos taken that week, identifies those with faces (prioritizing People Only content mode data), and pre-selects the top candidates. User taps notification → lands on a "This Week" view showing suggested photos with checkmarks ready. One tap to add all to current roll, or individual selection.

**Implementation:** New endpoint `/api/digest/weekly` that queries `photos` table for `captured_at` within last 7 days, `filter_status = 'visible'`, `face_count >= 1`, ordered by `aesthetic_score` DESC. Push notification via existing push infrastructure. New UI view: `/feed/this-week`.

#### Moment Clusters in Feed (MVP+)

Auto-detected temporal/location clusters displayed as horizontal card groups within the chronological feed. Each moment shows a cover photo, location name, date, and photo count. Tap to expand into a focused view of just that moment's photos.

**Implementation:** Temporal clustering already exists for roll detection. Surface these clusters as a visual layer in the Feed. Each cluster card: cover photo (highest `aesthetic_score` in cluster), `location_name`, date range, photo count. New component: `MomentClusterCard`.

#### "Start Here" First-Time Prompt (MVP)

For new users seeing their filtered feed for the first time, surface the most recent moment cluster prominently: "Start with your [Pumpkin Patch] photos from October? 23 photos, 8 great ones." This eliminates the blank-canvas feeling.

**Implementation:** On first feed render where `user.first_checkmark_at` is null, query most recent moment cluster with 10+ photos, display as a hero card at top of feed.

### Marketing Copy

**Headline:** *"40,000 photos. We'll help you find the ones that matter."*

**Body:** Your camera roll is a mess. We know. Roll removes the junk, groups your photos into moments, and helps you pick the best ones — without scrolling through thousands of screenshots and blurry shots. Start with this week. Pick 36. We'll do the rest.

**Specificity hooks:**
- "We removed 47 screenshots and 23 duplicates. Here are the 312 photos worth looking at."
- "Your camera roll has 23,000 photos. Most of them are noise. Roll finds the signal."
- "People Only mode shows you what matters most — the faces you love, without the clutter."

---

## 4. Pain Point #2: Photos Not Backed Up Properly

**SEVERITY: HIGH**

*"If I lose my phone, I lose everything. I think iCloud is backing up but I'm not sure."*

### Current Status: Partial

Cloud backup exists:
- **Cloudflare R2 storage** — all uploaded photos stored with zero egress fees
- **Free tier:** 100-photo cloud backup
- **Roll+ tier:** Unlimited cloud backup
- **AES-256 encryption at rest** — both Supabase and R2
- Original resolution preserved, not compressed

### Gaps Identified

Backup is a line item in the pricing table, not a headline benefit. For many users, "your photos are safely backed up" is worth the subscription price alone. There is no backup status indicator, no monthly summary, and no emotional framing around backup value.

### Enhancements Needed

#### Backup Status Badge (MVP)

Persistent indicator in Library tab header: "247 photos safely backed up" with a small shield icon. Tappable to see details: total size, last sync time, breakdown by roll.

**Implementation:** New component `BackupStatusBadge`. Query: `SELECT COUNT(*) FROM roll_photos WHERE user_id = $1 AND original_storage_url IS NOT NULL`. Display in Library tab header. Detail view shows: total count, total storage size (sum of photo `bytes`), last `created_at` timestamp.

#### Monthly Backup Email (MVP+)

Automated email via Resend on the 1st of each month. Shows: new photos backed up this month, total archive size, a grid of the month's favorites. Subject line: "Your January photos are safe. Here's what you saved."

**Implementation:** Supabase Edge Function on cron (`0 9 1 * *`). Query month's `roll_photos` with `is_favorite = true`. Generate email via Resend with photo grid (signed R2 URLs, 24-hour expiry).

#### Backup as Onboarding Value (MVP)

During onboarding, after the filtered feed reveal, add subtle message: "Every photo you develop is automatically backed up and protected. Your best photos, safe forever."

### Marketing Copy

**Headline:** *"iCloud backs up everything. Roll protects what matters."*

**Body:** Your phone backs up 40,000 photos — including 8,000 screenshots and 3,000 blurry duplicates. Roll backs up the 247 that actually matter: the ones you chose, the ones we color-corrected, the ones you captioned. Your curated family archive, safe and searchable forever.

**Pricing differentiation:**
- Free: "100 photos backed up in the cloud"
- Roll+: "Every photo backed up. Full resolution. Encrypted. Safe."

---

## 5. Pain Point #3: Photos Not Captioned — Context Lost Forever

**SEVERITY: CRITICAL**

*"My grandmother had a box of photos and she knew the story behind every one. My kids will have 100,000 digital files with no context at all."*

### Current Status: Partially Built

Captioning infrastructure exists but is siloed:
- **CaptionEditor component** (`src/components/book/CaptionEditor.tsx`) — full caption editing UI with inline edit, character count, and save
- **Book captions** — every Book page can have a caption stored as `Record<string, string>`
- **Search includes captions** — search page supports caption text search
- **EXIF data preserved** — date, GPS, camera info all stored
- **Photo Map** (`/map`) — geotagged photos on a world map

### Gaps Identified

This is a critical expansion opportunity. The CaptionEditor exists but only works inside Books. There is no way to caption a photo in the Feed, in a Roll, or in Favorites. Individual photos have no caption field. Rolls have no story/narrative field. There are no captioning nudges, no AI-suggested captions, and no voice-to-text input.

### Enhancements Needed (MVP+ — First Post-Launch Update)

#### Data Model Changes

```sql
-- Add caption field to roll_photos table
ALTER TABLE roll_photos ADD COLUMN caption TEXT;
ALTER TABLE roll_photos ADD COLUMN caption_source TEXT; -- 'manual' | 'voice' | 'auto_draft' | 'auto_accepted'

-- Add story field to rolls table
ALTER TABLE rolls ADD COLUMN story TEXT;
```

#### Auto-Generated Draft Captions

When a photo is checkmarked, Roll generates a starting caption from available metadata. The AI assembles location, date, scene classification, and face count into a natural sentence fragment.

**Examples:**
- "Beach day · Santa Monica, CA · July 4, 2026 · 3 people"
- "Backyard · Home · October 14 · 1 person, 1 dog"
- "Restaurant · Downtown Portland · February 8 · 4 people"

These are intentionally factual scaffolds, not creative writing. The AI provides the when/where; the human adds the why/who/what.

**Implementation:** New function `generateDraftCaption(photo)` that reads `location_name`, `captured_at`, `scene_classification`, `face_count`, `has_animal` from the `photos` table and assembles a template string. No LLM needed — pure template logic.

#### User Caption Editing

Tapping the auto-caption on any checkmarked or developed photo opens an inline text editor. Auto-caption appears as pre-filled, editable text. Users can accept, modify, or replace entirely. Maximum 500 characters (enough for a meaningful story, short enough to print on the back of a 4×6).

**Edited example:** Auto: "Beach day · Santa Monica · July 4" → User edits to: "Lily's first time in the ocean. She was terrified for 10 minutes, then couldn't stop laughing. Dad got completely soaked. Best day of summer."

**Implementation:** Extend existing `CaptionEditor` component from Books to work in Favorites view and developed roll gallery. New prop: `photoId` (for roll_photos) vs. `pageId` (for books). Save to `roll_photos.caption` via PATCH `/api/rolls/[id]/photos/[photoId]`.

#### Voice-to-Text Captioning

Microphone icon next to the caption field activates Apple Speech Recognition (on-device, private). Parent sees photo, taps mic, speaks the memory. Transcription appears in caption field for review and editing.

**Implementation:** For the web prototype, use Web Speech API (`SpeechRecognition`). For iOS native, use `SFSpeechRecognizer` (on-device). New component: `VoiceCaptionButton`. Sets `caption_source = 'voice'`.

#### Roll-Level Stories

When a roll is developed, prompt: "Give this roll a title and a few words about it."

**Implementation:** `rolls.story` field. Editable in roll detail view header. Auto-suggested from dominant location + date range (already done for roll naming — extend to longer form).

#### Where Captions Live

| Surface | How Captions Appear |
|---------|-------------------|
| Physical prints | Printed on the back, with date and location |
| Photo magazines | Below or alongside each photo in auto-designed layouts |
| Circle feed | Below shared photos — grandparents see the photo AND the story |
| Cloud backup | Stored as structured data, searchable |
| Favorites portfolio | On the detail view of every favorited photo |

#### Caption Nudges

When a user hearts a photo as a Favorite, show a gentle prompt: "What's the story?" with the auto-generated draft pre-filled. Dismissable, non-blocking.

**Implementation:** Trigger on `is_favorite` toggle → true. Show inline editor with auto-draft. Track `caption_completion_rate` in analytics.

### Marketing Copy

**Headline:** *"Every photo has a story. Roll helps you tell it before you forget."*

**Body:** In 20 years, you won't remember why this photo mattered. You won't remember what she said that made everyone laugh, or that he refused to wear shoes, or that this was the day before everything changed. Roll captions your photos with the date, the place, and — most importantly — a space for your words. Speak the memory into your phone. We'll print it on the back of every photo, save it in your archive, and make sure the story survives.

---

## 6. Pain Point #4: Photos Aren't Being Printed

**SEVERITY: CRITICAL**

*"I haven't printed a photo in 5 years. I keep meaning to but there are just too many to choose from."*

### Current Status: Strong

This is Roll's core feature:
- **Prodigi integration** — professional print fulfillment on Fujifilm Frontier printers, 3–5 day turnaround
- **Free first roll** — 36 4×6 prints free, no credit card required
- **Print ordering flow** — `/api/orders` with full order tracking, webhooks, email notifications
- **Two print sizes** — 4×6 and 5×7
- **Book printing** — "Order Printed Book" CTA at $29.99 + shipping
- **Print subscription API** (`/api/subscriptions/print`) — infrastructure for recurring print orders

### Gaps Identified

The printing experience is strong but lacks:
- **No print subscription product exposed in UI** — API exists but no "send me my best photos every month" feature
- **No occasion-based print prompts** — no intelligent nudges tied to birthdays, holidays, trip returns
- **No Circle print ordering emphasis** — grandparents ordering prints of grandchildren's photos is a major revenue opportunity
- **No before/after reveal** — users may not understand the difference between "adding a filter" and "developing a photo"

### Enhancements Needed

#### Occasion-Based Print Prompts (MVP+)

Push notifications tied to temporal patterns: birthday clusters (annual recurring events), holiday periods (Thanksgiving, Christmas, Halloween via scene classification + date), trip returns (large cluster followed by gap).

**Examples:**
- "You just got back from vacation. 127 photos. Want to develop a roll?"
- "It's December. Print your holiday photos before the year ends."
- "Your daughter turned 3 this month — we found 14 photos from her birthday. Print them?"

**Implementation:** Supabase Edge Function on weekly cron. Analyze recent photo clusters for patterns. Generate personalized push notification copy. New table: `notification_history` to prevent duplicate sends.

#### Before/After Reveal (MVP+)

In the developed roll gallery, long-press any photo to see a split-screen comparison: original on the left, developed on the right, with a draggable divider. Educates users on value and creates shareable "wow" moments.

**Implementation:** New component `BeforeAfterCompare`. Requires both `original_storage_url` and `processed_storage_url` from `roll_photos`. Draggable divider using touch/mouse events. CSS `clip-path` for reveal effect.

#### Auto-Print Subscription (Phase 3)

Roll+ add-on ($4.99/month). Every month, Roll auto-selects 36 photos from recent favorites and ships them. No interaction required.

**Implementation:** Extend existing `/api/subscriptions/print` to be user-facing. New settings page: enable/disable, shipping address, print preferences. Monthly cron selects `roll_photos WHERE is_favorite = true AND created_at > 30 days ago ORDER BY favorited_at DESC LIMIT 36`.

### Marketing Copy

**Headline:** *"You haven't printed a photo in 5 years. That changes today."*

**Body:** Develop your first roll for free. Pick 36 photos. Choose your film stock. We'll print them on real photographic paper and send them to your door. No subscription required. No credit card. Just your best photos, printed and in your hands in 3–5 days. Then put them on the fridge and watch everyone ask where you got them.

---

## 7. Pain Point #5: Instagram Is Broken

**SEVERITY: HIGH**

*"I open Instagram to see photos of my friends' kids and instead I get 15 ads and 8 Reels from strangers."*

### Current Status: Strong

Circle is specifically designed as what Instagram was supposed to be:
- **Private, invite-only groups** — chronological feed, no algorithm, no ads
- **Circle feed** (`/api/circles/feed`) — chronological order
- **Reactions** (heart, smile, wow) — private, visible only to poster
- **Comments** (`/api/circles/[id]/comments`) — built and functional
- **Members can order prints** from shared photos
- **Zero public profiles** — no discoverability, no follower counts

### Gaps Identified

Circle creation is currently gated behind Roll+ (paid users create, free users view-only). This limits viral adoption. The math favors free Circle creation: if a free user creates a Circle and invites 20 people, and 3 convert to paid at $5.99/month, that one free Circle generated $17.97/month — almost certainly more valuable than the chance the free user would have upgraded to create it.

### Enhancement: Free Circle Creation (MVP — Ship Day One)

**Decision:** Allow free users to create ONE Circle. Gate additional Circles and premium Circle features behind Roll+.

| Feature | Free (1 Circle) | Roll+ (Unlimited Circles) |
|---------|-----------------|--------------------------|
| Create Circle | 1 | Unlimited |
| Join Circles | Unlimited | Unlimited |
| View feed | ✓ | ✓ |
| Share full rolls | ✗ | ✓ |
| Share Favorites | ✗ | ✓ |
| Custom cover photo | ✗ | ✓ |
| Order prints from Circle | ✗ | ✓ |
| Reactions | ✓ | ✓ |

**Implementation:**
1. Update `users` table or subscription logic: `max_circles = 1` for free tier, `unlimited` for Roll+.
2. In Circle creation flow, check: `SELECT COUNT(*) FROM circles WHERE created_by = $1`. If >= limit, show upgrade prompt.
3. Free Circle sharing limited to viewing — sharing rolls/favorites to Circle requires Roll+.
4. Update pricing page and paywall copy to reflect new Circle tiers.

### Marketing Copy

**Headline:** *"Remember when social media was just photos from your friends? That's Circle."*

**Body:** No algorithm deciding what you see. No ads between your sister's photos. No strangers. No Reels. Just a private feed of beautiful, film-processed photos from the people you actually care about. Chronological. Ad-free. The way it should have always been.

---

## 8. Pain Point #6: Parents Don't Make Baby Books

**SEVERITY: CRITICAL**

*"I bought a baby book when my first was born. I filled in 3 pages. It's been sitting empty in a drawer for 4 years."*

### Current Status: Planned (Phase 2)

- Album prints from Favorites provide a curated physical product (loose 4×6 prints)
- Year in Review on post-MVP roadmap
- Bound photo books listed as post-MVP via Prodigi
- Favorites tier collects portfolio-grade photos across rolls over time

### Gaps Identified

Loose album prints are not a baby book. Parents want something that looks and feels like a cohesive document of their child's life — with photos AND stories, in order, beautifully designed. The current plan puts books in a vague "post-MVP" bucket without the auto-design capability that makes them achievable for overwhelmed parents.

### The Photo Magazine: Roll's Answer to Baby Books (Phase 2)

This is potentially Roll's most powerful Phase 2 feature. It transforms Roll from a printing utility into a memory preservation system.

#### Format & Fulfillment

- Saddle-stitched magazine, 24–48 pages, 6×9 or 8×10 format
- Professional printing on matte or silk paper
- Prodigi or Mixam for fulfillment (both support booklet/magazine formats)
- Verify with Prodigi: minimum/maximum page counts, paper stock options, turnaround time, unit economics at $9.99–$14.99 retail

#### Content Source

Favorites from a given time period:
- Monthly magazine: that month's favorites
- Quarterly: 3 months
- Annual: full year

The user's Favorites are the content pipeline — already curated (checkmarked), processed (color-corrected and film-profiled), and valued (hearted). The magazine is the natural culmination.

#### Auto-Design Engine

Rule-based layout system with smart photo analysis:

**Photo scoring for layout:** Each favorite has aesthetic score, face count, orientation, and scene classification. Engine assigns layout priority: high-scoring portraits → full pages, landscapes → bleeds, groups of 3–4 related photos (same moment cluster) → grid layouts.

**Template system:** Library of 20–30 page templates (full-bleed hero, 2-up horizontal, 3-up grid, 4-up mosaic, caption-heavy text page, timeline divider). Engine selects templates based on available photos and ensures visual variety (no two consecutive pages use same layout).

**Sequencing:** Chronological within sections. Auto-generated time period dividers ("January 2026" / "Summer Vacation"). Captions placed automatically. Cover from strongest favorite.

**User editing:** Drag-to-reorder pages. Swap photos. Edit captions. Change cover. Remove/add pages. Target: review and finalize a 36-page magazine in under 5 minutes. User NEVER starts from blank page.

#### The Shelf Vision

Market the long-term vision: a parent who subscribes to monthly magazines for 5 years has 60 magazines documenting their child's life from birth to kindergarten. Stacked on a shelf, that IS the baby book — except it actually got made because Roll did the work.

#### Pricing

| Product | Price | Coverage | Annual Cost |
|---------|-------|----------|-------------|
| Monthly magazine | $9.99–$14.99 | Full month | $120–$180/year |
| Quarterly magazine | $14.99–$19.99 | Full quarter | $60–$80/year |
| Annual magazine | $29.99–$39.99 | Full year | $30–$40/year |
| Magazine subscription | $9.99/month | Auto-generated, auto-shipped | $120/year |
| Hardcover book (Phase 2+) | $29.99–$49.99 | Custom | As needed |

Compare: Shutterfly hardcover $40–$80/quarter = $160–$320/year.

### Marketing Copy

**Headline:** *"The baby book you'll actually finish. Because we make it for you."*

**Body:** Every month, Roll takes your favorite photos, adds your captions, and designs a beautiful magazine. Review it, tweak it if you want, and we'll print it and mail it to your door. $9.99. In 5 years, you'll have 60 magazines on a shelf documenting your family's story. The baby book you always meant to make? It's already done.

---

## 9. Pain Point #7: Photo Editing Is Too Hard

**SEVERITY: HIGH**

*"I don't know what white balance is. I just want my photos to look good."*

### Current Status: Strong — Comprehensively Addressed

- **Zero manual editing** — core design philosophy. No sliders, no controls anywhere.
- **eyeQ/Perfectly Clear cloud correction** — scene detection, white balance, skin tone accuracy, exposure normalization, sharpening. All invisible.
- **Film profiles (LUTs)** — 6 carefully designed looks. User's only "editing" decision.
- **Processing pipeline** — eyeQ → LUT → grain → vignette. All server-side.

### Gap: Before/After Visibility

Users may think "I just added a filter" when in reality their photo received professional-grade correction. The distinction between "applying a filter" (Instagram) and "developing a photo" (Roll) needs to be clear.

### Enhancement: Before/After Reveal (MVP+)

See Pain Point #4 for implementation details. Long-press developed photo → split-screen comparison with draggable divider.

#### "What We Did" Tooltip (Post-MVP)

Small info icon on developed photos. Tap to see plain-language description: "Corrected white balance · Brightened shadows · Recovered highlights · Accurate skin tones · Warmth film profile applied."

### Marketing Copy

**Headline:** *"Professional color correction. No editing skills required."*

**Body:** Roll doesn't add a filter to your photo. We develop it. The same technology used by Kodak and Fujifilm corrects your lighting, fixes your colors, perfects your skin tones, and then applies the film aesthetic you chose. The result looks like it was shot on a $3,000 camera and developed by a master printer. You didn't do anything except tap a checkmark.

**Comparison hook:** "Other apps give you 47 sliders and hope you figure it out. Roll gives you 6 film stocks — each one beautiful. Pick the one that feels right. We handle the rest."

---

## 10. Pain Point #8: Too Many Options Cause Choice Paralysis

**SEVERITY: MEDIUM**

*"Every photo app has 47 filters and 200 adjustment sliders. I just want them to look nice."*

### Current Status: Strong — Deliberate Constraint

- 6 film profiles, period. One per roll.
- 2 core gestures: checkmark (develop) and heart (treasure). That's it.
- No editing UI. Zero sliders.
- 36-photo roll mechanic constrains selection into a manageable metaphor.
- Free users only see Warmth — even simpler.

### Enhancement: "Roll Recommends" Film Selection (MVP)

When paid users see 6 profiles, add an "Auto" first option: "Let Roll pick the best film stock for this roll."

**Implementation:** In film profile selection screen, first option is "Recommended: Warmth" (or whichever profile AI recommends). Brief explanation: "Best for your roll: mostly indoor family photos with warm lighting." Uses existing scene classification data from filtering — simple conditional logic:
- Majority outdoor/landscape → Golden or Vivid
- Majority portrait/indoor → Warmth
- Mixed → Warmth (safe default)
- High-contrast scenes → Classic

Minimal additional development.

### Marketing Copy

**Headline:** *"Six film stocks. One choice per roll. That's it."*

**Body:** No sliders. No adjustment tools. No photo editing degree required. Pick a film stock — or let us pick for you — and we'll develop your entire roll. Just like dropping film off at the lab. You make the memories. We make them beautiful.

**The 36-frame metaphor:** "A roll of film gives you 36 exposures. Not 36,000. That limit is what made every shot count. Roll brings that feeling back."

---

## 11. Pain Point #9: Small Business Needs Shareable Galleries

**SEVERITY: HIGH**

*"I take all my product photos on my iPhone. I need to share them with customers but I can't make everyone download an app."*

### Current Status: Weak

- Film profiles provide consistent aesthetic (brand consistency)
- Cloud color correction normalizes lighting across conditions
- Circle provides private sharing — but requires app download

### Gaps Identified (Severity: High)

Small business owners need: (1) web-accessible galleries without app downloads, (2) custom branding, (3) embeddable galleries, (4) consistent processing at a shareable URL. None of these exist.

### Enhancement: Roll Pro — Business Tier (Phase 2)

**Price: $14.99/month or $129.99/year**

Everything in Roll+ plus:

#### Public Web Galleries

Each developed roll can be published as a web gallery at a shareable URL (roll.photos/gallery/spring-collection). Responsive design, fast loading, film-aesthetic presentation. No app download required for viewers.

**Implementation:** New Next.js route: `/gallery/[slug]`. Server-rendered, public (no auth required). Pulls from `rolls` table where `is_public = true`. New fields: `rolls.public_slug`, `rolls.is_public`, `rolls.public_settings` (jsonb: logo_url, accent_color, contact_info).

#### Custom Branding

Upload business logo. Choose accent color. Custom URL slug. Optional watermark on gallery images. Consistent film profile locked across all rolls.

#### Embed Code

Generate iframe embed or JavaScript widget. Gallery renders in blog posts or product pages. Auto-updates when new rolls published.

**Implementation:** `/api/gallery/[slug]/embed` returns embeddable HTML. CORS headers allow cross-origin embedding.

#### Client Proofing (Phase 2+)

Share gallery with clients who can checkmark photos they want. Business owner sees client selections. Useful for portrait photographers, real estate agents, event photographers.

### Marketing Copy

**Headline:** *"Your photos. Your brand. Beautifully presented. One shareable link."*

**Body:** Develop your product photos with Roll's professional color correction and film profiles. Share them with customers via a beautiful web gallery — no app download required. Custom branding, embed code for your website, and a consistent look across every photo. Your business looks like it has a professional photographer. It doesn't. It has Roll.

---

## 12. Pain Point #10: Video Color Correction Is Hard

**SEVERITY: MEDIUM**

*"I took a beautiful video of my daughter's recital but it looks terrible. The lighting is yellow and the colors are all wrong."*

### Current Status: Architecture Only

Not in MVP. Post-MVP Reel feature planned:
- eyeQ supports video with temporal consistency
- Shotstack cloud API for assembly
- Architecture designed for it
- API routes exist (`/api/reels`, `/api/process/develop-reel`) but are not user-facing

### Phase 3 Specification: Reel

Same philosophy as photos: AI removes bad clips, user selects good ones, cloud processing makes them beautiful, output is a finished 60–90 second family film.

**Processing:** eyeQ video color correction → film LUT applied → same profiles as photos.
**Assembly:** Shotstack. User selects clips, Roll assembles with transitions, music, captions.
**Output:** 60–90 second MP4. Shareable to Circle. Downloadable. QR code on printed photos linking to hosted video.

### Near-Term: Acknowledge Video in App (MVP+)

The app should acknowledge video clips in the camera roll even if it can't process them yet: "Video support coming soon. We see 47 video clips from your beach trip."

### Marketing Copy

**Headline:** *"Coming soon: the same magic, for your family videos."*

**Body:** Your phone is full of shaky, yellow-lit, poorly colored video clips of the moments that matter most. Soon, Roll will fix the colors, edit the clips, add music, and give you a beautiful 60-second film of your family's best moments. Same one-tap simplicity. Same film look. For video.

---

## 13. Pain Point #11: Book Design Is Labor Intensive

**SEVERITY: HIGH**

*"I tried Shutterfly once. I spent 6 hours dragging photos onto pages and gave up."*

### Current Status: Partially Built

Book feature exists with:
- Multi-step creation wizard (`/projects/albums/[id]`)
- Book cover with editable title/description
- Spread and single-page view with page-flip animation
- Per-page captions (via CaptionEditor)
- Page reorder, thumbnail grid, lightbox view
- Auto-save, print ordering CTA ($29.99)
- Full CRUD API (`/api/projects/albums`)

### Gaps Identified

- **No templates** — no "Baby's First Year," no "Year in Review"
- **No auto-assembly** — can't one-tap generate a book from Favorites
- **No varied layouts** — every page is currently single full-bleed photo
- **No section dividers** — no "Month 3" or "Summer" breaks

### Enhancement: Auto-Design Engine (Phase 2)

Powers both magazines and hardcover books. See Pain Point #6 for full auto-design engine specification. The same engine serves both formats — magazines are the entry product, hardcover books the premium option.

#### Book Templates (Phase 2)

Pre-designed structures with placeholder pages and section dividers:
- "Baby's First Year" (12 monthly sections)
- "Year in Review" (auto-generated from Year in Review data)
- "Summer / Vacation" (date-range based)
- "Our Family" (from Circle photos)

#### Year in Review → Book Pipeline (Phase 2)

"Turn your 2025 into a book" — one-tap conversion from Year in Review highlights.

#### "Finish Your Book" Email Nudges (Phase 2)

If a user creates a book but doesn't caption/order: triggered at 3 days, 7 days, 30 days. "Your book has 24 pages but no captions. Add a few words while the memories are fresh?"

### Marketing Copy

**Headline:** *"Your photo book is already designed. Just review and order."*

**Body:** You don't need to spend 6 hours dragging photos onto pages. Roll takes your favorites, designs a beautiful magazine, adds your captions, and presents it ready to print. Review it, tweak it if you want, and order. 5 minutes, not 6 hours. Because the book that gets made is better than the perfect book that doesn't.

---

## 14. Pain Point #12: Photo Books Are Expensive

**SEVERITY: HIGH**

*"A Shutterfly photo book is $60. For one book. I'd need to make 4 a year to keep up."*

### Current Status: Not Addressed

- Hardcover book at $29.99 — competitive but still a meaningful purchase
- No magazine or softcover option
- No affordable product between loose prints (~$13/roll) and hardcover ($29.99)

### Enhancement: Magazine Product (Phase 2)

See Pain Point #6 for full magazine specification and pricing.

### Pricing Comparison (Key Marketing Asset)

| Product | Price | Coverage | Annual Cost |
|---------|-------|----------|-------------|
| Shutterfly Hardcover | $40–$80 | 1 event/quarter | $160–$320 |
| Artifact Uprising | $60–$120 | 1 event/quarter | $240–$480 |
| **Roll Magazine (monthly)** | **$9.99** | **Full month** | **$120/year** |
| **Roll Magazine (quarterly)** | **$14.99** | **Full quarter** | **$60/year** |
| Roll Loose Album Prints | $8.99 | 36 favorites | As needed |

### Marketing Copy

**Headline:** *"Photo magazines from $9.99. Because memories shouldn't cost $60."*

**Body:** A photo book shouldn't require a budget meeting. Roll magazines are auto-designed from your favorites, printed on beautiful paper, and mailed to your door for $9.99. Subscribe monthly and spend $120/year to document your entire family's story. That's less than what Shutterfly charges for two books.

---

## 15. Pain Point #13: AI Fatigue

**SEVERITY: HIGH**

*"Every app now says it's AI-powered. I don't care about AI. I just want something that works."*

### Current Status: Strong in Brand Design

The product design inherently avoids AI-forward positioning:
- Four-tier model puts human choice at center (checkmark and heart are both human gestures)
- On-device processing keeps AI invisible
- Product metaphor (developing film) is analog, not technical
- Content strategy explicitly states: "Never say AI-powered"

### The Invisible AI Policy

**Strict linguistic rule:** The word "AI" appears NOWHERE in user-facing copy. Not in the app, not on the website, not in App Store descriptions, not in social media, not in press pitches. Every AI capability described by its outcome, not its mechanism.

| ❌ NEVER SAY | ✅ SAY INSTEAD |
|-------------|---------------|
| "AI-powered photo curation" | "We find your best photos" |
| "Machine learning filters" | "Smart cleanup" |
| "Neural network color correction" | "Professional color correction" |
| "AI scene detection" | "We know if it's a portrait or a landscape" |
| "Algorithm-free feed" | "Chronological. Just your friends' photos." |
| "AI auto-captions" | "We add the date and place. You add the story." |
| "AI-designed magazine layout" | "Auto-designed from your favorites" |
| "Computer vision face detection" | "People Only mode" |

**The Roll Brand Rule:** If you have to explain the technology, the feature isn't ready. Every capability should feel like it "just works." Nobody asks their photo lab about their machine learning pipeline. They just trust the prints will look beautiful.

### MVP Action

Audit ALL user-facing copy — app UI, website, App Store listing, marketing emails — and replace any AI/ML terminology with outcome-based language. This is a copywriting exercise, zero development effort.

### Marketing Copy

**Headline:** *"No AI hype. Just beautiful photos."*

**Body:** Roll doesn't lecture you about algorithms. It doesn't ask you to rate photos so it can train a model. It doesn't analyze your face. It just cleans up your camera roll, develops your photos on beautiful film stocks, and sends you real prints. Like a photo lab. Because that's what it is.

---

## 16. Pain Point #14: Privacy Concerns

**SEVERITY: CRITICAL**

*"Google scans all my photos and knows everywhere I've been. I don't trust any of them with my family's photos."*

### Current Status: Strong in Code, Weak in Marketing

Technical foundation is solid:
- All Vision framework analysis on-device (no data sent for scoring)
- Supabase with Row Level Security on all tables
- Signed, time-limited URLs for photo access (1-hour display, 24-hour print)
- Sign in with Apple with relay email
- No analytics SDK sharing data with third parties
- No public profiles, no indexing
- AES-256 encryption at rest, TLS 1.3 in transit
- EXIF GPS never exposed to Circle members
- Circle photos copied to isolated storage namespace
- Account deletion: full data removal (GDPR compliant)

### Gap: Privacy Is Buried

Privacy is technically sound but poorly marketed. The privacy story is buried in technical docs. Users have no way to discover Roll's commitments during the product experience or in marketing.

### The Privacy Promise (MVP — Zero Dev Effort)

Roll's privacy commitments in user-facing language:

1. **Your photos stay on your phone** until you choose to develop them. Filtering happens entirely on your device. Nothing uploaded without explicit action.

2. **No AI training. Ever.** Your photos are never used to train machine learning models. Not ours. Not anyone else's. Contractual commitment, not marketing promise.

3. **No ads. No data sales.** Roll makes money from subscriptions and prints. Your data is never sold, shared, or used for advertising.

4. **You own your photos.** Delete your account and everything goes with it. Full GDPR deletion. No residual copies.

5. **Private by default.** Circle is invite-only. No public galleries (unless business user creates one). No discoverability. No "people you may know."

### Implementation

**Onboarding (MVP):** Add brief Privacy Promise screen after first sign-in. Five short commitments with checkmark icons. Not a wall of text. Design-only work.

**App Store (MVP):** Screenshot highlighting privacy commitments. Badge: "No AI Training · No Ads · No Data Sales."

**Website (MVP):** Dedicated `/privacy` page with plain-language explanations (not legalese). Linked from homepage. Compared to competitors.

**Privacy Dashboard (Phase 2):** In-app Account section showing: data stored, connected devices, sharing status, one-tap full deletion.

### Marketing Copy

**Headline:** *"Your photos are yours. Period."*

**Body:** No AI training on your family's photos. No ads. No data sales. No public profiles. No algorithm deciding who sees what. Roll makes money when you print photos and subscribe — not when we sell your data. Your memories are private. We keep them that way.

**App Store trust line:** "No ads. No algorithm. No AI training. No selling your data. Your photos stay yours."

---

## 17. Integrated Marketing Framework

### 17.1 The One-Liner Hierarchy

| Length | Copy |
|--------|------|
| **3 words** | "Develop your roll." |
| **10 words** | "Find your best photos. Develop them. Print them. Keep them." |
| **25 words** | "Roll cleans up your camera roll, develops your best photos with professional film processing, prints them, and helps you tell the story behind every shot." |
| **50 words** | "You have 40,000 photos and zero prints. Roll automatically removes the junk from your camera roll, lets you pick your best 36, develops them with professional color correction and beautiful film profiles, and sends real photographic prints to your door. Then it helps you caption every photo so the stories survive. The baby book that actually gets made." |

### 17.2 Core Messaging Pillars

| Pillar | One-Liner | Supporting Pain Points |
|--------|-----------|----------------------|
| **Curation** | "Find the photos that matter in the chaos" | #1 (volume), #8 (paralysis) |
| **Beauty** | "Every photo, professionally beautiful — without effort" | #7 (can't edit), #10 (video), #13 (AI fatigue) |
| **Keeping** | "Turn digital files into physical objects you'll treasure" | #4 (not printing), #6 (no baby books), #11 (book design), #12 (cost) |
| **Memory** | "Capture the story, not just the image" | #3 (no captions), #2 (no backup) |
| **Sharing** | "Share with the people who matter — and only them" | #5 (Instagram), #14 (privacy) |
| **Business** | "Every photo, on-brand, shareable, no app required" | #9 (small business) |

### 17.3 Pain Point → Headline → Feature Map

| Pain Point | Headline | Feature |
|-----------|----------|---------|
| Overwhelmed | "We'll find the ones that matter." | AI filtering + content modes + moments |
| No backup | "Protects what matters." | Cloud backup + monthly summary |
| No captions | "Before you forget." | Auto-captions + voice-to-text |
| No prints | "That changes today." | Welcome roll + subscription prints |
| Instagram broken | "Just photos from your friends." | Circle (private, chronological) |
| No baby book | "Because we make it for you." | Photo magazines (auto-designed) |
| Editing is hard | "No skills required." | eyeQ + film profiles (automatic) |
| Choice paralysis | "One choice per roll." | 6 profiles + auto-recommend |
| Biz needs galleries | "One shareable link." | Web galleries (Roll Pro) |
| Video is hard | "Same magic, for video." | Reel (Phase 3) |
| Books are labor | "Already designed." | Auto-design engine |
| Books are expensive | "Memories for $9.99." | Photo magazines |
| AI fatigue | "Just beautiful photos." | Invisible AI (no AI language) |
| Privacy concerns | "Your photos are yours." | On-device + no training + no ads |

### 17.4 Landing Page Emotional Arc

1. **Recognition** — "This is me. I have 20,000 photos and zero on my wall."
2. **Pain amplification** — "In 40 years, I won't remember who was in this photo."
3. **Solution introduction** — "Roll turns your camera roll into something worth keeping."
4. **How it works** — Upload → Curate → Develop → Keep (4 steps)
5. **Feature showcase** — Feed, Rolls, Captions, Circle, Backup, Video (coming soon)
6. **Trust signals** — Privacy-first, no AI marketing, no ads, no algorithm
7. **Social proof** — "20,000 photos → 36 prints delivered. In under 5 minutes."
8. **Pricing** — Free / Roll+ / Roll Pro
9. **Free first roll hook** — "Your first 36 prints are free."
10. **Final CTA** — "Develop your roll."

### 17.5 App Store Description (Recommended)

Roll finds your best photos and develops them into something worth keeping.

Your camera roll has 40,000 photos and you haven't printed one. Roll fixes that. We automatically clean up the screenshots, duplicates, and blurry shots. You pick your best 36. We develop them with professional color correction and beautiful film profiles — the same technology used by Kodak and Fujifilm labs. Then we print them on real photographic paper and send them to your door.

Add a caption to every photo so the stories survive. Share your favorites with family in a private Circle — chronological, ad-free, the way sharing photos should be. Build a monthly photo magazine of your family's best moments, auto-designed and delivered for $9.99.

Your first roll is free. 36 prints delivered. No credit card.

**Key features:**
- Smart cleanup removes screenshots, duplicates, and blurry shots
- People Only mode shows just photos of your family
- Professional color correction on every photo
- 6 beautiful film profiles (Warmth, Golden, Vivid, Classic, Gentle, Modern)
- Real photographic prints on Fujifilm paper
- Photo captions — add the story behind every shot
- Circle — private photo sharing with family and friends
- Your photos, backed up and protected
- No ads. No AI training. No data sales. Private by default.

---

## 18. Phased Implementation Roadmap

### 18.1 MVP Additions (Before Launch — Low Effort)

These items require minimal development and should ship with v1:

| Item | Effort | Description |
|------|--------|-------------|
| Invisible AI audit | Copy only | Remove all AI/ML language from user-facing copy |
| Privacy Promise onboarding | Design + copy | Brief 5-point privacy screen after first sign-in |
| Privacy App Store screenshot | Design | Screenshot badge: "No AI Training · No Ads · No Data Sales" |
| Privacy website page | Copy | `/privacy` with plain-language commitments |
| Backup status badge | Small dev | "247 photos safely backed up" in Library header |
| "Roll Recommends" film | Small dev | Auto-suggest film profile from scene classification |
| "Start Here" first-time prompt | Small dev | Surface most recent moment cluster for new users |
| **Free Circle creation (1)** | **Medium dev** | **Allow free users to create 1 Circle** |
| Backup onboarding message | Copy | "Every photo you develop is backed up and protected" |

### 18.2 MVP+ (Weeks 13–16, First Post-Launch Update)

| Item | Effort | Pain Point |
|------|--------|-----------|
| **Photo captions** | Medium | #3 |
| — Auto-generated draft captions from metadata | | |
| — User caption editing (inline text field) | | |
| — Voice-to-text via Speech Recognition | | |
| — Caption field on `roll_photos` table | | |
| — Captions in developed roll gallery + Circle | | |
| — Captions printed on back of prints | | |
| **Roll-level stories** | Small | #3 |
| **Weekly digest notification** | Medium | #1 |
| **Moment clusters in feed** | Medium | #1 |
| **Before/after reveal** | Small | #7 |
| **Monthly backup email** | Small | #2 |
| **Occasion-based print prompts** | Medium | #4 |
| **Caption nudges on heart** | Small | #3 |
| **Video acknowledgment** | Small | #10 |

### 18.3 Phase 2 (Months 4–8)

| Item | Effort | Pain Point |
|------|--------|-----------|
| **Photo magazines** | High | #6, #12 |
| — Auto-design engine (template system) | | |
| — Prodigi/Mixam magazine fulfillment | | |
| — Magazine subscription (monthly auto-ship) | | |
| **Book templates** | Medium | #6, #11 |
| — "Baby's First Year," "Year in Review," "Vacation," "Our Family" | | |
| **Auto-book assembly** | Medium | #11 |
| — One-tap generation from Favorites | | |
| **Hardcover photo books** | Medium | #11, #12 |
| — Same auto-design engine, premium format | | |
| **Roll Pro business tier ($14.99/mo)** | High | #9 |
| — Public web galleries with shareable URLs | | |
| — Custom branding (logo, colors, URL slug) | | |
| — Embed code for websites | | |
| **Privacy dashboard** | Medium | #14 |
| **Year in Review → Book pipeline** | Medium | #11 |
| **"Finish your book" email nudges** | Small | #11 |

### 18.4 Phase 3 (Months 9–18)

| Item | Effort | Pain Point |
|------|--------|-----------|
| **Reel (video)** | Very High | #10 |
| — eyeQ video color correction | | |
| — Shotstack cloud assembly | | |
| — Film profiles on video | | |
| — 60–90 second family films | | |
| **Auto-print subscription** | Medium | #4 |
| — $4.99/mo add-on, 36 auto-selected prints | | |
| **Aura Frame integration** | Medium | — |
| **Client proofing for Roll Pro** | Medium | #9 |
| **Caption search** | Small | #3 |
| **QR codes on prints** | Small | #10 |
| — Link printed photos to videos or full stories | | |
| **Collaborative books** | High | #6 |
| — Circle members contribute to shared books | | |

---

## 19. Pricing Architecture

### 19.1 Subscription Tiers

| Feature | Free | Roll+ ($5.99/mo · $49.99/yr) | Roll Pro ($14.99/mo · $129.99/yr) |
|---------|------|-----|----------|
| Upload + filtering | Unlimited | Unlimited | Unlimited |
| Content modes | All | All | All |
| Manual hide | Unlimited | Unlimited | Unlimited |
| Checkmarking + rolls | Unlimited | Unlimited | Unlimited |
| Film profiles | Warmth only | All 6 | All 6 |
| Cloud processing | First roll free | Unlimited | Unlimited |
| Cloud backup | 100 photos | Unlimited | Unlimited |
| Captions | ✓ | ✓ | ✓ |
| Favorites | View only | Full access | Full access |
| Album printing | ✗ | From Favorites | From Favorites |
| Circle creation | **1 Circle** | Unlimited | Unlimited |
| Circle sharing | View only | Full (rolls + favorites) | Full |
| Print sizes | 4×6 only | 4×6 and 5×7 | 4×6 and 5×7 |
| Magazines | ✗ | Order + subscribe | Order + subscribe |
| **Public web galleries** | ✗ | ✗ | **✓** |
| **Custom branding** | ✗ | ✗ | **✓** |
| **Embed code** | ✗ | ✗ | **✓** |
| **Client proofing** | ✗ | ✗ | **✓** |

### 19.2 Print Product Pricing

| Product | Price | Margin Target |
|---------|-------|--------------|
| Roll prints (36 4×6) — first roll | Free | CAC (~$14.90) |
| Roll prints (36 4×6) — subsequent | Included in Roll+ / $0.99 ea à la carte | 40%+ |
| Individual reprint (4×6) | $0.99 | 67% |
| Individual reprint (5×7) | $1.49 | 67% |
| Magazine (24 pages) | $9.99–$14.99 | 35%+ |
| Hardcover book (24 pages) | $29.99 | 35%+ |
| Hardcover book (48 pages) | $44.99 | 35%+ |
| Magazine subscription | $9.99/mo | 30%+ |
| Auto-print subscription (Phase 3) | $4.99/mo add-on | 35%+ |
| Shipping (domestic) | $4.99 flat | 20% |

---

## 20. The Complete User Journey

When every pain point is addressed, Roll is not a photo printing app. It is a memory preservation system.

**Day 1:** Download Roll. Camera roll is cleaned up in 8 seconds. 18,000 junk photos hidden. Filtered feed shows 15,000 real photos. People Only mode narrows to 4,000 family moments. "Start Here" prompt surfaces the pumpkin patch photos from October. Checkmark 36 of the best. Choose Warmth film stock. Roll develops the photos. Free prints ordered. Ship in 3–5 days.

**Day 5:** Prints arrive. They look incredible — like they were shot on film. Photos go on the fridge. Mom texts: "Where did you get those?" You share the link. Loop begins.

**Week 2:** Subscribe to Roll+. Create a Family Circle (free users can make one too — viral growth). Invite parents, siblings, in-laws. Start adding captions to favorites: "Her first time eating cake. She put her entire face in it." Share to Circle. Grandma orders her own prints directly.

**Month 1:** Develop a second roll from vacation photos. Use Golden film stock. Weekly digest reminds you about great photos from the weekend. Backup email confirms 72 photos safely stored.

**Month 6:** Roll suggests your first photo magazine. 36 pages of your family's half-year highlights, auto-designed with captions. Review for 5 minutes. Order for $12.99. It arrives and it's beautiful. You didn't spend 6 hours on Shutterfly. You spent 5 minutes.

**Year 1:** 12 monthly magazines on the shelf. 432 developed photos. 87 favorites, all captioned. Circle has 28 members. Your daughter's entire first year of life is documented, printed, captioned, backed up, and shared with everyone who matters.

**Year 18:** 216 magazines documenting every year of your child's life. Thousands of captioned, color-corrected, film-processed photos. The baby book you always meant to make. Made automatically, one month at a time, by Roll.

---

## Summary

Every piece of marketing should drive toward this core narrative:

> You have thousands of photos. They're a mess. The good ones are buried under screenshots and duplicates. Nothing is captioned. Nothing is printed. Nothing is shared with the people who matter. And every year, the pile gets bigger and the memories get harder to find.
>
> Roll fixes all of it.
>
> Upload your photos. We sort out the noise. Browse what's left. Pick your 36 favorites. Choose a film stock. We develop them — professionally color-corrected, with the warmth and character of real analog film. Add captions so you'll remember the stories. Order prints delivered to your door. Build a book from your favorites. Share with family in a private feed with no ads and no algorithm.
>
> Your first roll of prints is free. Your photos are encrypted and private. We never show you ads, sell your data, or train AI on your images.
>
> Roll turns your camera roll into something worth keeping.

---

*Built for parents who have 40,000 photos and zero prints.*

***Develop your roll.***
