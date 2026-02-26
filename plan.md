# Roll — Full User Journey Feature Plan

## The Journey

```
Photo Library → 36 Favorites → Auto-Roll → Name / Story / Captions →
Develop → Share (Circle or Public) → Email Subscribers Notified →
3 Rolls → Magazine (with font choice) → Multiple Magazines → Book
```

Public visitors can browse, subscribe by email, and order prints/magazines/books
(ordering requires a free Roll account).

---

## What Exists Today vs What Changes

| Area | Current State | What Changes |
|------|--------------|--------------|
| Favorites → Roll | Manual: user creates roll, manually adds photos | **Auto-create roll when 36 favorites reached** |
| Roll naming/story | Name set at creation; story field exists but barely used | **Guided flow: name → story → caption each photo** |
| Sharing | Private circle posts only (ShareToCircleModal) | **Add public post option; published to /blog/[author]/[slug]** |
| Email subscriptions | None | **New: subscribe to author, get email on new post** |
| Comments/prints | Circle comments (auth only); prints (auth only) | **Public viewing free; comments + ordering require free account** |
| Magazine creation | Pulls from favorites by date range | **Pulls from selected rolls (stories + captions + photos)** |
| Magazine typography | No font options | **Font selector for magazine text** |
| Books | Collection type='album' in DB, no book compilation flow | **New: collate magazines into a hardcover book** |
| Public ordering | Gallery has no ordering | **Public page lists purchasable magazines, books, prints** |

---

## Phase 1: Auto-Roll from Favorites

### Behavior

When a user's unfavorited-count reaches 36 (favorites not yet assigned to any roll),
a prompt appears: "You have 36 new favorites — create a roll?"

Accepting opens the **Roll Builder Flow** (new guided experience).

### Changes Required

**New column on `favorites`:**
```sql
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS roll_id UUID REFERENCES rolls(id);
-- Track which roll a favorite was assigned to (null = unassigned)
CREATE INDEX idx_favorites_unassigned ON favorites (user_id) WHERE roll_id IS NULL;
```

**New API: `GET /api/favorites/unassigned-count`**
- Returns count of favorites where `roll_id IS NULL` for current user
- Called on library page load to trigger the prompt

**New API: `POST /api/rolls/from-favorites`**
- Creates a new roll populated with the 36 oldest unassigned favorites
- Sets `roll.status = 'collecting'`, `roll.max_photos = 36`
- Creates `roll_photos` entries (position = favorite order)
- Marks those favorites with the new `roll_id`
- Returns the new roll ID

**Frontend — `FavoritesRollPrompt` component:**
- Banner/card shown on library page when unassigned count >= 36
- "Create a Roll" button → calls API → navigates to Roll Builder Flow
- Dismissible (stored in localStorage, reappears after 7 days or next 36)

---

## Phase 2: Roll Builder Flow (Guided Experience)

After auto-creating the roll, the user enters a 3-step guided flow.

### Step 1: Name Your Roll

```
┌──────────────────────────────────────────────────────────────┐
│  What's the theme of these photos?                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Saturday at the Farmer's Market                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │thumb│ │thumb│ │thumb│ │thumb│ │thumb│ │thumb│        │  ← preview of the 36
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│  ... scrollable row ...                                      │
│                                                              │
│                                              [Next →]        │
└──────────────────────────────────────────────────────────────┘
```

### Step 2: Write the Story

