# Roll — Data Model

> Complete database schema for the Supabase PostgreSQL backend. Every table, column, relationship, index, and RLS policy.

---

## 1. Schema Overview

All tables live in the `public` schema. Auth is managed by Supabase's `auth` schema. Foreign keys to users reference `auth.users(id)`.

```
auth.users (Supabase managed)
  │
  ├── profiles (1:1)
  ├── photos (1:many)
  ├── rolls (1:many)
  │     └── roll_photos (1:many, junction)
  ├── favorites (1:many)
  ├── circles (1:many, as creator)
  │     ├── circle_members (1:many)
  │     ├── circle_invites (1:many)
  │     └── circle_posts (1:many)
  │           └── circle_post_photos (1:many)
  │           └── circle_reactions (1:many)
  ├── print_orders (1:many)
  │     └── print_order_items (1:many)
  └── processing_jobs (1:many)
```

---

## 2. Table Definitions

### 2.1 `profiles`

User profile data extending Supabase auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  notification_preferences JSONB NOT NULL DEFAULT '{"email_roll_developed": true, "email_print_shipped": true, "email_circle_invite": true}'::jsonb,
  photo_count INT NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_tier ON profiles(tier);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.2 `photos`

Every uploaded photo. The core data table.

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Storage
  storage_key TEXT NOT NULL,              -- R2 key: originals/{user_id}/{hash}.ext
  thumbnail_url TEXT NOT NULL,            -- Public CDN URL for 400px thumbnail
  lqip_base64 TEXT,                       -- 20px wide base64 placeholder

  -- File metadata
  filename TEXT NOT NULL,
  content_hash TEXT NOT NULL,             -- SHA-256 for dedup
  content_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,

  -- EXIF data
  date_taken TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  camera_make TEXT,
  camera_model TEXT,

  -- Filtering results
  filter_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (filter_status IN ('pending', 'visible', 'filtered_auto', 'hidden_manual')),
  filter_reason TEXT
    CHECK (filter_reason IN (NULL, 'blur', 'screenshot', 'duplicate', 'exposure', 'document')),
  aesthetic_score REAL,                   -- 0.0–1.0
  phash TEXT,                             -- Perceptual hash (64-bit hex)

  -- Content classification
  face_count INT NOT NULL DEFAULT 0,
  scene_classification TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_user_visible ON photos(user_id) WHERE filter_status = 'visible';
CREATE INDEX idx_photos_user_faces ON photos(user_id, face_count) WHERE filter_status = 'visible';
CREATE INDEX idx_photos_content_hash ON photos(user_id, content_hash);
CREATE INDEX idx_photos_phash ON photos(phash);
CREATE INDEX idx_photos_date_taken ON photos(user_id, date_taken DESC);

-- RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own photos" ON photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (auth.uid() = user_id);
-- No delete policy: photos are never deleted, only filtered/hidden
```

### 2.3 `rolls`

Photo rolls (36-shot collections).

```sql
CREATE TABLE rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT,                              -- Auto-generated from date range, editable
  status TEXT NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'ready', 'processing', 'developed', 'error')),
  film_profile TEXT
    CHECK (film_profile IN (NULL, 'warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern')),

  photo_count INT NOT NULL DEFAULT 0,
  max_photos INT NOT NULL DEFAULT 36,

  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  photos_processed INT DEFAULT 0,         -- For progress tracking
  correction_skipped_count INT DEFAULT 0, -- Photos where eyeQ was skipped

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rolls_user_id ON rolls(user_id);
CREATE INDEX idx_rolls_user_status ON rolls(user_id, status);

-- RLS
ALTER TABLE rolls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own rolls" ON rolls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rolls" ON rolls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rolls" ON rolls FOR UPDATE USING (auth.uid() = user_id);
```

### 2.4 `roll_photos`

Junction table linking photos to rolls with position and processed data.

```sql
CREATE TABLE roll_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  position INT NOT NULL,                  -- 1–36, order in roll

  -- Processed image
  processed_storage_key TEXT,             -- R2 key for processed version
  correction_applied BOOLEAN DEFAULT false, -- Whether eyeQ correction was applied

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(roll_id, photo_id),
  UNIQUE(roll_id, position)
);

-- Indexes
CREATE INDEX idx_roll_photos_roll_id ON roll_photos(roll_id);
CREATE INDEX idx_roll_photos_photo_id ON roll_photos(photo_id);

-- RLS
ALTER TABLE roll_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roll photos" ON roll_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can insert own roll photos" ON roll_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can update own roll photos" ON roll_photos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can delete own roll photos" ON roll_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
```

### 2.5 `favorites`

Hearted photos from developed rolls.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, photo_id)
);

-- Indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
```

### 2.6 `circles`

Private sharing groups.

```sql
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_photo_url TEXT,
  member_count INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read" ON circles FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circles.id AND circle_members.user_id = auth.uid()));
CREATE POLICY "Creators can update" ON circles FOR UPDATE
  USING (auth.uid() = creator_id);
CREATE POLICY "Roll+ users can create" ON circles FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
```

### 2.7 `circle_members`

```sql
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(circle_id, user_id)
);

-- Indexes
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);

-- RLS
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read circle membership" ON circle_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can insert self" ON circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2.8 `circle_invites`

```sql
CREATE TABLE circle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,             -- 32-char hex
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_circle_invites_token ON circle_invites(token) WHERE consumed_at IS NULL;

