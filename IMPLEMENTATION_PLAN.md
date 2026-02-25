# Roll — Pain Points Implementation Plan

> A comprehensive, file-level implementation plan derived from the Pain Points Plan. Every task references specific files, tables, components, and API routes in the existing codebase. Organized into 4 phases with exact specifications for each feature.

Version 1.0 · February 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: MVP Additions (Pre-Launch, Weeks 1–2)](#2-phase-1-mvp-additions)
3. [Phase 2: MVP+ (Weeks 3–6, First Post-Launch Update)](#3-phase-2-mvp-first-post-launch-update)
4. [Phase 3: Products & Business (Months 3–6)](#4-phase-3-products--business)
5. [Phase 4: Video & Advanced (Months 7–12)](#5-phase-4-video--advanced)
6. [Database Migration Plan](#6-database-migration-plan)
7. [New API Routes Summary](#7-new-api-routes-summary)
8. [New Components Summary](#8-new-components-summary)
9. [Testing Strategy](#9-testing-strategy)
10. [Dependencies & Third-Party Integrations](#10-dependencies--third-party-integrations)

---

## 1. Architecture Overview

### Current Stack
- **Framework:** Next.js 16 (App Router) with React 19, TypeScript 5.9
- **Database:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Storage:** Cloudflare R2 (photos) + Supabase Storage
- **State:** Zustand stores (`src/stores/`)
- **Styling:** Tailwind CSS 4 with CSS custom properties design system
- **Payments:** Stripe (checkout, portal, webhooks)
- **Printing:** Prodigi (prints, books)
- **Email:** Resend
- **Analytics:** PostHog
- **Errors:** Sentry
- **Push:** Web Push API (`push_subscriptions` table)

### Current Database (24 tables)
`profiles`, `photos`, `rolls`, `roll_photos`, `reels`, `reel_clips`, `favorites`, `favorite_reels`, `collections`, `collection_photos`, `people`, `photo_tags`, `circles`, `circle_members`, `circle_invites`, `circle_posts`, `circle_post_photos`, `circle_reactions`, `circle_comments`, `print_orders`, `print_order_items`, `push_subscriptions`, `referrals`, `processing_jobs` + admin tables

### Key Files Reference
| Category | Path |
|----------|------|
| Landing page | `src/app/page.tsx` |
| Feed page | `src/app/(app)/feed/page.tsx` |
| Roll detail | `src/app/(app)/roll/[id]/page.tsx` |
| Roll develop | `src/app/(app)/roll/develop/page.tsx` |
| Order flow | `src/app/(app)/roll/[id]/order/page.tsx` |
| Book/Album page | `src/app/(app)/projects/albums/[id]/page.tsx` |
| Projects page | `src/app/(app)/projects/page.tsx` |
| Circle page | `src/app/(app)/circle/[id]/page.tsx` |
| Account page | `src/app/(app)/account/page.tsx` |
| Favorites API | `src/app/api/favorites/route.ts` |
| Rolls API | `src/app/api/rolls/route.ts` |
| Roll photos API | `src/app/api/rolls/[id]/photos/route.ts` |
| Circle API | `src/app/api/circles/route.ts` |
| Orders API | `src/app/api/orders/route.ts` |
| Albums API | `src/app/api/projects/albums/route.ts` |
| CaptionEditor | `src/components/book/CaptionEditor.tsx` |
| BookCover | `src/components/book/BookCover.tsx` |
| BookSpread | `src/components/book/BookSpread.tsx` |
| HeartButton | `src/components/roll/HeartButton.tsx` |
| FilmProfileSelector | `src/components/roll/FilmProfileSelector.tsx` |
| PhotoCard | `src/components/photo/PhotoCard.tsx` |
| PhotoGrid | `src/components/photo/PhotoGrid.tsx` |
| CirclePostCard | `src/components/circle/CirclePostCard.tsx` |

---

## 2. Phase 1: MVP Additions

**Timeline:** Weeks 1–2 (pre-launch)
**Theme:** Low-effort, high-impact changes — mostly copy, design, and small features

### 1.1 Invisible AI Audit (Copy Only)

**Pain Point:** #13 (AI Fatigue)
**Effort:** XS (copy changes only, zero development)

**Task:** Audit and replace all user-facing AI/ML terminology with outcome-based language.

**Files to audit and modify:**

| File | Find | Replace With |
|------|------|-------------|
| `src/app/page.tsx` line 15 | `"AI color-corrects every shot to match real film"` | `"Every shot is color-corrected to match real analog film"` |
| `src/app/page.tsx` line 117 | `"AI color-corrects every photo"` | `"We color-correct every photo"` |
| `src/components/roll/FilmProfileSelector.tsx` | Any AI references | Outcome-based language |
| `src/app/(app)/onboarding/page.tsx` | Any AI references | Outcome-based language |
| `src/app/(app)/feed/page.tsx` | Any AI references | Outcome-based language |

**Linguistic rules (apply globally):**

| Never Say | Say Instead |
|-----------|------------|
| "AI-powered photo curation" | "We find your best photos" |
| "Machine learning filters" | "Smart cleanup" |
| "Neural network color correction" | "Professional color correction" |
| "AI scene detection" | "We know if it's a portrait or a landscape" |
| "Algorithm-free feed" | "Chronological. Just your friends' photos." |
| "AI auto-captions" | "We add the date and place. You add the story." |

**Verification:** `grep -rni "AI " src/app/ src/components/ --include="*.tsx" --include="*.ts"` should return zero hits in user-facing strings (comments/internal code is fine).

---

### 1.2 Landing Page Copy Enhancements

**Pain Points:** #1, #2, #3, #4, #5, #13, #14
**Effort:** S (copy + minor JSX changes)

**File:** `src/app/page.tsx`

#### 1.2.1 Section 2 (Problem) — Add emotional depth

**Current** (lines 97–101): Basic problem statement.

**Change:** Add a second paragraph after the existing one:

```tsx
<p className="...text-[var(--color-ink-secondary)]...">
  In 40 years, your grandkids will scroll through thousands of unnamed images
  and have no idea who these people were or why the moment mattered.
</p>
```

#### 1.2.2 Section 4 (Features) — Add Backup and Video features

**Current:** FEATURES array (lines 7–40) has 8 items: Feed, Rolls, Develop, Favorites, Books, Circle, Stories & Captions, Photo Map.

**Add two new entries to FEATURES array:**

```typescript
{
  title: 'Backup',
  desc: 'Every photo you upload is backed up in the cloud. Encrypted. Safe. If you lose your phone tomorrow, your memories survive. Roll+ backs up your entire library at full resolution.',
},
{
  title: 'Video',
  desc: 'Roll corrects your videos with the same film stock as your photos. Same beautiful look. No editing software. No timeline. No color wheels. Just pick a film stock and hit develop.',
},
```

#### 1.2.3 Section 8 (Pricing) — Add privacy trust line

**Add below the pricing grid:**

```tsx
<p className="...text-center text-[var(--color-ink-tertiary)]...mt-[var(--space-section)]">
  No ads. No tracking. No AI training on your photos. Your data is encrypted and never sold.
</p>
```

#### 1.2.4 New Section 8.5 — Privacy Section (between Pricing and Final CTA)

**Add new section:**

```tsx
<section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
  <div className="max-w-[800px] mx-auto text-center">
    <h2>Your photos are private by default.</h2>
    <ul>
      <li>Encrypted in transit and at rest (AES-256)</li>
      <li>No ads. No tracking pixels. No data brokers.</li>
      <li>Your photos are never used to train AI models</li>
      <li>EXIF location data is never shared with other users</li>
      <li>Delete your account and everything is gone — permanently</li>
    </ul>
  </div>
</section>
```

#### 1.2.5 Update Email Capture Trust Line

**File:** `src/app/page.tsx` line 315

**Current:** `"No ads. No algorithm. No selling your data. Just your photos, made beautiful."`

**Replace:** `"No ads. No algorithm. No AI training. No selling your data. Your photos stay yours."`

---

### 1.3 Backup Status Badge

**Pain Point:** #2 (Photos Not Backed Up)
**Effort:** S

#### New Component: `src/components/photo/BackupStatusBadge.tsx`

Persistent indicator showing backup count with shield icon. Tappable to see detail popover.

```typescript
// Props
interface BackupStatusBadgeProps {
  className?: string;
}

// Data query (inline via fetch or SWR)
// SELECT COUNT(*) as backed_up_count,
//        COALESCE(SUM(size_bytes), 0) as total_bytes
// FROM photos
// WHERE user_id = $1 AND filter_status != 'pending'

// Render
// Shield icon + "247 photos safely backed up"
// On tap: popover with total size, last sync time
```

**Integration points:**
- Add to `src/app/(app)/library/page.tsx` — in the Library tab header area
- Add to `src/app/(app)/account/page.tsx` — in the account info section

#### New API: `src/app/api/backup/status/route.ts`

```typescript
// GET /api/backup/status
// Returns: { backed_up_count: number, total_bytes: number, last_backup_at: string }
// Query: photos table WHERE user_id = auth.uid()
```

---

### 1.4 "Roll Recommends" Film Profile Auto-Suggestion

**Pain Point:** #8 (Choice Paralysis)
**Effort:** S

**File to modify:** `src/components/roll/FilmProfileSelector.tsx`

Add a "Recommended" option as the first choice for paid users. Uses existing `scene_classification` data from the `photos` table.

**Logic (pure conditional, no ML needed):**
```typescript
function recommendFilmProfile(photos: Photo[]): FilmProfile {
  const scenes = photos.flatMap(p => p.scene_classification || []);
  const outdoorCount = scenes.filter(s => ['landscape', 'beach', 'mountain', 'park'].includes(s)).length;
  const portraitCount = scenes.filter(s => ['portrait', 'selfie', 'group'].includes(s)).length;
  const highContrast = scenes.filter(s => ['night', 'concert', 'urban'].includes(s)).length;

  if (outdoorCount > portraitCount) return 'golden';
  if (highContrast > portraitCount) return 'classic';
  return 'warmth'; // safe default
}
```

**UI change:** First item in film profile grid shows "Recommended: Warmth" (or whichever) with a brief explanation: "Best for your roll — mostly indoor family photos with warm lighting."

**New utility file:** `src/lib/film-recommendation.ts` — exports `recommendFilmProfile(photos)`

---

### 1.5 "Start Here" First-Time Prompt

**Pain Point:** #1 (Overwhelmed by Volume)
**Effort:** S

**File to modify:** `src/app/(app)/feed/page.tsx`

For new users (no checkmarks yet), surface the most recent moment cluster as a hero card at the top of the feed.

**Logic:**
```typescript
// Check: user has never checkmarked (no roll_photos entries)
// Query: most recent temporal cluster from photos table
//   WHERE user_id = $1 AND filter_status = 'visible'
//   GROUP BY DATE(date_taken)
//   HAVING COUNT(*) >= 5
//   ORDER BY MAX(date_taken) DESC LIMIT 1
// Display hero card: "Start with your photos from [Oct 14]. 23 photos, 8 great ones."
```

**New component:** `src/components/feed/StartHereCard.tsx`

```typescript
interface StartHereCardProps {
  date: string;
  photoCount: number;
  topPhotos: Photo[]; // 3-4 preview thumbnails
  locationName?: string;
  onStartRoll: () => void;
}
```

---

### 1.6 Free Circle Creation (1 Circle for Free Users)

**Pain Point:** #5 (Instagram Is Broken)
**Effort:** M

This is the most impactful MVP change. Currently, Circle creation is gated behind Roll+ (`circles` RLS policy checks `profiles.tier = 'plus'`).

#### Database Changes

**Migration:** `supabase/migrations/005_free_circle.sql`

```sql
-- Update Circle creation RLS policy
-- Old: Only Roll+ users can create circles
-- New: Free users can create 1 circle, Roll+ unlimited

DROP POLICY IF EXISTS "Roll+ users can create circles" ON circles;

CREATE POLICY "Users can create circles within tier limits" ON circles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = creator_id AND (
      -- Roll+ users: unlimited
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tier = 'plus')
      OR
      -- Free users: max 1
      (SELECT COUNT(*) FROM circles WHERE creator_id = auth.uid()) < 1
    )
  );
```

#### Circle Feature Gating

**File to modify:** `src/app/api/circles/route.ts` (POST handler)

Add tier-based limit check before creating a circle:
```typescript
// For free users: check circle count < 1
// For plus users: no limit
// Return 403 with upgrade prompt if limit reached
```

**File to modify:** `src/app/(app)/circle/page.tsx`

Update "Create Circle" button to show upgrade prompt when free user has used their 1 circle.

#### Free Circle Feature Limits

| Feature | Free (1 Circle) | Roll+ (Unlimited) |
|---------|-----------------|-------------------|
| Create Circle | 1 | Unlimited |
| Join Circles | Unlimited | Unlimited |
| View feed | Yes | Yes |
| Share full rolls | No | Yes |
| Share Favorites | No | Yes |
| Order prints from Circle | No | Yes |
| Reactions | Yes | Yes |
| Comments | Yes | Yes |

**Files to update:**
- `src/components/circle/ShareToCircleModal.tsx` — gate sharing behind Roll+ check
- `src/app/api/circles/[id]/posts/route.ts` — gate POST behind tier check for sharing rolls/favorites
- `src/app/page.tsx` — update pricing section: Free tier now shows "1 private Circle"

---

### 1.7 Privacy Promise Onboarding Screen

**Pain Point:** #14 (Privacy Concerns)
**Effort:** S (design + copy)

**File to modify:** `src/app/(app)/onboarding/page.tsx`

Add a Privacy Promise screen after first sign-in (before or after the main onboarding flow).

**Content (5 commitments with checkmark icons):**
1. Your photos stay on your phone until you choose to develop them
2. No AI training — your photos are never used to train models
3. No ads, no data sales — we make money from subscriptions and prints
4. You own your photos — delete your account and everything goes
5. Private by default — no public profiles, no discoverability

**Component:** Inline in onboarding page or new `src/components/onboarding/PrivacyPromise.tsx`

---

### 1.8 Privacy Page (Plain-English)

**Pain Point:** #14
**Effort:** S (copy-only page)

**Existing file:** `src/app/(legal)/privacy/page.tsx`

Enhance the existing privacy page with a "Plain English" section at the top, before legal text. Format: simple Q&A or bullet points explaining what Roll does and doesn't do with user data in everyday language.

---

### 1.9 Backup Onboarding Message

**Pain Point:** #2
**Effort:** XS

**File to modify:** `src/app/(app)/onboarding/page.tsx`

After the filtered feed reveal step, add message: "Every photo you develop is automatically backed up and protected. Your best photos, safe forever."

---

## 3. Phase 2: MVP+ (First Post-Launch Update)

**Timeline:** Weeks 3–6
**Theme:** Captions everywhere, feed intelligence, print nudges

### 2.1 Photo-Level Captions (Major Feature)

**Pain Points:** #3 (Not Captioned), #6 (Baby Books)
**Effort:** M-L
**Priority:** Highest in Phase 2

This is the most important Phase 2 feature. The caption infrastructure exists in `CaptionEditor` for books but is siloed. This task extends captions to all photos.

#### 2.1.1 Database Migration

**File:** `supabase/migrations/006_photo_captions.sql`

```sql
-- Add caption fields to roll_photos table
ALTER TABLE roll_photos ADD COLUMN caption TEXT;
ALTER TABLE roll_photos ADD COLUMN caption_source TEXT
  CHECK (caption_source IN ('manual', 'voice', 'auto_draft', 'auto_accepted'));
ALTER TABLE roll_photos ADD COLUMN caption_updated_at TIMESTAMPTZ;

-- Add story field to rolls table
ALTER TABLE rolls ADD COLUMN story TEXT;

-- Index for caption search
CREATE INDEX idx_roll_photos_caption ON roll_photos USING gin(to_tsvector('english', caption))
  WHERE caption IS NOT NULL;
```

#### 2.1.2 Type Updates

**File:** `src/types/roll.ts`

Add to `RollPhoto` type:
```typescript
caption?: string | null;
caption_source?: 'manual' | 'voice' | 'auto_draft' | 'auto_accepted' | null;
caption_updated_at?: string | null;
```

Add to `Roll` type:
```typescript
story?: string | null;
```

#### 2.1.3 Auto-Generated Draft Captions

**New file:** `src/lib/caption-generator.ts`

Pure template-based caption generation from photo metadata. No LLM.

```typescript
export function generateDraftCaption(photo: Photo): string {
  // Assembles from: location_name, date_taken, scene_classification, face_count
  // Examples:
  //   "Beach day · Santa Monica, CA · July 4, 2026 · 3 people"
  //   "Backyard · Home · October 14 · 1 person"
  //   "Restaurant · Downtown Portland · February 8 · 4 people"
  const parts: string[] = [];

  if (photo.scene_classification?.length) {
    parts.push(formatScene(photo.scene_classification[0]));
  }
  if (photo.latitude && photo.longitude) {
    parts.push(reverseGeocode(photo.latitude, photo.longitude)); // or pre-stored location
  }
  if (photo.date_taken) {
    parts.push(formatDate(photo.date_taken));
  }
  if (photo.face_count > 0) {
    parts.push(`${photo.face_count} ${photo.face_count === 1 ? 'person' : 'people'}`);
  }

  return parts.join(' · ');
}
```

#### 2.1.4 Extend CaptionEditor Component

**File to modify:** `src/components/book/CaptionEditor.tsx`

Currently works only with book page IDs. Refactor to support two modes:
1. **Book mode** (existing): `pageId` prop, saves to `collections.captions` JSONB
2. **Photo mode** (new): `rollPhotoId` prop, saves to `roll_photos.caption`

```typescript
interface CaptionEditorProps {
  // Existing book mode
  pageId?: string;
  bookId?: string;
  initialCaption?: string;
  onSave?: (caption: string) => void;

  // New photo mode
  rollPhotoId?: string;
  photoId?: string;
  autoDraft?: string; // Pre-filled from generateDraftCaption()
  captionSource?: string;
  maxLength?: number; // Default 500
}
```

**Move file to:** `src/components/shared/CaptionEditor.tsx` (shared between books and photos)

#### 2.1.5 Caption Editing in Favorites View

**Files to modify:**
- `src/app/(app)/library/page.tsx` or wherever favorites are displayed
- `src/components/photo/PhotoLightbox.tsx` — add caption display and edit below photo

When viewing a favorited photo in lightbox/detail view, show:
- Auto-generated draft caption (faded, editable)
- "What's the story?" placeholder text
- Inline edit on tap
- Save indicator

#### 2.1.6 Caption Editing in Developed Roll Gallery

**File to modify:** `src/app/(app)/roll/[id]/page.tsx`

In the developed roll gallery, each photo shows its caption below. Tappable to edit inline.

#### 2.1.7 Roll-Level Stories

**File to modify:** `src/app/(app)/roll/[id]/page.tsx`

Add story field to roll detail view header. Auto-suggested from dominant location + date range.

**API update:** `src/app/api/rolls/[id]/route.ts` — PATCH handler accepts `story` field.

#### 2.1.8 Caption API Endpoint

**New file:** `src/app/api/rolls/[id]/photos/[photoId]/caption/route.ts`

```typescript
// PATCH /api/rolls/[id]/photos/[photoId]/caption
// Body: { caption: string, source: 'manual' | 'voice' | 'auto_accepted' }
// Updates roll_photos.caption, roll_photos.caption_source, roll_photos.caption_updated_at
```

#### 2.1.9 Voice-to-Text Captioning

**New component:** `src/components/shared/VoiceCaptionButton.tsx`

Uses Web Speech API (`SpeechRecognition`) for transcription. Microphone icon next to caption field.

```typescript
interface VoiceCaptionButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}
// Uses window.SpeechRecognition || window.webkitSpeechRecognition
// Sets caption_source = 'voice'
```

---

### 2.2 Caption Nudges on Heart

**Pain Point:** #3
**Effort:** S

**File to modify:** `src/components/roll/HeartButton.tsx`

When a user hearts a photo as a Favorite, show a brief inline prompt: "What's the story?" with the auto-generated draft pre-filled. Dismissable, non-blocking.

**Implementation:**
- On `is_favorite` toggle → true, show toast or inline editor
- Use `generateDraftCaption()` to pre-fill
- Track `caption_prompt_shown` and `caption_prompt_completed` via PostHog

---

### 2.3 Weekly Digest Notification

**Pain Point:** #1 (Overwhelmed by Volume)
**Effort:** M

#### New API: `src/app/api/digest/weekly/route.ts`

```typescript
// Triggered by cron (Sunday 6pm user's timezone or UTC)
// Queries: photos WHERE user_id = $1
//   AND date_taken > NOW() - INTERVAL '7 days'
//   AND filter_status = 'visible'
//   AND face_count >= 1
//   ORDER BY aesthetic_score DESC
//   LIMIT 12
// Sends push notification via existing push infrastructure
// "This week: 23 great photos. We picked your top 12 — ready to start a roll?"
```

#### New Cron: `src/app/api/cron/weekly-digest/route.ts`

Iterates all users with push subscriptions, calls weekly digest logic.

#### New Page: `src/app/(app)/feed/this-week/page.tsx`

Dedicated view showing this week's suggested photos with pre-applied checkmarks. User can confirm all or individually select.

---

### 2.4 Moment Clusters in Feed

**Pain Point:** #1
**Effort:** M

**New component:** `src/components/feed/MomentClusterCard.tsx`

```typescript
interface MomentClusterCardProps {
  coverPhoto: Photo;        // Highest aesthetic_score in cluster
  locationName?: string;
  dateRange: string;         // "Oct 12–14, 2025"
  photoCount: number;
  onExpand: () => void;
}
```

**File to modify:** `src/app/(app)/feed/page.tsx`

Insert cluster cards between chronological photo groups. Clusters are temporal (same day/trip) and location-based groupings.

**New API:** `src/app/api/photos/clusters/route.ts`

```typescript
// GET /api/photos/clusters
// Groups visible photos by date proximity (within 4 hours = same moment)
// Returns: { clusters: { id, cover_photo, location, date_range, count }[] }
```

---

### 2.5 Before/After Reveal

**Pain Points:** #7 (Editing Is Hard), #4 (Not Printing)
**Effort:** S

**New component:** `src/components/photo/BeforeAfterCompare.tsx`

Split-screen comparison with draggable divider. Shows original vs. developed photo.

```typescript
interface BeforeAfterCompareProps {
  originalUrl: string;    // From photos.storage_key → signed URL
  developedUrl: string;   // From roll_photos.processed_storage_key → signed URL
  className?: string;
}
// Uses CSS clip-path for reveal effect
// Touch/mouse draggable divider
```

**Integration:** `src/app/(app)/roll/[id]/page.tsx` — long-press on any developed photo triggers this view.

---

### 2.6 Monthly Backup Email

**Pain Point:** #2
**Effort:** S

**New cron:** `src/app/api/cron/monthly-backup-email/route.ts`

```typescript
// Runs on 1st of each month at 9am UTC
// For each user with photos:
//   Query: photos created this month WHERE user_id = $1
//   Count: total backed up, favorites this month
//   Send email via Resend:
//     Subject: "Your [Month] photos are safe. Here's what you saved."
//     Body: Grid of month's favorites (signed URLs, 24hr expiry), total count, total size
```

---

### 2.7 Occasion-Based Print Prompts

**Pain Point:** #4
**Effort:** M

**New cron:** `src/app/api/cron/print-prompts/route.ts`

Analyzes recent photo clusters for patterns and sends personalized push notifications.

**Pattern detection:**
```typescript
// Trip detection: large cluster (20+ photos in 3 days) followed by 3-day gap
//   → "You just got back from vacation. 127 photos. Want to develop a roll?"
//
// Holiday detection: scene_classification includes holiday-related tags + date near holiday
//   → "It's December. Print your holiday photos before the year ends."
//
// Birthday detection: recurring annual cluster around same date
//   → "Your daughter turned 3 this month — we found 14 photos from her birthday."
```

**New table** (in migration): `notification_history`
```sql
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_notification_history_user ON notification_history (user_id, notification_type, sent_at DESC);
```

---

### 2.8 Video Acknowledgment (Coming Soon)

**Pain Point:** #10
**Effort:** XS

**File to modify:** `src/app/(app)/feed/page.tsx`

When video clips exist in a user's library (`photos WHERE media_type = 'video'`), show a subtle banner: "Video support coming soon. We see 47 video clips from your beach trip."

---

## 4. Phase 3: Products & Business

**Timeline:** Months 3–6
**Theme:** Magazine product, book auto-design, business tier, privacy dashboard

### 3.1 Photo Magazine Product (Major Feature)

**Pain Points:** #6 (Baby Books), #12 (Books Expensive)
**Effort:** H (largest Phase 3 item)

#### 3.1.1 Database Migration

**File:** `supabase/migrations/007_magazines.sql`

```sql
CREATE TABLE magazines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'ordered', 'shipped', 'delivered')),
  template TEXT NOT NULL DEFAULT 'monthly'
    CHECK (template IN ('monthly', 'quarterly', 'annual', 'baby_first_year', 'vacation', 'custom')),
  cover_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  date_range_start DATE,
  date_range_end DATE,
  page_count INT NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT '6x9'
    CHECK (format IN ('6x9', '8x10')),
  pages JSONB NOT NULL DEFAULT '[]',
  -- Each page: { layout: string, photos: [{id, position, crop}], caption?: string }
  prodigi_order_id TEXT,
  price_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_magazines_user ON magazines (user_id, created_at DESC);

-- RLS
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own magazines" ON magazines
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 3.1.2 Auto-Design Engine

**New file:** `src/lib/magazine/auto-design.ts`

Rule-based layout system:

```typescript
interface PageTemplate {
  id: string;
  name: string;
  slots: PhotoSlot[];
  captionPosition?: 'below' | 'overlay' | 'none';
}

interface PhotoSlot {
  x: number; y: number; width: number; height: number;
  preferredOrientation: 'portrait' | 'landscape' | 'any';
}

// 20-30 page templates:
// - full_bleed_hero: 1 photo, full page
// - two_up_horizontal: 2 landscape photos stacked
// - three_up_grid: 3 photos in grid
// - four_up_mosaic: 4 photos in mosaic
// - caption_heavy: 1 photo + large text area
// - timeline_divider: date/title text only
// - section_cover: 1 photo with overlay title

export function autoDesignMagazine(
  favorites: FavoritePhoto[],
  template: MagazineTemplate,
  dateRange: { start: Date; end: Date }
): MagazinePage[] {
  // 1. Sort favorites chronologically
  // 2. Group into temporal clusters (days/events)
  // 3. For each cluster:
  //    - Insert section divider page if date gap > 7 days
  //    - Score photos: aesthetic_score, face_count, orientation
  //    - Assign highest-scoring portrait → full page
  //    - Assign landscapes → bleed pages
  //    - Group 3-4 from same moment → grid layouts
  //    - Ensure no two consecutive pages use same template
  // 4. Auto-select cover from overall highest-scoring favorite
  // 5. Add captions from roll_photos.caption where available
  return pages;
}
```

**New file:** `src/lib/magazine/templates.ts` — Template definitions

**New file:** `src/lib/magazine/layout-engine.ts` — Layout assignment logic

#### 3.1.3 Magazine UI

**New pages:**
- `src/app/(app)/projects/magazines/page.tsx` — List of user's magazines
- `src/app/(app)/projects/magazines/[id]/page.tsx` — Magazine editor/viewer
- `src/app/(app)/projects/magazines/[id]/review/page.tsx` — Final review before ordering
- `src/app/(app)/projects/magazines/create/page.tsx` — Creation wizard

**New components:**
- `src/components/magazine/MagazineCover.tsx`
- `src/components/magazine/MagazineSpread.tsx`
- `src/components/magazine/MagazinePageEditor.tsx`
- `src/components/magazine/MagazinePreview.tsx`
- `src/components/magazine/TemplateSelector.tsx`

**Creation flow:**
1. Choose template (Monthly, Quarterly, Annual, Baby's First Year, Vacation)
2. Select date range (auto-filled from template)
3. Auto-design runs → presents ready magazine
4. User reviews: reorder pages, swap photos, edit captions, change cover
5. "Order Print" → Prodigi magazine fulfillment

#### 3.1.4 Magazine API Routes

**New routes:**
- `src/app/api/magazines/route.ts` — GET (list), POST (create + auto-design)
- `src/app/api/magazines/[id]/route.ts` — GET, PATCH, DELETE
- `src/app/api/magazines/[id]/pages/route.ts` — PATCH (reorder/edit pages)
- `src/app/api/magazines/[id]/order/route.ts` — POST (submit to Prodigi)

#### 3.1.5 Prodigi Magazine Integration

**File to modify:** `src/app/api/webhooks/prodigi/route.ts`

Extend existing Prodigi webhook handler to support magazine/booklet product type.

**New file:** `src/lib/prodigi/magazine.ts`

```typescript
// Prodigi booklet/magazine product creation
// Product: Saddle-stitched magazine, 24-48 pages
// Format: 6x9 or 8x10
// Paper: Silk 170gsm
// API: POST https://api.prodigi.com/v4.0/Orders
// Product SKU: TBD (verify with Prodigi catalog)
```

#### 3.1.6 Magazine Subscription

**New table:** (in same migration)
```sql
CREATE TABLE magazine_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly')),
  format TEXT NOT NULL DEFAULT '6x9',
  template TEXT NOT NULL DEFAULT 'monthly',
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  next_issue_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**New cron:** `src/app/api/cron/magazine-subscription/route.ts`

Monthly cron that auto-generates magazines for subscribers:
1. Query active subscriptions where `next_issue_date <= today`
2. For each: auto-design magazine from that period's favorites
3. Submit to Prodigi
4. Update `next_issue_date`
5. Send email: "Your [Month] magazine is on its way!"

---

### 3.2 Book Templates & Auto-Assembly

**Pain Points:** #6 (Baby Books), #11 (Book Design Labor)
**Effort:** M

#### 3.2.1 Template System

**New file:** `src/lib/book/templates.ts`

```typescript
export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  suggestedPageCount: number;
}

interface TemplateSection {
  title: string;
  photoSource: 'date_range' | 'month' | 'all_favorites';
  dateOffset?: { months: number }; // Relative to start
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'baby_first_year',
    name: "Baby's First Year",
    description: '12 monthly sections documenting your baby\'s first year',
    sections: Array.from({ length: 12 }, (_, i) => ({
      title: `Month ${i + 1}`,
      photoSource: 'month' as const,
      dateOffset: { months: i },
    })),
    suggestedPageCount: 48,
  },
  {
    id: 'year_in_review',
    name: 'Year in Review',
    description: 'Your best photos from the entire year, auto-organized by season',
    sections: [
      { title: 'Winter', photoSource: 'date_range', dateOffset: { months: 0 } },
      { title: 'Spring', photoSource: 'date_range', dateOffset: { months: 3 } },
      { title: 'Summer', photoSource: 'date_range', dateOffset: { months: 6 } },
      { title: 'Fall', photoSource: 'date_range', dateOffset: { months: 9 } },
    ],
    suggestedPageCount: 36,
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'A single trip or vacation, date-range based',
    sections: [{ title: 'The Trip', photoSource: 'date_range' }],
    suggestedPageCount: 24,
  },
  {
    id: 'our_family',
    name: 'Our Family',
    description: 'A collaborative book from Circle photos',
    sections: [{ title: 'Our Family', photoSource: 'all_favorites' }],
    suggestedPageCount: 36,
  },
];
```

#### 3.2.2 Auto-Book Assembly

**New file:** `src/lib/book/auto-assemble.ts`

```typescript
export async function autoAssembleBook(
  userId: string,
  template: BookTemplate,
  dateRange: { start: Date; end: Date },
  supabase: SupabaseClient
): Promise<BookPages> {
  // 1. Query favorites within date range
  // 2. Group by template sections
  // 3. Use auto-design engine (shared with magazines) for page layouts
  // 4. Insert section dividers between sections
  // 5. Auto-select captions from roll_photos.caption
  // 6. Return assembled book data
}
```

#### 3.2.3 UI Changes

**File to modify:** `src/components/book/CreateBookModal.tsx`

Add template selection step before photo selection:
1. Choose template (or "Blank Book")
2. Set date range (auto-filled from template)
3. Auto-assembly runs
4. User reviews and tweaks

**New component:** `src/components/book/TemplateCard.tsx`
**New component:** `src/components/book/SectionDivider.tsx`

#### 3.2.4 Year in Review → Book Pipeline

**File to modify:** `src/app/(app)/year-in-review/page.tsx`

Add CTA: "Turn your [Year] into a book" — one-tap triggers auto-assembly with `year_in_review` template.

---

### 3.3 Auto-Layout Engine for Books

**Pain Point:** #11 (Book Design Labor)
**Effort:** M

Currently every book page is a single full-bleed photo. Implement varied layouts.

**New file:** `src/lib/layout/page-templates.ts`

```typescript
// Page template library (shared between books and magazines)
export const PAGE_TEMPLATES = {
  full_bleed: { slots: 1, grid: '1fr / 1fr' },
  two_up_vertical: { slots: 2, grid: '1fr 1fr / 1fr' },
  two_up_horizontal: { slots: 2, grid: '1fr / 1fr 1fr' },
  three_up_top_heavy: { slots: 3, grid: '2fr 1fr / 1fr 1fr' },
  four_up_grid: { slots: 4, grid: '1fr 1fr / 1fr 1fr' },
  text_page: { slots: 0, hasCaption: true },
  section_divider: { slots: 0, hasTitle: true },
};
```

**File to modify:** `src/components/book/BookSpread.tsx`

Update to render multiple layout types instead of only full-bleed.

---

### 3.4 Roll Pro — Business Tier

**Pain Point:** #9 (Small Business)
**Effort:** H

#### 3.4.1 Database Migration

**File:** `supabase/migrations/008_business_tier.sql`

```sql
-- Update profiles tier constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'plus', 'pro'));

-- Add business profile fields
ALTER TABLE profiles ADD COLUMN business_name TEXT;
ALTER TABLE profiles ADD COLUMN business_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN business_accent_color TEXT;
ALTER TABLE profiles ADD COLUMN public_slug TEXT UNIQUE;

-- Public gallery fields on rolls
ALTER TABLE rolls ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE rolls ADD COLUMN public_slug TEXT UNIQUE;
ALTER TABLE rolls ADD COLUMN public_settings JSONB DEFAULT '{}';
-- public_settings: { logo_url, accent_color, contact_info, watermark }

CREATE INDEX idx_rolls_public_slug ON rolls (public_slug) WHERE is_public = true;
CREATE INDEX idx_profiles_public_slug ON profiles (public_slug) WHERE public_slug IS NOT NULL;
```

#### 3.4.2 Public Gallery Pages

**New pages:**
- `src/app/gallery/[slug]/page.tsx` — Public gallery (no auth required, server-rendered)
- `src/app/gallery/[slug]/embed/page.tsx` — Embeddable version (minimal chrome)

**New API:**
- `src/app/api/gallery/[slug]/route.ts` — GET public gallery data
- `src/app/api/gallery/[slug]/embed/route.ts` — Returns embeddable HTML

**New components:**
- `src/components/gallery/PublicGalleryView.tsx`
- `src/components/gallery/GalleryHeader.tsx` (business branding)
- `src/components/gallery/EmbedCodeGenerator.tsx`

#### 3.4.3 Business Profile Settings

**File to modify:** `src/app/(app)/account/page.tsx`

Add "Business Profile" section for Pro users:
- Business name, logo upload, accent color picker
- Public URL slug
- Default film stock (locked for brand consistency)

#### 3.4.4 Pricing Integration

**File to modify:** `src/app/api/billing/checkout/route.ts`

Add Pro tier Stripe price ID.

**File to modify:** `src/app/page.tsx`

Add third pricing tier: "Roll Pro $14.99/mo" with business features listed.

---

### 3.5 Print Subscription (User-Facing)

**Pain Point:** #4
**Effort:** M

The API exists at `src/app/api/subscriptions/print/route.ts` but is not user-facing.

**New page:** `src/app/(app)/account/print-subscription/page.tsx`

Settings: enable/disable, shipping address, print preferences (size, film stock preference).

**Monthly cron logic:**
```typescript
// Select 36 most recent favorites not yet printed
// Create print order via existing /api/orders flow
// Send email: "Your monthly prints are on their way!"
```

---

### 3.6 Privacy Dashboard

**Pain Point:** #14
**Effort:** M

**New page section in:** `src/app/(app)/account/page.tsx`

Or new dedicated page: `src/app/(app)/account/privacy/page.tsx`

**Shows:**
- Total photos stored (count + size)
- Connected devices / active sessions
- Circle memberships and who can see your photos
- Data export option
- Account deletion (one-tap → confirmation → full removal)
- Clear statement: "Your photos are never used for AI training"

**New API:** `src/app/api/account/privacy/route.ts`

```typescript
// GET /api/account/privacy
// Returns: {
//   photo_count, total_bytes, circle_count, circle_member_ids,
//   session_count, last_login, account_created_at
// }

// DELETE /api/account/privacy (or POST /api/account/delete)
// Triggers full account deletion flow
```

---

### 3.7 "Finish Your Book" Email Nudges

**Pain Point:** #11
**Effort:** S

**New cron:** `src/app/api/cron/book-nudge/route.ts`

Triggered at 3 days, 7 days, and 30 days after book/magazine creation if:
- Book has no captions (all captions empty)
- Book has not been ordered for print

Email via Resend:
- Day 3: "Your book has 24 pages but no captions. Add a few words while the memories are fresh?"
- Day 7: "Your [Book Title] is ready to print. Order now while the moment is fresh."
- Day 30: "You started a photo book 30 days ago. It's still waiting for you."

---

### 3.8 Free Circle Sharing Enhancements

**Pain Point:** #5
**Effort:** S

Enable 1 free Circle for free users (from Phase 1), then add:

**Circle-level notifications:**
When a Circle member posts, send push notification to other members: "[Name] shared 4 new photos to [Circle Name]."

**File to modify:** `src/app/api/circles/[id]/posts/route.ts` — Add push notification after successful post.

---

## 5. Phase 4: Video & Advanced

**Timeline:** Months 7–12
**Theme:** Video processing, collaborative features, advanced print products

### 4.1 Reel (Video Processing)

**Pain Point:** #10 (Video Color Correction)
**Effort:** VH (largest feature in the entire roadmap)

The database tables exist (`reels`, `reel_clips`), API routes exist (`/api/reels/`, `/api/process/develop-reel/`), and components exist (`src/components/reel/`). This is about making the pipeline fully functional.

#### 4.1.1 Video Processing Pipeline

**File to modify:** `src/app/api/process/develop-reel/route.ts`

Full implementation:
1. Extract 3 representative frames from each clip
2. Send frames to eyeQ for color correction parameters
3. Interpolate correction across all frames
4. Apply film LUT to video via FFmpeg/Shotstack
5. Apply grain and vignette
6. Assemble clips with transitions
7. Optional: add audio mood (original, quiet_film, silent_film, ambient)
8. Generate poster frame
9. Store assembled video in R2

**New file:** `src/lib/video/process.ts` — Video processing orchestration
**New file:** `src/lib/video/shotstack.ts` — Shotstack API integration
**New file:** `src/lib/video/frame-sampling.ts` — Representative frame extraction

#### 4.1.2 Reel Sharing to Circle

**File to modify:** `src/app/api/circles/[id]/posts/route.ts`

Enable `post_type = 'reel'` posts. The `circle_posts` table already supports `reel_storage_key`, `reel_poster_key`, `reel_duration_ms`.

**File to modify:** `src/components/circle/CirclePostCard.tsx` — Render reel posts with video player.

#### 4.1.3 QR Codes on Prints

Link printed photos to their video version or full story.

**New file:** `src/lib/print/qr-generator.ts`

```typescript
// Generate QR code linking to: roll.photos/story/[photo-id]
// Printed on back of 4x6 alongside caption
// Recipient scans QR → sees photo + caption + linked video if exists
```

**New public page:** `src/app/story/[id]/page.tsx` — Public view of a single photo with caption and linked video.

---

### 4.2 Auto-Print Subscription

**Pain Point:** #4
**Effort:** M

$4.99/month add-on. Every month, Roll auto-selects 36 photos from recent favorites and ships them.

**Implementation:** Extension of Print Subscription from Phase 3, now with:
- Smart selection: prioritizes unprinted favorites, highest aesthetic scores
- Stripe recurring billing as add-on to Roll+
- User can review before shipment (24hr review window)

---

### 4.3 Collaborative Books

**Pain Point:** #6 (Baby Books)
**Effort:** H

Circle members contribute to shared books.

#### Database Changes

```sql
ALTER TABLE collections ADD COLUMN is_collaborative BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN circle_id UUID REFERENCES circles(id);

CREATE TABLE collection_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, user_id)
);
```

**New API:** `src/app/api/projects/albums/[id]/contributors/route.ts`

**UI changes:**
- `src/components/book/CreateBookModal.tsx` — option to make book collaborative + invite Circle members
- `src/app/(app)/projects/albums/[id]/page.tsx` — show contributor avatars, allow adding pages from Circle photos

---

### 4.4 Caption Search

**Pain Point:** #3
**Effort:** S

**File to modify:** `src/app/api/search/route.ts`

Extend search to query `roll_photos.caption` using the GIN index from migration 006.

```typescript
// Add to search query:
// UNION
// SELECT rp.id, rp.caption as match_text, 'caption' as match_type
// FROM roll_photos rp
// WHERE to_tsvector('english', rp.caption) @@ plainto_tsquery('english', $query)
```

---

### 4.5 Best of Burst

**Pain Point:** #1
**Effort:** M

When multiple similar photos exist (same `phash` cluster), present a "pick the best" UI.

**New component:** `src/components/feed/BurstPicker.tsx`

Shows 2-3 similar photos side by side. User taps the best one. Others are auto-hidden.

**Logic:** Uses existing `phash` similarity from `photos` table + `aesthetic_score` for ranking.

---

## 6. Database Migration Plan

All migrations in `roll-app/supabase/migrations/`:

| Migration | Phase | Description |
|-----------|-------|-------------|
| `005_free_circle.sql` | 1 | Update Circle RLS for free tier creation |
| `006_photo_captions.sql` | 2 | Add `caption`, `caption_source` to `roll_photos`; `story` to `rolls`; `notification_history` table |
| `007_magazines.sql` | 3 | `magazines` table, `magazine_subscriptions` table |
| `008_business_tier.sql` | 3 | Pro tier, business profile fields, public gallery fields on `rolls` |
| `009_collaborative_books.sql` | 4 | Collaborative collections, `collection_contributors` table |

**Key principle:** All migrations are additive (ALTER TABLE ADD COLUMN, CREATE TABLE). No destructive changes. No column renames. Zero downtime.

---

## 7. New API Routes Summary

### Phase 1
| Route | Method | Description |
|-------|--------|-------------|
| `/api/backup/status` | GET | Backup count and size |

### Phase 2
| Route | Method | Description |
|-------|--------|-------------|
| `/api/rolls/[id]/photos/[photoId]/caption` | PATCH | Update photo caption |
| `/api/photos/clusters` | GET | Temporal/location clusters |
| `/api/digest/weekly` | GET/POST | Weekly digest data |
| `/api/cron/weekly-digest` | POST | Cron: send weekly digests |
| `/api/cron/monthly-backup-email` | POST | Cron: monthly backup emails |
| `/api/cron/print-prompts` | POST | Cron: occasion print nudges |

### Phase 3
| Route | Method | Description |
|-------|--------|-------------|
| `/api/magazines` | GET, POST | List/create magazines |
| `/api/magazines/[id]` | GET, PATCH, DELETE | Magazine CRUD |
| `/api/magazines/[id]/pages` | PATCH | Edit magazine pages |
| `/api/magazines/[id]/order` | POST | Order magazine print |
| `/api/cron/magazine-subscription` | POST | Cron: auto-generate magazines |
| `/api/cron/book-nudge` | POST | Cron: finish-your-book emails |
| `/api/gallery/[slug]` | GET | Public gallery data |
| `/api/gallery/[slug]/embed` | GET | Embeddable gallery HTML |
| `/api/account/privacy` | GET, DELETE | Privacy dashboard data / account deletion |

### Phase 4
| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects/albums/[id]/contributors` | GET, POST, DELETE | Collaborative book contributors |
| `/api/story/[id]` | GET | Public photo story (QR target) |

---

## 8. New Components Summary

### Phase 1
| Component | Path | Description |
|-----------|------|-------------|
| `BackupStatusBadge` | `src/components/photo/BackupStatusBadge.tsx` | Backup count with shield icon |
| `StartHereCard` | `src/components/feed/StartHereCard.tsx` | First-time user prompt |
| `PrivacyPromise` | `src/components/onboarding/PrivacyPromise.tsx` | 5-point privacy screen |

### Phase 2
| Component | Path | Description |
|-----------|------|-------------|
| `VoiceCaptionButton` | `src/components/shared/VoiceCaptionButton.tsx` | Mic icon for speech-to-text |
| `MomentClusterCard` | `src/components/feed/MomentClusterCard.tsx` | Temporal cluster in feed |
| `BeforeAfterCompare` | `src/components/photo/BeforeAfterCompare.tsx` | Split-screen photo comparison |

### Phase 3
| Component | Path | Description |
|-----------|------|-------------|
| `MagazineCover` | `src/components/magazine/MagazineCover.tsx` | Magazine cover display |
| `MagazineSpread` | `src/components/magazine/MagazineSpread.tsx` | Two-page magazine spread |
| `MagazinePageEditor` | `src/components/magazine/MagazinePageEditor.tsx` | Drag-to-reorder, swap photos |
| `MagazinePreview` | `src/components/magazine/MagazinePreview.tsx` | Full magazine preview |
| `TemplateSelector` | `src/components/magazine/TemplateSelector.tsx` | Template picker for magazines/books |
| `TemplateCard` | `src/components/book/TemplateCard.tsx` | Individual template display card |
| `SectionDivider` | `src/components/book/SectionDivider.tsx` | Month/season divider page |
| `PublicGalleryView` | `src/components/gallery/PublicGalleryView.tsx` | Public-facing gallery |
| `GalleryHeader` | `src/components/gallery/GalleryHeader.tsx` | Business branding header |
| `EmbedCodeGenerator` | `src/components/gallery/EmbedCodeGenerator.tsx` | Generate iframe/script embed |

### Phase 4
| Component | Path | Description |
|-----------|------|-------------|
| `BurstPicker` | `src/components/feed/BurstPicker.tsx` | Best-of-burst selection UI |

---

## 9. Testing Strategy

### Unit Tests
All new utility functions get unit tests in `src/__tests__/`:

| Test File | Covers |
|-----------|--------|
| `caption-generator.test.ts` | `generateDraftCaption()` — various metadata combinations |
| `film-recommendation.test.ts` | `recommendFilmProfile()` — scene classification → profile mapping |
| `auto-design.test.ts` | `autoDesignMagazine()` — template selection, page variety, chronological ordering |
| `layout-engine.test.ts` | Page template assignment based on photo properties |
| `book-templates.test.ts` | Template section generation, date range calculations |

### Integration Tests
| Test | Description |
|------|-------------|
| Caption CRUD | Create, read, update caption on roll_photo |
| Magazine creation flow | Create magazine → auto-design → verify pages |
| Circle free tier limits | Free user creates 1 circle OK, 2nd blocked |
| Public gallery | Pro user publishes roll → gallery accessible without auth |
| Backup status | Verify correct count returned |
| Search with captions | Caption text is searchable |

### E2E Smoke Tests
| Flow | Steps |
|------|-------|
| Full caption flow | Upload → develop → caption photo → verify in favorites |
| Magazine order | Create magazine → review → mock order |
| Circle sharing | Create circle → invite → join → post |
| Business gallery | Pro account → publish roll → view public URL |

---

## 10. Dependencies & Third-Party Integrations

### New Dependencies

| Package | Purpose | Phase |
|---------|---------|-------|
| `qrcode` | QR code generation for prints | 4 |
| (none for speech) | Web Speech API is browser-native | 2 |

### Third-Party Integration Work

| Service | Phase | Work Required |
|---------|-------|---------------|
| **Prodigi** | 3 | Verify magazine/booklet SKUs, paper stock options, page count limits, unit economics |
| **Stripe** | 3 | Add Pro tier price, magazine subscription price, auto-print add-on price |
| **Resend** | 2 | New email templates: monthly backup, weekly digest, book nudge, print prompt |
| **Shotstack** | 4 | Full video assembly integration |
| **PostHog** | 2+ | New events: caption_created, caption_prompt_shown, magazine_created, gallery_published |

### Prodigi Verification Checklist (Before Phase 3)
- [ ] Magazine/booklet product availability
- [ ] Minimum page count (likely 8 or 12)
- [ ] Maximum page count (likely 48 or 64)
- [ ] Paper stock options (silk, matte, gloss)
- [ ] Available sizes (6x9, 8x10, 5.5x8.5)
- [ ] Unit cost at each page count
- [ ] Turnaround time
- [ ] Cover options (self-cover vs. separate cover stock)
- [ ] Spine/binding options (saddle-stitch vs. perfect-bound)

---

## Summary: Implementation Priority

| Priority | Item | Phase | Pain Points | Impact |
|----------|------|-------|-------------|--------|
| 1 | AI copy audit | 1 | #13 | Brand integrity |
| 2 | Landing page enhancements | 1 | #1-14 | Conversion |
| 3 | Free Circle creation | 1 | #5 | Viral growth |
| 4 | Privacy promise + page | 1 | #14 | Trust |
| 5 | Backup status badge | 1 | #2 | Retention |
| 6 | Film recommendation | 1 | #8 | UX |
| 7 | Start Here prompt | 1 | #1 | Activation |
| 8 | **Photo-level captions** | 2 | **#3, #6** | **Critical — memory preservation** |
| 9 | Caption nudges | 2 | #3 | Caption adoption |
| 10 | Before/after reveal | 2 | #7 | Value perception |
| 11 | Weekly digest | 2 | #1 | Re-engagement |
| 12 | Moment clusters | 2 | #1 | Feed intelligence |
| 13 | Monthly backup email | 2 | #2 | Retention |
| 14 | Occasion print prompts | 2 | #4 | Revenue |
| 15 | **Photo magazines** | 3 | **#6, #12** | **Key revenue product** |
| 16 | Book templates + auto-assembly | 3 | #6, #11 | Book completion rate |
| 17 | Auto-layout engine | 3 | #11 | Book/magazine quality |
| 18 | Roll Pro business tier | 3 | #9 | New market segment |
| 19 | Privacy dashboard | 3 | #14 | Trust |
| 20 | Print subscription | 3 | #4 | Recurring revenue |
| 21 | **Reel (video)** | 4 | **#10** | **Platform expansion** |
| 22 | Collaborative books | 4 | #6 | Social engagement |
| 23 | Best of burst | 4 | #1 | Curation quality |
| 24 | QR codes on prints | 4 | #10 | Physical-digital bridge |

---

*This plan covers all 14 pain points across 4 phases with specific file paths, database schemas, API routes, components, and implementation details. Every feature traces back to a documented pain point and has a clear specification.*

***Develop your roll.***