```
┌──────────────────────────────────────────────────────────────┐
│  Tell the story behind this roll (optional)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ We woke up early to beat the crowds at the farmer's  │   │
│  │ market on Hawthorne. The light was perfect...        │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  This will appear as the introduction to your roll.          │
│                                                              │
│                                    [← Back]  [Next →]        │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Caption Your Photos

```
┌──────────────────────────────────────────────────────────────┐
│  Add captions to your photos                                 │
│  1 of 36                                                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              [Large photo preview]                    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ The heirloom tomato vendor — been coming here for    │   │  ← pre-filled if
│  │ twenty years                                         │   │     auto-caption exists
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │  ●  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │        │  ← filmstrip nav
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                                              │
│                            [← Back]  [Skip All]  [Done →]   │
└──────────────────────────────────────────────────────────────┘
```

### Changes Required

**New page: `/(app)/roll/[id]/build/page.tsx`**
- Multi-step form component with steps 1-3
- Updates roll via `PATCH /api/rolls/[id]` (name, story)
- Updates captions via `PATCH /api/rolls/[id]/photos` (batch caption update)
- On "Done": sets `roll.status = 'ready_to_develop'` or triggers develop

**Refactor:** Existing roll creation page (`/(app)/projects/rolls/create`) can remain
for manual roll creation; the auto-flow from favorites uses the new build page.

---

## Phase 3: Public Posts (Photo Blog)

After developing a roll, the user is prompted to share. The share sheet now has
two options: **Circle (private)** and **Public Post (blog)**.

### Database

```sql
-- Migration 011: blog_posts, email_subscribers, profile extensions

CREATE TABLE blog_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  roll_id           UUID NOT NULL REFERENCES rolls(id),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  excerpt           TEXT,
  story             TEXT,                          -- copied from roll.story at publish time
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

-- Email subscriptions
CREATE TABLE email_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id),
  email           TEXT NOT NULL,
  confirmed       BOOLEAN DEFAULT false,
  confirm_token   TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (author_id, email)
);

CREATE INDEX idx_email_subscribers_author ON email_subscribers (author_id) WHERE confirmed = true;

-- Profile extensions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false;

-- Track order source
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS blog_post_id UUID REFERENCES blog_posts(id);
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app'
  CHECK (source IN ('app', 'blog', 'gallery'));
```

### URL Structure

```
roll.photos/blog/[authorSlug]                  → Author homepage (all posts)
roll.photos/blog/[authorSlug]/[postSlug]        → Individual post
roll.photos/blog/[authorSlug]/rss               → RSS feed
roll.photos/blog/[authorSlug]/subscribe         → Email subscribe confirmation page
```

### Public Blog Post Page — `/blog/[authorSlug]/[postSlug]`

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo/Avatar]  Author Name      [Subscribe]  Powered by Roll│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                  COVER PHOTO                         │   │
│  │                  (hero, full-width)                   │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  February 15, 2026  ·  36 photos  ·  Portra 400 film        │
│                                                              │
│  # Saturday at the Farmer's Market                           │
│                                                              │
│  We woke up early to beat the crowds at the farmer's         │
│  market on Hawthorne. The light was perfect...               │  ← roll story
│                                                              │
│  ─── photos ─────────────────────────────────────────────    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                    │     │
│  │        <figure> Photo 1 (full width) </figure>     │     │
│  │                                                    │     │
│  └────────────────────────────────────────────────────┘     │
│  <figcaption>"The heirloom tomato vendor"</figcaption>       │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │                  │  │                  │                 │
│  │  <figure> 2      │  │  <figure> 3      │                 │
│  │                  │  │                  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  "Baskets of lavender"   "Morning light on the tents"        │
│                                                              │
│  ... more photos with captions ...                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Order from this collection                          │   │
│  │                                                      │   │
│  │  [Prints from $0.30]  [Magazine $12.99]  [Book $29]  │   │  ← if enabled
│  │                                                      │   │
│  │  Sign up for a free Roll account to order →          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─── comments ───────────────────────────────────────────    │
│                                                              │
│  💬 3 comments                                              │
│  "Beautiful shots!" — @maria · 2h ago                        │
│  "Where is this market?" — @tom · 1d ago                     │
│  [Sign up free to comment →]                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Avatar]  Author Name                                       │
│  Blog tagline here                                           │
│  [View All Posts →]  [Subscribe by Email]                     │
│                                                              │
│  Tags: #farmers-market  #portland  #film-photography          │
│  Share: [Copy Link]  [Twitter]  [Facebook]  [Pinterest]      │
│                                                              │
│  © 2026 Author Name · Powered by Roll                        │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Uses semantic HTML (`<article>`, `<figure>`, `<figcaption>`, `<time>`)
- Captions as `<figcaption>` — critical for SEO and accessibility
- Comments visible to everyone; posting requires free account
- Ordering visible to everyone; checkout requires free account
- "Subscribe by Email" in header and footer
- Photo alt text = caption text (SEO win)

### Author Blog Page — `/blog/[authorSlug]`

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo/Avatar]  Author Name      [Subscribe]  Powered by Roll│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Avatar]                                                    │
│  Author Name / Business Name                                 │
│  Blog tagline or business description                        │
│  12 posts  ·  432 photos                                     │
│  [Subscribe by Email]  [RSS]                                 │
│                                                              │
│  ─── Shop ───────────────────────────────────────────────    │
│  (only if author has purchasable items)                       │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Magazine   │ │ Magazine   │ │ 2025 Book  │              │
│  │ cover      │ │ cover      │ │ cover      │              │
│  │            │ │            │ │            │              │
│  │ Jan 2026   │ │ Dec 2025   │ │ Year Book  │              │
│  │ $12.99     │ │ $12.99     │ │ $39.99     │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│  ─── Posts ──────────────────────────────────────────────    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │  Cover Photo     │  │  Cover Photo     │  │ Cover      ││
│  ├──────────────────┤  ├──────────────────┤  ├────────────┤│
│  │ Post Title       │  │ Post Title       │  │ Title      ││
│  │ Feb 15 · 36 pics │  │ Feb 1 · 36 pics  │  │ Jan 20     ││
│  │ Excerpt text...  │  │ Excerpt text...  │  │ Excerpt... ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                              │
│  [Load More]                                                 │
│                                                              │
│  © 2026 Author Name · Powered by Roll                        │
└──────────────────────────────────────────────────────────────┘
```

