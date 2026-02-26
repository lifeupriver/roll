-- ============================================================
-- Migration 011: Blog, Books, and Full User Journey
-- ============================================================

-- ── 1. Extend existing tables ──────────────────────────────

-- Track which roll a favorite was assigned to
-- (roll_id column already exists on favorites from previous migration)
CREATE INDEX IF NOT EXISTS idx_favorites_unassigned ON favorites (user_id) WHERE roll_id IS NULL;

-- Roll-level theme name
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS theme_name VARCHAR(200);

-- Per-photo captions already added in migration 005
-- (caption, caption_source, caption_updated_at on roll_photos)
-- Roll story already added in migration 005

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

CREATE TABLE IF NOT EXISTS blog_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roll_id           UUID NOT NULL REFERENCES rolls(id),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  excerpt           TEXT,
  story             TEXT,
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

CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts (user_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_lookup ON blog_posts (user_id, slug) WHERE status = 'published';

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blog posts"
  ON blog_posts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Published blog posts are public"
  ON blog_posts FOR SELECT USING (status = 'published');

-- Foreign key for print_orders → blog_posts
ALTER TABLE print_orders ADD CONSTRAINT fk_print_orders_blog_post
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id);

-- ── 3. Email subscribers ───────────────────────────────────

CREATE TABLE IF NOT EXISTS email_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  confirmed       BOOLEAN DEFAULT false,
  confirm_token   TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (author_id, email)
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_author ON email_subscribers (author_id) WHERE confirmed = true;

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors see own subscribers"
  ON email_subscribers FOR SELECT USING (author_id = auth.uid());

-- ── 4. Blog comments ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments (post_id, created_at);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS books (
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

CREATE INDEX IF NOT EXISTS idx_books_user ON books (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_public ON books (public_slug) WHERE is_public = true;

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own books"
  ON books FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public books viewable by all"
  ON books FOR SELECT USING (is_public = true);
