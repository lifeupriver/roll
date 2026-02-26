# Roll — Complete User Journey Specification

**What this is:** The single source of truth for building Roll's complete user journey. Read this file in full before writing any code. Every sprint, every migration, every component is specified here.

**How this was created:** Two planning documents were written — a feature requirement spec (product-level detail, UX flows, detailed algorithms) and an implementation plan (codebase-aware, file paths, existing component references). This document merges the best of both, resolving conflicts in favor of what works with the existing codebase.

---

## The Journey (End to End)

Photo Library → Heart favorites → 36 hearts = auto-Roll → Name the roll → Write a story → Caption photos → Choose film stock → Develop → Share (Circle or Public Blog Post) → Email subscribers notified → 3 Rolls = Magazine prompt → Select rolls + choose font → Auto-designed magazine → Order print → Multiple magazines → Compile into hardcover Book (1-2x/year) → Public page: visitors browse, subscribe, comment, order (free account required)

---

## Architecture Decisions (Resolved Conflicts)

These decisions resolve differences between the two planning documents. Follow these — do not revisit.

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Public pages URL structure | `/blog/[authorSlug]/[postSlug]` | Blog metaphor is more SEO-friendly than `/p/[username]/rolls/[slug]`. Creates a proper content layer with its own table, supporting slugs, excerpts, SEO fields, tags, and view counts independent of the roll. |
| Public content data model | Separate `blog_posts` table referencing rolls | Decouples the public presentation from the internal roll. Allows editing the public title/excerpt without touching the roll. Supports draft/published/archived states. |
| Books data model | `magazine_ids UUID[]` on books table | Simpler than a join table for a 1-to-few relationship. Books will never contain hundreds of magazines. Array column with GIN index is sufficient. |
| Magazine roll source | `roll_ids UUID[]` on magazines table (backward compatible with existing date-range flow) | Existing magazine creation uses favorites by date range. New flow adds roll-based selection. Both paths must work. |
| Font storage | Font ID string on magazine/book records | Fonts are metadata. Rendering happens at preview time (CSS) and PDF generation time (embedded). Not stored per-page. |
| Comments table | `blog_comments` (separate from circle comments) | Blog comments are public, circle comments are private. Different visibility rules, different RLS policies. Keep them separate. |
| Nudge/prompt system | Dedicated `GET /api/nudges` endpoint + `NudgeBanner` component | Centralized nudge logic. Single API call on app load returns all active prompts. Client renders them contextually. |
| Voice-to-text | Web Speech API (`SpeechRecognition`) for web prototype | Browser-native, no dependencies. Future iOS native will use `SFSpeechRecognizer`. |
| Auto-caption generation | Template-based from EXIF metadata (NO LLM) | Keeps it fast, free, and private. Template: `"{scene} · {location} · {date} · {people_count} people"`. User edits from there. |

---

## Database Migration: 011_blog_books_journey.sql

This is a single migration file. Run it all at once. Every table, column addition, index, and RLS policy for the entire journey.

```sql
-- ============================================================
-- Migration 011: Blog, Books, and Full User Journey
-- ============================================================

-- ── 1. Extend existing tables ──────────────────────────────

-- Track which roll a favorite was assigned to
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS roll_id UUID REFERENCES rolls(id);
CREATE INDEX IF NOT EXISTS idx_favorites_unassigned ON favorites (user_id) WHERE roll_id IS NULL;

-- Roll-level story and captions
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS theme_name VARCHAR(200);

-- Per-photo captions
ALTER TABLE roll_photos ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE roll_photos ADD COLUMN IF NOT EXISTS caption_source VARCHAR(20) DEFAULT 'manual';
  -- Values: 'manual', 'voice', 'auto'

-- Profile extensions for blog
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false;

-- Track print order source
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS blog_post_id UUID;
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app'
  CHECK (source IN ('app', 'blog', 'gallery'));

-- ── 2. Blog posts ──────────────────────────────────────────

CREATE TABLE blog_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roll_id           UUID NOT NULL REFERENCES rolls(id),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  excerpt           TEXT,
  story             TEXT,  -- copied from roll.story at publish time
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  published_at      TIMESTAMPTZ,
  cover_photo_id    UUID REFERENCES photos(id),
  seo_title         TEXT,
  seo_description   TEXT,
  tags              TEXT[] DEFAULT '{}',
  allow_print_orders  BOOLEAN DEFAULT false,
  allow_magazine_orders BOOLEAN DEFAULT false,
  allow_book_orders   BOOLEAN DEFAULT false,
  view_count        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_blog_posts_author ON blog_posts (user_id, status, published_at DESC);
CREATE INDEX idx_blog_posts_lookup ON blog_posts (user_id, slug) WHERE status = 'published';

-- RLS: owner manages own posts; published posts readable by everyone
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blog posts"
  ON blog_posts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Published blog posts are public"
  ON blog_posts FOR SELECT USING (status = 'published');

-- ── 3. Email subscribers ───────────────────────────────────

CREATE TABLE email_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  confirmed       BOOLEAN DEFAULT false,
  confirm_token   TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (author_id, email)
);

CREATE INDEX idx_email_subscribers_author ON email_subscribers (author_id) WHERE confirmed = true;

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors see own subscribers"
  ON email_subscribers FOR SELECT USING (author_id = auth.uid());

-- ── 4. Blog comments ──────────────────────────────────────

CREATE TABLE blog_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ  -- soft delete
);

CREATE INDEX idx_blog_comments_post ON blog_comments (post_id, created_at);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Public read on published post comments (use service-role for public pages)
CREATE POLICY "Anyone reads comments on published posts"
  ON blog_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published')
  );

CREATE POLICY "Authenticated users create comments"
  ON blog_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Author or post owner deletes comments"
  ON blog_comments FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT user_id FROM blog_posts WHERE id = post_id)
  );

-- ── 5. Extend magazines ──────────────────────────────────

ALTER TABLE magazines ADD COLUMN IF NOT EXISTS roll_ids UUID[] DEFAULT '{}';
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'default';
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_magazines_public ON magazines (public_slug) WHERE is_public = true;

-- ── 6. Books ──────────────────────────────────────────────

CREATE TABLE books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT,
  magazine_ids    UUID[] NOT NULL DEFAULT '{}',
  cover_photo_id  UUID REFERENCES photos(id),
  font            TEXT DEFAULT 'default',
  format          TEXT NOT NULL DEFAULT '8x10'
                    CHECK (format IN ('8x10', '10x10')),
  page_count      INTEGER DEFAULT 0,
  price_cents     INTEGER,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'review', 'ordered', 'shipped', 'delivered')),
  prodigi_order_id TEXT,
  is_public       BOOLEAN DEFAULT false,
  public_slug     TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_books_user ON books (user_id, created_at DESC);
CREATE INDEX idx_books_public ON books (public_slug) WHERE is_public = true;

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own books"
  ON books FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public books viewable by all"
  ON books FOR SELECT USING (is_public = true);
```