### Publish Flow (in-app)

After developing a roll, a banner appears: **"Share this roll"**

Two options:
1. **Share to Circle** (existing ShareToCircleModal)
2. **Publish as Public Post** (new PublishModal)

```
┌──────────────────────────────────────────────────────────────┐
│  Publish to Your Blog                              [✕ Close] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Title                                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Saturday at the Farmer's Market                      │   │  ← pre-filled from roll
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  URL                                                         │
│  roll.photos/blog/janes/ ┌─────────────────────────────┐   │
│                           │ farmers-market-feb-2026     │   │
│                           └─────────────────────────────┘   │
│                                                              │
│  Excerpt                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ A morning walk through the local farmer's market...  │   │  ← auto-generated from
│  └──────────────────────────────────────────────────────┘   │     story first sentence
│                                                              │
│  Cover Photo                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ [✓] │ │     │ │     │ │     │ │     │ │     │        │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                                              │
│  Tags                                                        │
│  [farmers-market ✕] [portland ✕] [+ Add]                     │
│                                                              │
│  ── Ordering ──                                              │
│  ☑ Allow visitors to order prints                            │
│  ☐ Allow visitors to order magazine                          │
│  ☐ Allow visitors to order book                              │
│                                                              │
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │   Save as Draft     │  │   Publish Now              │   │
│  └─────────────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Email Subscription

**Subscribe flow:**
1. Visitor enters email on author page or post page
2. `POST /api/blog/[authorSlug]/subscribe` creates `email_subscribers` row with `confirmed = false`
3. Confirmation email sent with link to `/blog/[authorSlug]/subscribe?token=xxx`
4. Clicking link sets `confirmed = true`

**Notification flow:**
1. When author publishes a new post, enqueue email job
2. Email sent to all confirmed subscribers for that author
3. Email contains: post title, cover photo, excerpt, link, unsubscribe link
4. Rate limited to max 1 email per author per day

**API routes:**
- `POST /api/blog/[authorSlug]/subscribe` — submit email
- `GET /api/blog/[authorSlug]/subscribe?token=xxx` — confirm
- `GET /api/blog/[authorSlug]/unsubscribe?token=xxx` — unsubscribe

### Public Comments

Blog post comments reuse the existing `circle_comments` pattern, but with a new
table scoped to blog posts:

```sql
CREATE TABLE blog_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  body        TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blog_comments_post ON blog_comments (post_id, created_at);
```

- Anyone can **read** comments (public, service-role client)
- **Posting** requires a free Roll account (authenticated)
- Comment UI matches existing CirclePostCard comment section style

### SEO

**`generateMetadata` on each page:**
- `<title>`: `{seo_title || title} — {blog_name || display_name}`
- `<meta name="description">`: excerpt or first 160 chars of story
- Open Graph: type=article, image=cover photo CDN URL (1200px wide)
- Twitter Card: summary_large_image
- Canonical URL

**JSON-LD (in page body):**
- Post page: `Article` schema with `author`, `datePublished`, `image[]`
- Author page: `ProfilePage` with `Person` or `Organization`

**Sitemap (`sitemap.ts` update):**
- Query all published blog posts via service-role client
- Add `/blog/{authorSlug}` (priority 0.7) and `/blog/{authorSlug}/{postSlug}` (priority 0.8)

**RSS Feed (`/api/blog/[authorSlug]/rss`):**
- Standard RSS 2.0 with channel info + items (title, description, link, pubDate, enclosure)

---

## Phase 4: Magazine from Rolls

### Current Problem

Magazines currently pull from **favorites by date range**. This misses the
rich context (stories, captions, roll names) that users added during the
Roll Builder Flow.

### New Flow

After creating 3 developed rolls, a prompt appears:
"You've developed 3 rolls — turn them into a magazine?"

```
┌──────────────────────────────────────────────────────────────┐
│  Create Magazine                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Select Rolls to Include                                     │
│                                                              │
│  ☑ Saturday at the Farmer's Market (36 photos, Feb 15)       │
│  ☑ Sunday Hike at Forest Park (36 photos, Feb 8)             │
│  ☑ Coffee Shop Mornings (36 photos, Jan 28)                  │
│  ☐ New Year's Eve Party (36 photos, Dec 31)                  │
│                                                              │
│  Magazine Title                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ February 2026                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Format                                                      │
│  ● 6×9 ($12.99)    ○ 8×10 ($15.99)                         │
│                                                              │
│  Font                                                        │
│  ○ Default (System)                                          │
│  ● Garamond (Classic serif)                                  │
│  ○ Futura (Modern sans)                                      │
│  ○ Courier (Typewriter)                                      │
│  ○ Playfair Display (Editorial)                              │
│                                                              │
│                                    [Preview →]               │
└──────────────────────────────────────────────────────────────┘
```

### Database Changes

```sql
-- Extend magazines to reference rolls instead of just date ranges
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS roll_ids UUID[] DEFAULT '{}';
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'default';
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE magazines ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

