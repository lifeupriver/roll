# Public Photo Blog Feature — Complete Design

## Concept

When a user develops a roll, they can **publish** it as a public blog post. The developed photos with their captions become an SEO-optimized, beautifully laid-out photo blog entry. No app download required to view. Business owners can optionally allow visitors to order prints directly from the post.

**Flow**: Upload photos → Build roll → Develop roll → **Publish as blog post** → Public URL anyone can visit

---

## URL Structure

```
roll.photos/blog/[authorSlug]                  → Author's blog homepage (all posts)
roll.photos/blog/[authorSlug]/[postSlug]        → Individual blog post
roll.photos/blog/[authorSlug]/rss               → RSS feed
```

The `authorSlug` reuses the existing `profiles.public_slug` field (from migration 008). If not set, we'll prompt the user to create one when they first publish.

---

## Database Changes (migration 011)

### New table: `blog_posts`

```sql
CREATE TABLE blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  roll_id         UUID NOT NULL REFERENCES rolls(id),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  excerpt         TEXT,                          -- short blurb for SEO / cards
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  published_at    TIMESTAMPTZ,
  cover_photo_id  UUID REFERENCES photos(id),    -- hero / OG image
  seo_title       TEXT,                          -- optional override
  seo_description TEXT,                          -- optional override
  tags            TEXT[] DEFAULT '{}',
  allow_print_orders BOOLEAN DEFAULT false,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, slug)
);

CREATE INDEX idx_blog_posts_author   ON blog_posts (user_id, status, published_at DESC);
CREATE INDEX idx_blog_posts_slug     ON blog_posts (user_id, slug) WHERE status = 'published';
CREATE INDEX idx_blog_posts_roll     ON blog_posts (roll_id);
```

### Extend `profiles` table

```sql
-- Blog-specific profile fields (public_slug already exists from 008)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_enabled BOOLEAN DEFAULT false;
```

### RLS Policies

```sql
-- Blog posts: owners manage their own, public can read published
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blog posts"
  ON blog_posts FOR ALL USING (auth.uid() = user_id);

-- Public read handled via service-role client in API (same pattern as gallery)
```

### Why no `blog_post_photos` table?

Blog posts render **the roll's photos** (`roll_photos` + `photos` tables) in position order with their captions. This is the "automated" part — zero extra work for the user. The roll IS the content. If the user edits captions in the roll, the blog post updates automatically.

---

## API Routes

### Public (no auth, service-role client)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/blog/[authorSlug]` | List published posts for author |
| GET | `/api/blog/[authorSlug]/[postSlug]` | Get full blog post with photos |
| POST | `/api/blog/[authorSlug]/[postSlug]/views` | Increment view counter |
| GET | `/api/blog/[authorSlug]/rss` | RSS 2.0 feed |
| POST | `/api/blog/[authorSlug]/[postSlug]/print-order` | Guest print order |

### Authenticated

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/blog/posts` | List user's own blog posts (all statuses) |
| POST | `/api/blog/posts` | Create blog post from a roll |
| PATCH | `/api/blog/posts/[id]` | Update post (title, slug, tags, status, etc.) |
| DELETE | `/api/blog/posts/[id]` | Delete / archive post |
| PATCH | `/api/blog/settings` | Update blog profile (name, description, enabled) |

---

## Pages

### 1. Blog Post Page — `/blog/[authorSlug]/[postSlug]/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo/Avatar]  Author Name          Powered by Roll         │  ← branded header
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                  COVER PHOTO                         │   │  ← full-width hero
│  │                  (16:9 crop)                          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  February 15, 2026  ·  24 photos  ·  Warmth film            │  ← metadata line
│                                                              │
│  # Roll Title                                                │  ← <h1>
│  Optional excerpt / story text here...                       │  ← roll.story or excerpt
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                    │     │
│  │              Photo 1 (full width)                  │     │  ← editorial layout
│  │                                                    │     │
│  └────────────────────────────────────────────────────┘     │
│  "Caption for photo 1 — the story behind this moment"        │  ← <figcaption>
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │                  │  │                  │                 │  ← 2-up for landscape
│  │    Photo 2       │  │    Photo 3       │                 │
│  │                  │  │                  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  "Caption 2"             "Caption 3"                         │
│                                                              │
│  ... more photos with captions ...                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📷  Order Prints from This Collection               │   │  ← CTA (if enabled)
│  │  [Select Photos]  [Order All — from $0.25/print]     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  [Avatar]  Author Name                                       │
│  Blog description / bio                                      │  ← author card
│  [View All Posts →]                                          │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  Tags: #wedding  #portraits  #film-photography               │
│                                                              │
│  Share: [Copy Link] [Twitter] [Facebook] [Pinterest]         │
│                                                              │
│  © 2026 Author Name · Powered by Roll                        │
└──────────────────────────────────────────────────────────────┘
```

**SEO metadata generated:**
- `<title>`: `{seo_title || title} — {blog_name || author_name}`
- `<meta description>`: `{seo_description || excerpt || first caption}`
- Open Graph: title, description, image (cover photo CDN URL), type: article
- Twitter Card: summary_large_image
- JSON-LD: Article schema with author, datePublished, images
- Canonical URL: `https://roll.photos/blog/{authorSlug}/{postSlug}`