Add this print_orders foreign key after creating blog_posts:

```sql
ALTER TABLE print_orders ADD CONSTRAINT fk_print_orders_blog_post
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id);
```

---

## Sprint 1: Auto-Roll from Favorites + Roll Builder Flow

**Goal:** When a user accumulates 36 unassigned favorites, prompt them to create a roll. Then walk them through naming it, writing a story, and captioning each photo before developing.

### 1.1 — Unassigned Favorites Count API

**File:** `src/app/api/favorites/unassigned-count/route.ts` (NEW)

```typescript
// GET — returns { count: number }
// Query: SELECT COUNT(*) FROM favorites WHERE user_id = $1 AND roll_id IS NULL
// Called on library page load to decide whether to show the prompt
```

### 1.2 — Create Roll from Favorites API

**File:** `src/app/api/rolls/from-favorites/route.ts` (NEW)

```typescript
// POST — creates a new roll from the 36 oldest unassigned favorites
// Steps:
//   1. Fetch 36 oldest favorites WHERE roll_id IS NULL, ordered by created_at ASC
//   2. Create new roll: { status: 'collecting', max_photos: 36 }
//   3. Create roll_photos entries (position = favorite order)
//   4. UPDATE favorites SET roll_id = new_roll_id WHERE id IN (the 36)
//   5. Return { rollId: string }
```

### 1.3 — Favorites Roll Prompt Component

**File:** `src/components/roll/FavoritesRollPrompt.tsx` (NEW)

Banner shown on the library page (`src/app/(app)/library/page.tsx`) when unassigned count >= 36:

```
┌─────────────────────────────────────────────────────┐
│  📷  You have 36 new favorites — create a roll?     │
│                                                     │
│  [ Create a Roll ]                    [ Dismiss ]   │
└─────────────────────────────────────────────────────┘
```

- "Create a Roll" → calls `POST /api/rolls/from-favorites` → navigates to Roll Builder
- Dismiss → stored in localStorage, reappears after 7 days or at next batch of 36
- Design: use design system tokens. Warm cream background, terracotta CTA button.

### 1.4 — Roll Builder Flow (3-Step Guided Experience)

**File:** `src/app/(app)/roll/[id]/build/page.tsx` (NEW)

Multi-step form. Each step updates the roll via API. User can go back/forward between steps.

#### Step 1: Name Your Roll