CREATE INDEX idx_magazines_public ON magazines (public_slug) WHERE is_public = true;
```

### Refactor: `POST /api/magazines`

Currently accepts `dateRangeStart/End` and fetches favorites.

**New behavior:** Accept `rollIds: string[]` (array of roll IDs).
- Fetch all `roll_photos` for the selected rolls, joined with `photos` and `rolls`
- Each roll becomes a **section** in the magazine with:
  - Section divider page (roll name as title)
  - Story page (roll.story as body text, using selected font)
  - Photo pages with captions (from roll_photos)
- Pass font choice to `autoDesignMagazine` for layout metadata

**Backward compatible:** If `dateRangeStart/End` is provided (no rollIds), use
existing favorites-based flow.

### Refactor: `autoDesignMagazine`

Update to accept rolls as sections instead of flat favorites:

```typescript
interface MagazineSection {
  rollId: string;
  title: string;           // roll name
  story: string | null;    // roll story
  photos: DesignPhoto[];   // roll_photos with captions
}

function autoDesignMagazine(
  sections: MagazineSection[],
  template: MagazineTemplate,
  options: { font?: string }
): MagazinePage[]
```

Each section gets:
1. A section divider page (title)
2. A story page if story exists (rendered in chosen font)
3. Photo pages with intelligent layout (existing scoring algorithm)
4. Captions on photo pages (using chosen font)

### Font Handling

Fonts are metadata stored on the magazine record. The actual rendering happens:
- **In-app preview:** CSS font-family applied to magazine preview components
- **Print PDF:** Font embedded in the PDF generation step (before Prodigi submission)
- **Prodigi assets:** Pages rendered as images/PDFs with the font baked in

Font options (all freely licensable for print):
| ID | Name | Style |
|----|------|-------|
| `default` | System UI | Clean, neutral |
| `garamond` | EB Garamond | Classic editorial serif |
| `futura` | Jost | Modern geometric sans |
| `courier` | Courier Prime | Typewriter feel |
| `playfair` | Playfair Display | Elegant editorial |

---

## Phase 5: Books (Magazine Compilation)

### Concept

A book collates multiple magazines into a single hardcover volume. Typical use:
once or twice a year, compile all magazines from that period.

### Database

```sql
CREATE TABLE books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  title           TEXT NOT NULL,
  slug            TEXT,
  magazine_ids    UUID[] NOT NULL DEFAULT '{}',    -- ordered list of magazine IDs
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
```

### Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Create a Book                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Select Magazines to Compile                                 │
│                                                              │
│  ☑ February 2026 (48 pages)                                  │
│  ☑ January 2026 (36 pages)                                   │
│  ☑ December 2025 (36 pages)                                  │
│  ☐ November 2025 (24 pages)                                  │
│                                                              │
│  Estimated: 120 pages                                        │
│                                                              │
│  Book Title                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2025: A Year in Photos                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Format                                                      │
│  ● 8×10 Hardcover ($39.99)   ○ 10×10 Hardcover ($49.99)    │
│                                                              │
│  Font (inherited from magazines, or override)                │
│  ● Keep each magazine's font   ○ Unify: [Garamond ▾]       │
│                                                              │
│  ☑ Make available on my public page ($39.99 per copy)        │
│                                                              │
│                               [Preview →]  [Order for Me →]  │
└──────────────────────────────────────────────────────────────┘
```