-- RLS
ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage invites" ON circle_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM circles WHERE circles.id = circle_invites.circle_id AND circles.creator_id = auth.uid()));
-- Public read for invite acceptance (token-based, validated in application logic)
CREATE POLICY "Anyone can read by token" ON circle_invites FOR SELECT USING (true);
```

### 2.9 `circle_posts`

```sql
CREATE TABLE circle_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_circle_posts_circle ON circle_posts(circle_id, created_at DESC);

-- RLS
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read posts" ON circle_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circle_posts.circle_id AND circle_members.user_id = auth.uid()));
CREATE POLICY "Members can insert posts" ON circle_posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circle_posts.circle_id AND circle_members.user_id = auth.uid()));
```

### 2.10 `circle_post_photos`

```sql
CREATE TABLE circle_post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,              -- R2 key in circle/ namespace
  position INT NOT NULL,

  UNIQUE(post_id, position)
);

-- RLS inherits from circle_posts access pattern
ALTER TABLE circle_post_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessible via post" ON circle_post_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_post_photos.post_id AND cm.user_id = auth.uid()
  ));
```

### 2.11 `circle_reactions`

```sql
CREATE TABLE circle_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'smile', 'wow')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(post_id, user_id, reaction_type)
);

-- RLS
ALTER TABLE circle_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read reactions" ON circle_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_reactions.post_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Users can manage own reactions" ON circle_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON circle_reactions FOR DELETE
  USING (auth.uid() = user_id);
```

### 2.12 `print_orders`

```sql
CREATE TABLE print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_id UUID REFERENCES rolls(id),

  -- Order details
  product TEXT NOT NULL CHECK (product IN ('roll_prints', 'album_prints', 'individual')),
  print_size TEXT NOT NULL CHECK (print_size IN ('4x6', '5x7')),
  photo_count INT NOT NULL,
  is_free_first_roll BOOLEAN NOT NULL DEFAULT false,

  -- Shipping
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,

  -- Prodigi integration
  prodigi_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'in_production', 'shipped', 'delivered', 'cancelled', 'simulated')),
  tracking_url TEXT,
  estimated_delivery DATE,

  -- Pricing (for future use)
  subtotal_cents INT,
  shipping_cents INT,
  total_cents INT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_print_orders_user ON print_orders(user_id, created_at DESC);

-- RLS
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON print_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON print_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2.13 `print_order_items`

```sql
CREATE TABLE print_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id),
  processed_storage_key TEXT NOT NULL,    -- R2 key of the processed photo used for printing
  position INT NOT NULL,

  UNIQUE(order_id, position)
);

-- RLS inherits from print_orders
ALTER TABLE print_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessible via order" ON print_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM print_orders WHERE print_orders.id = print_order_items.order_id AND print_orders.user_id = auth.uid()));
```

### 2.14 `processing_jobs`

```sql
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('filter', 'develop', 'generate_thumbnail')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload JSONB NOT NULL,                 -- Type-specific data
  result JSONB,                           -- Processing results
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_processing_jobs_pending ON processing_jobs(type, status) WHERE status = 'pending';
CREATE INDEX idx_processing_jobs_user ON processing_jobs(user_id);

-- RLS
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own jobs" ON processing_jobs FOR SELECT USING (auth.uid() = user_id);
```

---

## 3. Utility Functions

```sql
-- Updated_at trigger function (reused across tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rolls_updated_at BEFORE UPDATE ON rolls FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON circles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_print_orders_updated_at BEFORE UPDATE ON print_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 4. Roll Photo Count Trigger

Auto-update `rolls.photo_count` when photos are added/removed:

```sql
CREATE OR REPLACE FUNCTION update_roll_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rolls SET photo_count = photo_count + 1 WHERE id = NEW.roll_id;
    -- Auto-close roll at 36
    UPDATE rolls SET status = 'ready' WHERE id = NEW.roll_id AND photo_count >= 36 AND status = 'building';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rolls SET photo_count = photo_count - 1 WHERE id = OLD.roll_id;
    -- Reopen if below 36
    UPDATE rolls SET status = 'building' WHERE id = OLD.roll_id AND photo_count < 36 AND status = 'ready';
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roll_photo_count_trigger
  AFTER INSERT OR DELETE ON roll_photos
  FOR EACH ROW EXECUTE FUNCTION update_roll_photo_count();
```

---

## 5. Seed Data

For development, `supabase/seed.sql` should create:

1. A test user with email `test@roll.photos`
2. 50 sample photo records with realistic EXIF data and varied filter statuses
3. 2 rolls: one "building" (12 photos) and one "developed" (36 photos, Warmth profile)
4. 5 favorites from the developed roll
5. 1 circle with 2 members
6. 1 print order with "simulated" status

---

## 6. Migration Order

Migrations should be created in this order:

1. `001_create_profiles.sql` — profiles table + trigger
2. `002_create_photos.sql` — photos table
3. `003_create_rolls.sql` — rolls + roll_photos tables + triggers
4. `004_create_favorites.sql` — favorites table
5. `005_create_circles.sql` — circles + members + invites + posts + reactions
6. `006_create_print_orders.sql` — print_orders + items
7. `007_create_processing_jobs.sql` — processing_jobs table
8. `008_seed_data.sql` — development seed data (conditional on environment)