**Photo layout algorithm:**
- Single portrait → full width
- Single landscape → full width
- Two landscapes in a row → side by side (2-up)
- Mix → intelligent grouping based on aspect ratios (similar to the existing masonry in PublicGalleryView but with captions below each)

### 2. Author Blog Page — `/blog/[authorSlug]/page.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo/Avatar]  Author Name          Powered by Roll         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Avatar ●]                                                  │
│  Author Name / Business Name                                 │
│  Blog description or business tagline                        │
│  12 posts · 342 photos                                       │
│  [RSS ⊕]                                                    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │                  │  │                  │  │            ││
│  │  Cover Photo 1   │  │  Cover Photo 2   │  │  Cover 3   ││  ← post grid
│  │                  │  │                  │  │            ││
│  ├──────────────────┤  ├──────────────────┤  ├────────────┤│
│  │ Post Title       │  │ Post Title       │  │ Title      ││
│  │ Feb 15 · 24 pics │  │ Feb 1 · 18 pics  │  │ Jan 20     ││
│  │ Excerpt...       │  │ Excerpt...       │  │ Excerpt... ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │  ...more posts   │  │                  │  │            ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                              │
│  © 2026 Author Name · Powered by Roll                        │
└──────────────────────────────────────────────────────────────┘
```

**SEO:**
- JSON-LD: Person or Organization schema
- Meta: author name, blog description
- Each post card is a `<article>` with proper heading hierarchy

### 3. Publish Modal (in-app, after developing roll)

```
┌──────────────────────────────────────────────────────────────┐
│  Publish as Blog Post                              [✕ Close] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Title                                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Saturday at the Farmer's Market                      │   │  ← pre-filled from roll name
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  URL slug                                                    │
│  roll.photos/blog/janes-photos/ ┌──────────────────────┐   │
│                                  │ farmers-market-feb   │   │  ← auto-generated, editable
│                                  └──────────────────────┘   │
│                                                              │
│  Excerpt (optional)                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ A morning walk through the local farmer's market...  │   │  ← for previews / SEO
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Cover Photo                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ ✓   │ │     │ │     │ │     │ │     │ │     │        │  ← pick from roll photos
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│                                                              │
│  Tags                                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [farmers-market ✕] [film-photography ✕] [+ Add]      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ☐ Allow visitors to order prints from this post             │
│                                                              │
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │   Save as Draft     │  │   ✦ Publish Now            │   │
│  └─────────────────────┘  └────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4. Blog Settings (in account page)

```
┌──────────────────────────────────────────────────────────────┐
│  Blog Settings                                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Enable Public Blog                                          │
│  ┌───────┐                                                   │
│  │ ● ON  │  Your blog is live at roll.photos/blog/janes     │
│  └───────┘                                                   │
│                                                              │
│  Blog URL                                                    │
│  roll.photos/blog/ ┌──────────────────────────┐             │
│                     │ janes-photos             │             │
│                     └──────────────────────────┘             │
│                                                              │
│  Blog Name                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Jane's Photo Journal                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Blog Description                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Film-inspired photography from Portland, OR. Events, │   │
│  │ portraits, and everyday moments.                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Save Changes]                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `BlogPostView` | `components/blog/BlogPostView.tsx` | Full blog post layout (public) |
| `BlogPostCard` | `components/blog/BlogPostCard.tsx` | Post card for author page grid |
| `BlogAuthorHeader` | `components/blog/BlogAuthorHeader.tsx` | Author profile + branding header |
| `BlogPhotoLayout` | `components/blog/BlogPhotoLayout.tsx` | Editorial photo+caption layout |
| `BlogPrintCTA` | `components/blog/BlogPrintCTA.tsx` | Print ordering section/modal |
| `BlogShareBar` | `components/blog/BlogShareBar.tsx` | Social sharing buttons |
| `BlogFooter` | `components/blog/BlogFooter.tsx` | Author card + copyright footer |
| `PublishModal` | `components/blog/PublishModal.tsx` | In-app publish flow |
| `BlogSettingsForm` | `components/blog/BlogSettingsForm.tsx` | Blog profile settings |
| `BlogPostManager` | `components/blog/BlogPostManager.tsx` | In-app list of user's posts |

---

## Types

```typescript
// types/blog.ts