### Book Assembly

The book is assembled by concatenating magazine content:
1. **Book cover** page (title + cover photo + year)
2. **Table of contents** (list of magazine titles with page numbers)
3. For each magazine (in chronological order):
   - Title page (magazine title + date range)
   - All magazine pages in order
4. **Back cover**

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/books` | List user's books |
| POST | `/api/books` | Create book from magazines |
| PATCH | `/api/books/[id]` | Update book |
| DELETE | `/api/books/[id]` | Delete book |
| POST | `/api/books/[id]/order` | Submit to Prodigi |
| GET | `/api/blog/[authorSlug]/shop` | Public: list purchasable items |

### Prodigi SKUs

```typescript
const BOOK_FORMAT_SKU: Record<string, string> = {
  '8x10': 'GLOBAL-PHB-8x10-HRD-COV-MG',   // hardcover photo book
  '10x10': 'GLOBAL-PHB-10x10-HRD-COV-MG',
};
```

### Pricing

| Format | Pages | Price |
|--------|-------|-------|
| 8×10 Hardcover | up to 120 | $39.99 |
| 8×10 Hardcover | up to 200 | $49.99 |
| 8×10 Hardcover | up to 300 | $59.99 |
| 10×10 Hardcover | up to 120 | $49.99 |
| 10×10 Hardcover | up to 200 | $59.99 |
| 10×10 Hardcover | up to 300 | $69.99 |

---

## Phase 6: Public Ordering (Prints, Magazines, Books)

### Gating: Free Account Required

All public pages are **viewable without an account**. But to:
- Post a comment → free account required
- Order prints → free account required
- Order a magazine → free account required
- Order a book → free account required

When a visitor clicks an order/comment action, they see:

```
┌──────────────────────────────────────────────────────┐
│  Join Roll for free to continue                      │
│                                                      │
│  [Sign up with Email]                                │
│  [Sign up with Google]                               │
│  [Sign up with Apple]                                │
│                                                      │
│  Already have an account? [Log in]                   │
│                                                      │
│  Free accounts include:                              │
│  ✓ Comment on public posts                           │
│  ✓ Order prints, magazines, and books                │
│  ✓ 1 circle with up to 5 members                    │
│  ✓ Create your own photo rolls                       │
└──────────────────────────────────────────────────────┘
```

After signing up, they're returned to the page they were on with the action
pre-loaded (store intended action in URL params or sessionStorage).

### Public Shop Section

On the author page (`/blog/[authorSlug]`), a "Shop" section shows:
- Magazines marked `is_public = true`
- Books marked `is_public = true`
- "Order prints from any post" link

### API Routes for Public Ordering

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/blog/[authorSlug]/shop` | List public magazines + books |
| POST | `/api/blog/[authorSlug]/[postSlug]/print-order` | Create print order (auth required) |
| POST | `/api/blog/[authorSlug]/magazine-order/[magazineSlug]` | Order a magazine (auth required) |
| POST | `/api/blog/[authorSlug]/book-order/[bookSlug]` | Order a book (auth required) |