- Heading: "What's the theme of these photos?"
- Text input, 60 character limit, required
- Below input: scrollable thumbnail row of all 36 photos (preview what's in the roll)
- Auto-suggestion: On mount, call `GET /api/rolls/[id]/suggest-name` which analyzes the 36 photos' EXIF data and returns a suggested name based on dominant location + date range
- Auto-suggest logic (implement in the API route):

```typescript
// Extract location_name from photos.exif_data for all 36 photos
// Find most frequent location (mode)
// Extract date range (earliest → latest captured_at)
// Format: "Santa Monica · July 2025" or "Thanksgiving Weekend"
// Return as { suggestion: string }
```

- "Next →" button (disabled until name is entered)

#### Step 2: Write the Story (Optional)

- Heading: "Tell the story behind this roll"
- Large textarea, placeholder: "What was happening? Who was there? What do you want to remember?"
- 2,000 character limit
- Voice-to-text button (microphone icon next to textarea):
  - New reusable component: `src/components/shared/VoiceCaptionButton.tsx`
  - Uses Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`)
  - Shows pulsing red dot when recording
  - Auto-stops after 3 seconds of silence
  - Streams transcript into the textarea
  - Graceful fallback: hide mic button if SpeechRecognition not supported
- Helper text: "This will appear as the introduction to your roll."
- "Skip for now" link — clearly visible, no guilt
- "← Back" and "Next →" buttons

#### Step 3: Caption Your Photos (Optional, Encouraged)

- Heading: "Add captions to your photos" — subheading: "1 of 36"
- Large photo preview (~70% viewport height)
- Caption text field below photo, pre-filled with auto-generated draft
- Auto-caption generation (template-based, NO LLM):

```typescript
// New utility: src/lib/captions/auto-caption.ts
function generateDraftCaption(photo: {
  exif_data?: { scene_classification?: string; location_name?: string; captured_at?: string };
  filter_results?: { face_count?: number };
}): string {
  const parts: string[] = [];
  if (photo.exif_data?.scene_classification) parts.push(photo.exif_data.scene_classification);
  if (photo.exif_data?.location_name) parts.push(photo.exif_data.location_name);
  if (photo.exif_data?.captured_at) parts.push(formatDate(photo.exif_data.captured_at));
  if ((photo.filter_results?.face_count ?? 0) > 0) parts.push(`${photo.filter_results!.face_count} people`);
  return parts.join(' · ');
}
// Output: "Beach day · Santa Monica, CA · July 4, 2026 · 3 people"
```

- Voice-to-text button per photo (reuse `VoiceCaptionButton`)
- Filmstrip navigation at bottom: scrollable row of numbered thumbnails, current photo highlighted
- Swipe left/right between photos
- "← Back", "Skip All", and "Done →" buttons
- Progress indicator: "Captioned 12 of 36"

#### On "Done" (final step):

- Batch update: `PATCH /api/rolls/[id]` with `{ theme_name, story }`
- Batch update: `PATCH /api/rolls/[id]/photos` with `[{ photoId, caption, caption_source }]`
- Set `roll.status = 'ready_to_develop'`
- Navigate to existing film profile selection → develop flow

### 1.5 — New/Modified API Routes for Sprint 1

| Route | Method | File | Status |
|-------|--------|------|--------|
| `GET /api/favorites/unassigned-count` | GET | New | Returns `{ count }` |
| `POST /api/rolls/from-favorites` | POST | New | Creates roll from 36 oldest unassigned favorites |
| `GET /api/rolls/[id]/suggest-name` | GET | New | Returns auto-suggested name from EXIF |
| `PATCH /api/rolls/[id]` | PATCH | Modify existing | Accept `theme_name`, `story` fields |
| `PATCH /api/rolls/[id]/photos` | PATCH | New | Batch update captions: `[{ photoId, caption, caption_source }]` |

### 1.6 — Modified Existing Files

| File | Change |
|------|--------|
| `src/app/(app)/library/page.tsx` | Import and render `FavoritesRollPrompt` when unassigned count >= 36 |
| `src/types/roll.ts` (or equivalent) | Add `story`, `theme_name` to Roll type |
| `src/types/roll-photo.ts` (or equivalent) | Add `caption`, `caption_source` to RollPhoto type |

---

## Sprint 2: Public Blog Foundation

**Goal:** After developing a roll, users can publish it as a public blog post. Build the data layer, CRUD APIs, and the publish modal.

### 2.1 — Blog Types

**File:** `src/types/blog.ts` (NEW)

```typescript
export interface BlogPost {
  id: string;
  user_id: string;
  roll_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  story: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  cover_photo_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  allow_print_orders: boolean;
  allow_magazine_orders: boolean;
  allow_book_orders: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // Joined:
  author_name?: string;
  author_avatar?: string;
}

export interface EmailSubscriber {
  id: string;
  author_id: string;
  email: string;
  confirmed: boolean;
  created_at: string;
}
```

### 2.2 — Blog CRUD API Routes (Authenticated)

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `GET /api/blog/posts` | GET | New | List current user's blog posts (all statuses) |
| `POST /api/blog/posts` | POST | New | Create draft blog post from a roll |
| `GET /api/blog/posts/[id]` | GET | New | Get single post (owner only) |
| `PATCH /api/blog/posts/[id]` | PATCH | New | Update post (title, slug, excerpt, tags, SEO, ordering flags) |
| `DELETE /api/blog/posts/[id]` | DELETE | New | Delete post |
| `POST /api/blog/posts/[id]/publish` | POST | New | Set status='published', set published_at, copy roll.story → post.story, trigger subscriber notification |
| `GET /api/blog/settings` | GET | New | Get user's blog settings (slug, name, description, enabled) |
| `PATCH /api/blog/settings` | PATCH | New | Update blog settings |

On `POST /api/blog/posts` (creating from a roll):

- Auto-populate: title from `rolls.theme_name` (or `rolls.name`), story from `rolls.story`, slug auto-generated from title, excerpt from first sentence of story
- `cover_photo_id` from highest-scoring photo in the roll

### 2.3 — Publish Modal

**File:** `src/components/blog/PublishModal.tsx` (NEW)

Triggered after roll development. Replaces/extends the existing share prompt. Two paths:

1. "Share to Circle" → existing `ShareToCircleModal`
2. "Publish as Public Post" → opens this modal

Modal contents (all pre-filled from roll data, editable):

- **Title** — pre-filled from `rolls.theme_name`
- **URL slug** — auto-generated, editable: `roll.photos/blog/{authorSlug}/{slug}`
- **Excerpt** — auto-generated from story's first sentence
- **Cover photo** — scrollable thumbnail row, first is pre-selected
- **Tags** — chip input, suggest from photo metadata (locations, scene types)
- **Ordering toggles:**
  - ☑ Allow visitors to order prints
  - ☐ Allow visitors to order magazine
  - ☐ Allow visitors to order book
- **Buttons:** "Save as Draft" | "Publish Now"

### 2.4 — Share Prompt After Development

**File:** `src/app/(app)/roll/[id]/page.tsx` (MODIFY)

After the "Your roll is developed" celebration screen, show:

```
┌─────────────────────────────────────┐
│  Share this roll?                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Share to Circle              │  │  ← existing ShareToCircleModal
│  │  Your family & friends        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Publish as Public Post       │  │  ← new PublishModal
│  │  Anyone with the link         │  │
│  └───────────────────────────────┘  │
│                                     │
│  "Maybe later"                      │
└─────────────────────────────────────┘
```

### 2.5 — Modified Existing Files

| File | Change |
|------|--------|
| `src/components/circle/ShareToCircleModal.tsx` | Add "Publish Public" option alongside existing circle share |
| `src/app/(app)/roll/[id]/page.tsx` | Add post-development share prompt with both options |

---

## Sprint 3: Public Blog Pages + SEO

**Goal:** Build the public-facing blog pages that anyone can visit without an account.

### 3.1 — Public Blog Post Page

**File:** `src/app/blog/[authorSlug]/[postSlug]/page.tsx` (NEW)

Server-rendered, public page. Uses Supabase service-role client (not user session) to fetch published posts.

**Layout:**

```
[Avatar] Author Name                    [Subscribe]  Powered by Roll
────────────────────────────────────────────────────────────────────

                    COVER PHOTO (full-width hero)

Feb 15, 2026  ·  36 photos  ·  Warmth film

# Saturday at the Farmer's Market

Story text here...

──── photos ────────────────────────────────────────────────────────
   [Full-width photo 1]
  Caption: "The heirloom tomato vendor"

   [Photo 2]  [Photo 3]          ← intelligent layout from roll_photos
  Captions below each

   ... remaining photos with captions ...

┌─────────────────────────────────────────────────────────────────┐
│  Order from this collection                                     │
│  [Prints from $0.99]  [Magazine $12.99]  [Book $29.99]         │
│  Sign up for a free Roll account to order →                     │
└─────────────────────────────────────────────────────────────────┘

──── comments ──────────────────────────────────────────────────────
💬 3 comments
"Beautiful shots!" — @maria · 2h ago
[Sign up free to comment →]

────────────────────────────────────────────────────────────────────
[Avatar]  Author Name
Blog tagline  ·  [View All Posts]  [Subscribe by Email]

Tags: #farmers-market  #portland
Share: [Copy Link]  [Twitter]  [Pinterest]

© 2026 Author Name · Powered by Roll
```

**Key implementation details:**

- Semantic HTML: `<article>`, `<figure>`, `<figcaption>`, `<time>`
- Photo alt text = caption text (SEO win)
- Photos loaded from R2 signed URLs (24-hour expiry, generated server-side)
- `generateMetadata()`: title, description, OG image (cover photo at 1200px), Twitter card
- JSON-LD: Article schema with author, datePublished, image[]

**Components needed:**

| Component | File | Purpose |
|-----------|------|---------|
| BlogPostView | `src/components/blog/BlogPostView.tsx` | Main post renderer |
| BlogPhotoLayout | `src/components/blog/BlogPhotoLayout.tsx` | Intelligent photo grid with captions |
| BlogAuthorHeader | `src/components/blog/BlogAuthorHeader.tsx` | Top bar with avatar, name, subscribe |
| BlogFooter | `src/components/blog/BlogFooter.tsx` | Author bio, all posts link, subscribe |
| BlogShareBar | `src/components/blog/BlogShareBar.tsx` | Copy link, Twitter, Pinterest |
| BlogPrintCTA | `src/components/blog/BlogPrintCTA.tsx` | Order prints/magazine/book card |

### 3.2 — Author Blog Page

**File:** `src/app/blog/[authorSlug]/page.tsx` (NEW)

Lists all published posts by this author. Public, server-rendered.

**Layout:**

```
[Avatar]  Author Name / Blog Name
Blog description
12 posts  ·  432 photos
[Subscribe by Email]  [RSS]

──── Shop ──────────────────────────── (only if author has purchasable items)
[Magazine cover]  [Magazine cover]  [Book cover]
Jan 2026 $12.99   Dec 2025 $12.99   Year Book $39.99

──── Posts ─────────────────────────
[Post card]  [Post card]  [Post card]
[Load More]
```

**Components needed:**

| Component | File |
|-----------|------|
| BlogPostCard | `src/components/blog/BlogPostCard.tsx` |

### 3.3 — Public API Routes (Service-Role)

These routes are called by the public pages. They use the Supabase service-role client to bypass RLS for reading published content.

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `GET /api/blog/[authorSlug]` | GET | New | Get author profile + published post list |
| `GET /api/blog/[authorSlug]/[postSlug]` | GET | New | Get published post with photos, captions, comments |
| `POST /api/blog/[authorSlug]/[postSlug]/views` | POST | New | Increment view count (debounced, one per session) |
| `GET /api/blog/[authorSlug]/rss` | GET | New | RSS 2.0 feed |
| `GET /api/blog/[authorSlug]/shop` | GET | New | List public magazines + books for author |

### 3.4 — SEO

| Item | Implementation |
|------|---------------|
| `generateMetadata` | On both blog pages. Title, description, OG image, Twitter card. |
| JSON-LD | Post page: Article schema. Author page: ProfilePage + Person. |
| Sitemap | Modify `src/app/sitemap.ts`: query all published blog posts via service-role, add `/blog/{authorSlug}` and `/blog/{authorSlug}/{postSlug}` |
| RSS | Standard RSS 2.0 at `/api/blog/[authorSlug]/rss` |
| Canonical URLs | `<link rel="canonical">` on every blog page |

---

## Sprint 4: Email Subscriptions + Comments

**Goal:** Visitors can subscribe by email to an author's posts and leave comments (with free account).

### 4.1 — Email Subscription

**Component:** `src/components/blog/EmailSubscribeForm.tsx` (NEW)

- Simple email input + "Subscribe" button
- Shown on author page header and blog post footer

**API Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/blog/[authorSlug]/subscribe` | POST | Submit email. Creates `email_subscribers` row with `confirmed = false`. Sends confirmation email via Resend. |
| `GET /api/blog/[authorSlug]/subscribe?token=xxx` | GET | Confirm subscription. Sets `confirmed = true`. Redirects to author page with success message. |
| `GET /api/blog/[authorSlug]/unsubscribe?token=xxx` | GET | Unsubscribe. Deletes row. Redirects with confirmation. |

**Confirmation page:** `src/app/blog/[authorSlug]/subscribe/page.tsx` (NEW)

- Handles `?token=` query param for confirmation
- Shows success/error state

**Notification on publish** (in the publish API route):

- When `POST /api/blog/posts/[id]/publish` is called:
  1. Set post status to 'published'
  2. Query `email_subscribers WHERE author_id = $1 AND confirmed = true`
  3. Send notification email to each via Resend (batch API, max 100 per call)
  4. Email content: post title, cover photo thumbnail, excerpt, link to post, unsubscribe link
  5. Rate limit: max 1 notification email per author per day

**Resend email templates (React-based):**

| Template | File |
|----------|------|
| Subscription confirmation | `src/emails/SubscriptionConfirmEmail.tsx` |
| New post notification | `src/emails/NewPostNotificationEmail.tsx` |

### 4.2 — Blog Comments

**Component:** `src/components/blog/BlogComments.tsx` (NEW)

- Displays flat list of comments (newest first)
- If not signed in: "Sign up for free to leave a comment" with auth gate
- If signed in: text input + "Post" button
- Comment author can delete own comments
- Post owner can delete any comment

**Auth gate component:** `src/components/blog/AuthGate.tsx` (NEW)

- Reusable modal/inline prompt for actions requiring a free account
- "Join Roll for free to continue"
- Sign up with Email / Google / Apple
- "Already have an account? Log in"
- After signup, return to the page with intended action pre-loaded (store in URL params)
- Reuse this for comments AND print ordering

**API Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/blog/[authorSlug]/[postSlug]/comments` | GET | List comments (public, paginated) |
| `POST /api/blog/[authorSlug]/[postSlug]/comments` | POST | Add comment (auth required) |
| `DELETE /api/blog/[authorSlug]/[postSlug]/comments/[id]` | DELETE | Soft-delete (author or post owner) |

---

## Sprint 5: Magazine from Rolls

**Goal:** After 3 developed rolls, prompt the user to create a magazine. Magazines now pull from selected rolls (with their stories and captions) and let the user choose a font.

### 5.1 — Magazine Prompt

Show on library page or after 3rd roll development:

```
📖  "You've developed 3 rolls. Turn them into a magazine."
    Your stories and photos, designed into a beautiful printed magazine.
    [ Create My First Magazine ]                        "Maybe later"
```

- Roll+ required. Free tier shows "Upgrade to Roll+" CTA instead.
- Prompt logic in `GET /api/nudges` (Sprint 7), rendered by `NudgeBanner`.

### 5.2 — Refactored Magazine Creation UI

**File:** `src/app/(app)/projects/magazines/create/page.tsx` (MODIFY)

New flow (replaces or extends existing):

#### Step 1: Select Rolls

- List of all developed rolls with checkboxes
- Each shows: thumbnail, name (theme_name), date, photo count
- Minimum: 1 roll. Maximum: 4 rolls.
- Running total: "108 photos selected"

#### Step 2: Choose Font

- Font selection cards. Each card renders the magazine title + sample body text in that font.
- Tap to select. Selected gets border highlight.

| Font ID | Font Name | Style | Google Font |
|---------|-----------|-------|-------------|
| `default` | System UI | Clean, neutral | — |
| `garamond` | EB Garamond | Classic editorial serif | EB Garamond |
| `futura` | Jost | Modern geometric sans | Jost |
| `courier` | Courier Prime | Typewriter feel | Courier Prime |
| `playfair` | Playfair Display | Elegant editorial | Playfair Display |
| `lora` | Lora | Warm, readable serif | Lora |
| `jakarta` | Plus Jakarta Sans | Contemporary sans | Plus Jakarta Sans |
| `baskerville` | Libre Baskerville | Timeless, bookish | Libre Baskerville |

**New component:** `src/components/magazine/FontSelector.tsx`
**New component:** `src/components/magazine/RollSelector.tsx`

#### Step 3: Preview → existing review page with font applied

### 5.3 — Refactored Magazine API

**File:** `src/app/api/magazines/route.ts` (MODIFY)

`POST /api/magazines` now accepts:

```json
{
  "rollIds": ["string"],
  "font": "string",
  "title": "string",
  "dateRangeStart": "string (optional, legacy)",
  "dateRangeEnd": "string (optional, legacy)"
}
```

If `rollIds` provided → new roll-based flow. If `dateRangeStart/End` provided → existing favorites-based flow.

### 5.4 — Refactored Auto-Design Engine

**File:** `src/lib/magazine/auto-design.ts` (MODIFY)

Update `autoDesignMagazine` to accept rolls as sections:

```typescript
interface MagazineSection {
  rollId: string;
  title: string;           // rolls.theme_name
  story: string | null;    // rolls.story
  photos: DesignPhoto[];   // roll_photos with captions, scores, orientation
}

function autoDesignMagazine(
  sections: MagazineSection[],
  template: MagazineTemplate,
  options: { font?: string }
): MagazinePage[]
```

Each section generates:

1. **Section divider page** — roll title as heading
2. **Story page** — roll story rendered in chosen font (if story exists)
3. **Photo pages** — intelligent layout using existing scoring algorithm, now with captions rendered below/beside photos using the chosen font

**Template assignment rules** (for photo pages within each section):

- Photos with aesthetic score ≥ 80 → full-page hero treatment
- Photos with captions > 100 characters → caption-spread (photo left, text right)
- Groups of 3-4 photos from same moment cluster → mosaic grid
- Portrait pairs → side-by-side vertical
- Landscape pairs → stacked horizontal
- No two consecutive pages use the same template
- Target: 24-48 pages total depending on photo count

### 5.5 — Font Rendering

- **In-app preview:** CSS `font-family` applied via class name. Load Google Fonts dynamically.
- **Print PDF generation:** Font embedded in PDF at generation time (before Prodigi submission). Update `src/lib/prodigi/magazine.ts` to include font metadata.
- Magazine review/detail pages (`src/app/(app)/projects/magazines/[id]/page.tsx`, `review/page.tsx`) need font applied to preview renders.

---

## Sprint 6: Books

**Goal:** Users can compile multiple magazines into a hardcover book. Typical use: annual or biannual archive.

### 6.1 — Book Types

**File:** `src/types/book.ts` (NEW)

```typescript
export interface Book {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  magazine_ids: string[];
  cover_photo_id: string | null;
  font: string;
  format: '8x10' | '10x10';
  page_count: number;
  price_cents: number | null;
  status: 'draft' | 'review' | 'ordered' | 'shipped' | 'delivered';
  prodigi_order_id: string | null;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.2 — Book Creation UI

**File:** `src/components/book/BookCreator.tsx` (NEW)

#### Step 1: Select Magazines

- List of all completed magazines with checkboxes (chronological)
- Each shows: cover thumbnail, title, date range, page count
- Running total: "124 pages selected"

#### Step 2: Book Details

- Title input (e.g., "2025: A Year in Photos")
- Format selector: 8×10 Hardcover ($39.99-$59.99) | 10×10 Hardcover ($49.99-$69.99)
- Font: "Keep each magazine's font" | "Unify: [dropdown]"
- Toggle: "☑ Make available on my public page"

#### Step 3: Preview

- `src/components/book/BookPreview.tsx` (NEW)
- Shows assembled book structure:
  1. Book cover (title + cover photo + year)
  2. Table of contents (magazine titles with page numbers)
  3. For each magazine: title page → all magazine pages in order
  4. Back cover

### 6.3 — Book Assembly Logic

**File:** `src/lib/books/assemble.ts` (NEW)

```typescript
async function assembleBook(bookId: string): Promise<BookLayout> {
  const book = await getBook(bookId);
  const magazines = await getMagazines(book.magazine_ids);

  const pages: BookPage[] = [];

  // 1. Cover page
  pages.push({ type: 'book-cover', title: book.title, coverPhotoId: book.cover_photo_id });

  // 2. Table of contents
  pages.push({ type: 'toc', magazines: magazines.map(m => ({ title: m.title, startPage: 0 })) });

  // 3. Each magazine section
  for (const magazine of magazines) {
    pages.push({ type: 'magazine-title', title: magazine.title, dateRange: '...' });
    // Append all magazine pages
    const magPages = await getMagazinePages(magazine.id);
    pages.push(...magPages.map(p => ({ ...p, type: 'magazine-content' as const })));
  }

  // 4. Back cover
  pages.push({ type: 'back-cover' });

  // Calculate page numbers and update TOC
  return { pages, totalPages: pages.length };
}
```

### 6.4 — Book API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/books` | GET | List user's books |
| `POST /api/books` | POST | Create book from selected magazines |
| `PATCH /api/books/[id]` | PATCH | Update book details |
| `DELETE /api/books/[id]` | DELETE | Delete book |
| `POST /api/books/[id]/order` | POST | Generate PDF, submit to Prodigi |

### 6.5 — Book Pricing

| Format | Pages | Price |
|--------|-------|-------|
| 8×10 Hardcover | up to 120 | $39.99 |
| 8×10 Hardcover | 121-200 | $49.99 |
| 8×10 Hardcover | 201-300 | $59.99 |
| 10×10 Hardcover | up to 120 | $49.99 |
| 10×10 Hardcover | 121-200 | $59.99 |
| 10×10 Hardcover | 201-300 | $69.99 |

### 6.6 — Prodigi Book SKUs

```typescript
const BOOK_FORMAT_SKU: Record<string, string> = {
  '8x10': 'GLOBAL-PHB-8x10-HRD-COV-MG',
  '10x10': 'GLOBAL-PHB-10x10-HRD-COV-MG',
};
```

---

## Sprint 7: Public Ordering + Nudge System

**Goal:** Visitors to public blog pages can order prints, magazines, and books. All ordering requires a free account. Plus: implement the nudge/milestone prompt system.

### 7.1 — Public Ordering API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/blog/[authorSlug]/[postSlug]/print-order` | POST | Order prints from a blog post (auth required) |
| `POST /api/blog/[authorSlug]/magazine-order/[magazineSlug]` | POST | Order a magazine (auth required) |
| `POST /api/blog/[authorSlug]/book-order/[bookSlug]` | POST | Order a book (auth required) |

All routes:

- Require authentication (return 401 if not signed in → frontend shows AuthGate)
- Create `print_orders` entries with `source = 'blog'` and `blog_post_id`
- Use existing Prodigi fulfillment pipeline
- Payments via Stripe Checkout (Roll's Stripe account, not the author's)
- Notify author: "[Name] ordered prints of your [Roll Name]" (optional, configurable)

### 7.2 — Shop Section on Author Page

On `/blog/[authorSlug]`, the "Shop" section shows:

- Public magazines (`is_public = true`)
- Public books (`is_public = true`)
- "Order prints from any post" link
- Each item shows cover, title, price, "Order" button → AuthGate if not signed in

### 7.3 — Nudge System

**API:** `GET /api/nudges` (NEW)

Returns array of active nudges for the current user based on milestones:

| Trigger | Nudge Message | Action |
|---------|---------------|--------|
| 36+ unassigned favorites | "You have a roll waiting!" | → Auto-roll creation |
| Roll just developed | "Share this roll" | → Share to circle or publish |
| 3+ developed rolls, 0 magazines | "Turn your rolls into a magazine" | → Magazine creation |
| 2+ magazines, 0 books | "Compile a book from your magazines" | → Book creation |
| First blog post published | "Set up your blog profile" | → Blog settings |

**Component:** `src/components/shared/NudgeBanner.tsx` (NEW)

- Generic banner: icon, title, description, CTA button, dismiss button
- Dismiss state in localStorage with optional re-show delay
- Design: warm cream bg, terracotta CTA, design system tokens
- Rendered contextually on library, roll detail, and projects pages

**File modifications:**

| File | Change |
|------|--------|
| `src/app/(app)/library/page.tsx` | Render nudge banners from `/api/nudges` |
| `src/app/(app)/projects/page.tsx` | Render nudge banners |
| `src/app/(app)/roll/[id]/page.tsx` | Render share nudge after development |

---

## Sprint 8: Polish + Blog Management

**Goal:** View analytics, manage blog posts, blog settings UI, and clean up.

### 8.1 — Blog Management

| Component/File | Purpose |
|----------------|---------|
| `src/components/blog/BlogPostManager.tsx` | List/edit/archive posts. Table with status, views, date. |
| `src/components/blog/BlogSettingsForm.tsx` | Edit blog slug, name, description, enable/disable. |
| Integration in account page | Add "Blog" section to existing account/settings page |

### 8.2 — View Counter

- `POST /api/blog/[authorSlug]/[postSlug]/views` — debounced, one increment per session
- Use session cookie or localStorage to prevent duplicate counts
- Display on post page and in blog post manager

### 8.3 — Gallery → Blog Migration

If `/gallery/[slug]` routes exist, add redirects to their blog equivalents. Don't break existing links. The blog system supersedes the gallery.

---

## Complete File Inventory

### New Files (~35)

**Migration:**
- `supabase/migrations/011_blog_books_journey.sql`

**Types:**
- `src/types/blog.ts`
- `src/types/book.ts`

**Utilities:**
- `src/lib/captions/auto-caption.ts`
- `src/lib/books/assemble.ts`

**API Routes:**
- `src/app/api/favorites/unassigned-count/route.ts`
- `src/app/api/rolls/from-favorites/route.ts`
- `src/app/api/rolls/[id]/suggest-name/route.ts`
- `src/app/api/rolls/[id]/photos/route.ts` (batch caption update)
- `src/app/api/blog/posts/route.ts`
- `src/app/api/blog/posts/[id]/route.ts`
- `src/app/api/blog/posts/[id]/publish/route.ts`
- `src/app/api/blog/settings/route.ts`
- `src/app/api/blog/[authorSlug]/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/views/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/comments/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/print-order/route.ts`
- `src/app/api/blog/[authorSlug]/subscribe/route.ts`
- `src/app/api/blog/[authorSlug]/rss/route.ts`
- `src/app/api/blog/[authorSlug]/shop/route.ts`
- `src/app/api/blog/[authorSlug]/magazine-order/[slug]/route.ts`
- `src/app/api/blog/[authorSlug]/book-order/[slug]/route.ts`
- `src/app/api/books/route.ts`
- `src/app/api/books/[id]/route.ts`
- `src/app/api/books/[id]/order/route.ts`
- `src/app/api/nudges/route.ts`

**Pages:**
- `src/app/blog/[authorSlug]/page.tsx`
- `src/app/blog/[authorSlug]/[postSlug]/page.tsx`
- `src/app/blog/[authorSlug]/subscribe/page.tsx`
- `src/app/(app)/roll/[id]/build/page.tsx`

**Components:**
- `src/components/blog/BlogPostView.tsx`
- `src/components/blog/BlogPostCard.tsx`
- `src/components/blog/BlogAuthorHeader.tsx`
- `src/components/blog/BlogPhotoLayout.tsx`
- `src/components/blog/BlogPrintCTA.tsx`
- `src/components/blog/BlogShareBar.tsx`
- `src/components/blog/BlogFooter.tsx`
- `src/components/blog/BlogComments.tsx`
- `src/components/blog/EmailSubscribeForm.tsx`
- `src/components/blog/PublishModal.tsx`
- `src/components/blog/BlogSettingsForm.tsx`
- `src/components/blog/BlogPostManager.tsx`
- `src/components/blog/AuthGate.tsx`
- `src/components/roll/FavoritesRollPrompt.tsx`
- `src/components/roll/RollBuilderFlow.tsx`
- `src/components/shared/VoiceCaptionButton.tsx`
- `src/components/shared/NudgeBanner.tsx`
- `src/components/magazine/FontSelector.tsx`
- `src/components/magazine/RollSelector.tsx`
- `src/components/book/BookCreator.tsx`
- `src/components/book/BookPreview.tsx`

**Email Templates:**
- `src/emails/SubscriptionConfirmEmail.tsx`
- `src/emails/NewPostNotificationEmail.tsx`

### Modified Files (~12)

- `supabase/migrations/` — new migration file
- `src/app/sitemap.ts` — add blog pages
- `src/app/(app)/library/page.tsx` — add `FavoritesRollPrompt` + nudge banners
- `src/app/(app)/roll/[id]/page.tsx` — add post-development share prompt
- `src/app/(app)/projects/page.tsx` — add nudge banners
- `src/app/(app)/projects/magazines/create/page.tsx` — add roll selection + font picker
- `src/app/(app)/projects/magazines/[id]/page.tsx` — font preview
- `src/app/(app)/projects/magazines/[id]/review/page.tsx` — font in preview
- `src/app/api/magazines/route.ts` — accept `rollIds`, `font`
- `src/app/api/rolls/[id]/route.ts` — accept `theme_name`, `story`
- `src/lib/magazine/auto-design.ts` — section-based design with font
- `src/lib/prodigi/magazine.ts` — font in PDF metadata
- `src/types/magazine.ts` — add `font`, `roll_ids`, public fields
- `src/types/roll.ts` — add `story`, `theme_name`
- `src/types/roll-photo.ts` — add `caption`, `caption_source`
- `src/components/circle/ShareToCircleModal.tsx` — add "Publish Public" option

---

## Rules for Claude Code

1. **Read `CLAUDE.md` and `DESIGN_SYSTEM.md` first** for color tokens, typography, spacing.
2. **Work in sprint order.** Complete each sprint fully before moving to the next.
3. **Run the migration first** (`011_blog_books_journey.sql`) before any Sprint 1 work. All sprints depend on it.
4. **Use design system tokens.** Never hardcode hex values. Use `var(--text-primary)`, `var(--bg-secondary)`, etc.
5. **Test both themes.** Every component must work in light and dark mode.
6. **44px minimum touch targets** on all interactive elements.
7. **Use existing patterns.** Look at how existing components (e.g., `ShareToCircleModal`, `CirclePostCard`) are structured before building new ones. Match the conventions.
8. **Semantic HTML on blog pages.** `<article>`, `<figure>`, `<figcaption>`, `<time>`, `<nav>`. These are public SEO pages.
9. **Service-role client for public pages.** Blog pages at `/blog/[authorSlug]/*` are public and server-rendered. Use `createServiceRoleClient()` to fetch published content. Never expose unpublished posts.
10. **Backward compatibility.** The existing magazine creation flow (favorites by date range) must continue to work. The new roll-based flow is additive.
11. **Brand voice in all UI copy.** Warm, honest, film photography language. Never say "AI-powered" or "algorithm." See the Invisible AI Policy in `PAIN_POINTS_PLAN.md`.
12. **No premature optimization.** Build it working first, then optimize. Especially for the auto-design engine — get it generating reasonable layouts before perfecting template selection.