export interface BlogPost {
  id: string;
  user_id: string;
  roll_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  cover_photo_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  allow_print_orders: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogAuthor {
  slug: string;
  display_name: string;
  avatar_url: string | null;
  blog_name: string | null;
  blog_description: string | null;
  business_name: string | null;
  business_logo_url: string | null;
  business_accent_color: string | null;
  post_count: number;
}

export interface PublicBlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  tags: string[];
  cover_photo: {
    url: string;
    width: number;
    height: number;
    alt: string;
  } | null;
  photo_count: number;
  film_profile: string | null;
  allow_print_orders: boolean;
  view_count: number;
  author: BlogAuthor;
  photos: BlogPhoto[];
}

export interface BlogPhoto {
  id: string;
  developed_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  caption: string | null;
  position: number;
  date_taken: string | null;
}
```

---

## SEO Implementation

### Dynamic Sitemap (`sitemap.ts` update)

```typescript
// Add all published blog posts + author pages to sitemap
// Query blog_posts WHERE status = 'published'
// Generate entries:
//   /blog/{authorSlug}              priority: 0.7
//   /blog/{authorSlug}/{postSlug}   priority: 0.8
```

### RSS Feed (`/api/blog/[authorSlug]/rss`)

Standard RSS 2.0 with:
- Channel: blog name, description, link
- Items: title, description (excerpt), link, pubDate, enclosure (cover image)
- `Content-Type: application/rss+xml`

### JSON-LD Structured Data

**Blog post page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Saturday at the Farmer's Market",
  "description": "A morning walk through...",
  "image": "https://photos.roll.photos/...",
  "datePublished": "2026-02-15T10:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Jane Smith",
    "url": "https://roll.photos/blog/janes-photos"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Roll",
    "url": "https://roll.photos"
  }
}
```

**Author page:**
```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Jane Smith",
    "url": "https://roll.photos/blog/janes-photos",
    "image": "avatar_url"
  }
}
```

### Open Graph Tags

```html
<meta property="og:type" content="article" />
<meta property="og:title" content="Saturday at the Farmer's Market" />
<meta property="og:description" content="A morning walk..." />
<meta property="og:image" content="https://photos.roll.photos/cover.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://roll.photos/blog/janes/farmers-market" />
<meta property="article:published_time" content="2026-02-15T10:00:00Z" />
<meta property="article:author" content="https://roll.photos/blog/janes-photos" />
<meta property="article:tag" content="farmers-market" />
```

---

## Print Ordering from Blog

When `allow_print_orders` is true, each photo in the blog post gets a subtle print icon on hover. There's also a section at the bottom.

**Guest print order flow:**
1. Visitor clicks "Order Prints" or individual photo print button
2. Modal opens showing selected photo(s) with size picker (4x6, 5x7, 8x10)
3. Visitor enters shipping address + payment (Stripe checkout)
4. Order created in `print_orders` table with `source: 'blog'`
5. Prodigi fulfillment (same pipeline as existing print orders)
6. Blog author gets notification of the order

The `print_orders` table already exists. We add:
```sql
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS blog_post_id UUID REFERENCES blog_posts(id);
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app'
  CHECK (source IN ('app', 'blog', 'gallery'));
```

---

## Implementation Plan (ordered)

### Phase 1: Foundation
1. **Migration 011** — `blog_posts` table + profile columns + print_orders extension
2. **Types** — `types/blog.ts`
3. **Blog settings API** — `PATCH /api/blog/settings`
4. **Blog posts CRUD API** — `POST/PATCH/DELETE /api/blog/posts`

### Phase 2: Public Pages
5. **Public blog post API** — `GET /api/blog/[authorSlug]/[postSlug]`
6. **Public author listing API** — `GET /api/blog/[authorSlug]`
7. **Blog post page** — `/blog/[authorSlug]/[postSlug]/page.tsx` + components
8. **Author blog page** — `/blog/[authorSlug]/page.tsx` + components

### Phase 3: SEO
9. **Sitemap** — Update `sitemap.ts` to include blog pages
10. **RSS feed** — `GET /api/blog/[authorSlug]/rss`
11. **JSON-LD + OG tags** — In page metadata functions

### Phase 4: In-App Publishing Flow
12. **Publish modal** — `PublishModal.tsx` (used from roll detail page)
13. **Blog settings UI** — `BlogSettingsForm.tsx` (in account page)
14. **Blog post manager** — List/edit/archive posts in-app

### Phase 5: Print Ordering
15. **Guest print order API** — `POST /api/blog/[authorSlug]/[postSlug]/print-order`
16. **Print CTA component** — `BlogPrintCTA.tsx` with photo selection + checkout

### Phase 6: Polish
17. **View counter** — Debounced view tracking
18. **Share buttons** — Copy link, Twitter, Facebook, Pinterest
19. **Analytics** — Basic view stats in blog post manager