All order routes require authentication. They create entries in `print_orders`
(for prints) or clone the magazine/book order for the buyer using the existing
Prodigi pipelines.

---

## Phase 7: Encouragement / Nudge System

The journey has natural prompts at key milestones.

| Trigger | Nudge | Action |
|---------|-------|--------|
| 36 unassigned favorites | "You have a roll waiting!" | → Auto-roll creation |
| Roll developed | "Share this roll" | → Share to circle or publish |
| 3 developed rolls | "Turn your rolls into a magazine" | → Magazine creation |
| 2+ magazines | "Compile a book from your magazines" | → Book creation |
| First blog post published | "Set up your blog profile" | → Blog settings |
| Blog post gets 10+ views | "Share on social media" | → Share buttons |

### Implementation

**New component: `NudgeBanner`** — generic banner/card with:
- Icon, title, description, CTA button, dismiss button
- Shown on relevant pages (library, roll detail, projects)
- Dismiss state stored in localStorage with optional re-show delay

**New API: `GET /api/nudges`** — returns active nudges for current user based on:
- Unassigned favorites count
- Developed roll count
- Magazine count
- Blog post count
- Called once on app load, cached in client state

---

## Implementation Order (all phases)

### Sprint 1: Auto-Roll + Roll Builder
1. Migration: `favorites.roll_id` column
2. `GET /api/favorites/unassigned-count`
3. `POST /api/rolls/from-favorites`
4. `FavoritesRollPrompt` component
5. `/(app)/roll/[id]/build/page.tsx` (3-step flow)
6. Batch caption update API

### Sprint 2: Public Blog Foundation
7. Migration 011: `blog_posts`, `email_subscribers`, `blog_comments`, profile columns
8. `types/blog.ts`
9. Blog CRUD API routes (authenticated)
10. Public blog post API + author listing API (service-role)
11. `PublishModal` component

### Sprint 3: Public Pages + SEO
12. `/blog/[authorSlug]/page.tsx` + `BlogPostCard`
13. `/blog/[authorSlug]/[postSlug]/page.tsx` + `BlogPostView` + `BlogPhotoLayout`
14. `BlogAuthorHeader`, `BlogFooter`, `BlogShareBar`
15. SEO: generateMetadata, JSON-LD, OG tags on all blog pages
16. Sitemap update
17. RSS feed endpoint

### Sprint 4: Email Subscriptions + Comments
18. Subscribe/confirm/unsubscribe API routes
19. `EmailSubscribeForm` component (on blog pages)
20. Email sending on publish (queue-based)
21. `blog_comments` API routes
22. `BlogComments` component (public read, auth write)

### Sprint 5: Magazine from Rolls
23. Migration: `magazines.roll_ids`, `magazines.font`, public columns
24. Refactor `POST /api/magazines` to accept `rollIds`
25. Refactor `autoDesignMagazine` for section-based layout with stories
26. New magazine creation UI (select rolls, pick font)
27. Font preview in magazine detail/review pages

### Sprint 6: Books
28. Migration: `books` table
29. Book assembly logic (concatenate magazine pages + TOC)
30. `POST /api/books`, `PATCH`, `DELETE`, order routes
31. Book creation UI + preview
32. Prodigi book SKU integration

### Sprint 7: Public Ordering + Nudges
33. Auth gate component for order/comment actions
34. Public shop section on author page
35. Print/magazine/book order routes from blog
36. `NudgeBanner` component
37. `GET /api/nudges` endpoint
38. Nudge triggers on library, roll, and projects pages

### Sprint 8: Polish
39. View counter (debounced)
40. Analytics dashboard (views per post)
41. Blog settings UI in account page
42. Blog post manager (list/edit/archive)
43. Existing gallery → blog migration path (deprecate /gallery/[slug] in favor of /blog)

---

## Files Created / Modified Summary

### New Files (~30)

**Migration:**
- `supabase/migrations/011_blog_and_books.sql`

**Types:**
- `src/types/blog.ts`
- `src/types/book.ts`

**API Routes (new):**
- `src/app/api/favorites/unassigned-count/route.ts`
- `src/app/api/rolls/from-favorites/route.ts`
- `src/app/api/blog/posts/route.ts`
- `src/app/api/blog/posts/[id]/route.ts`
- `src/app/api/blog/settings/route.ts`
- `src/app/api/blog/[authorSlug]/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/views/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/comments/route.ts`
- `src/app/api/blog/[authorSlug]/[postSlug]/print-order/route.ts`
- `src/app/api/blog/[authorSlug]/subscribe/route.ts`
- `src/app/api/blog/[authorSlug]/rss/route.ts`
- `src/app/api/blog/[authorSlug]/shop/route.ts`
- `src/app/api/books/route.ts`
- `src/app/api/books/[id]/route.ts`
- `src/app/api/books/[id]/order/route.ts`
- `src/app/api/nudges/route.ts`

**Pages (new):**
- `src/app/blog/[authorSlug]/page.tsx`
- `src/app/blog/[authorSlug]/[postSlug]/page.tsx`
- `src/app/blog/[authorSlug]/subscribe/page.tsx`
- `src/app/(app)/roll/[id]/build/page.tsx`

**Components (new):**
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
- `src/components/magazine/FontSelector.tsx`
- `src/components/magazine/RollSelector.tsx`
- `src/components/book/BookCreator.tsx`
- `src/components/book/BookPreview.tsx`
- `src/components/shared/NudgeBanner.tsx`

### Modified Files (~12)

- `src/app/sitemap.ts` — add blog pages
- `src/app/(app)/library/page.tsx` — add FavoritesRollPrompt
- `src/app/(app)/projects/magazines/create/page.tsx` — add roll selection + font picker
- `src/app/(app)/projects/magazines/[id]/page.tsx` — font preview
- `src/app/(app)/projects/magazines/[id]/review/page.tsx` — font in preview
- `src/app/api/magazines/route.ts` — accept rollIds, font
- `src/lib/magazine/auto-design.ts` — section-based design with font metadata
- `src/lib/prodigi/magazine.ts` — font in PDF generation metadata
- `src/types/magazine.ts` — add font, roll_ids, public fields
- `src/components/circle/ShareToCircleModal.tsx` — add "Publish Public" option
- `src/app/(app)/roll/[id]/page.tsx` — add publish prompt after development
- `src/app/(app)/projects/page.tsx` — add nudge banners
