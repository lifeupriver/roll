-- Roll Database Schema
-- All 14 tables with RLS policies, triggers, and utility functions

-- Utility function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
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

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  lqip_base64 TEXT,
  filename TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  date_taken TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  camera_make TEXT,
  camera_model TEXT,
  filter_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (filter_status IN ('pending', 'visible', 'filtered_auto', 'hidden_manual')),
  filter_reason TEXT
    CHECK (filter_reason IN (NULL, 'blur', 'screenshot', 'duplicate', 'exposure', 'document')),
  aesthetic_score REAL,
  phash TEXT,
  face_count INT NOT NULL DEFAULT 0,
  scene_classification TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_visible ON photos(user_id) WHERE filter_status = 'visible';
CREATE INDEX IF NOT EXISTS idx_photos_user_faces ON photos(user_id, face_count) WHERE filter_status = 'visible';
CREATE INDEX IF NOT EXISTS idx_photos_content_hash ON photos(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_photos_phash ON photos(phash);
CREATE INDEX IF NOT EXISTS idx_photos_date_taken ON photos(user_id, date_taken DESC);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own photos" ON photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. ROLLS
-- ============================================
CREATE TABLE IF NOT EXISTS rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'ready', 'processing', 'developed', 'error')),
  film_profile TEXT
    CHECK (film_profile IN (NULL, 'warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern')),
  photo_count INT NOT NULL DEFAULT 0,
  max_photos INT NOT NULL DEFAULT 36,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  photos_processed INT DEFAULT 0,
  correction_skipped_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rolls_user_id ON rolls(user_id);
CREATE INDEX IF NOT EXISTS idx_rolls_user_status ON rolls(user_id, status);

ALTER TABLE rolls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own rolls" ON rolls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rolls" ON rolls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rolls" ON rolls FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_rolls_updated_at
  BEFORE UPDATE ON rolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. ROLL_PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS roll_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  position INT NOT NULL,
  processed_storage_key TEXT,
  correction_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(roll_id, photo_id),
  UNIQUE(roll_id, position)
);

CREATE INDEX IF NOT EXISTS idx_roll_photos_roll_id ON roll_photos(roll_id);
CREATE INDEX IF NOT EXISTS idx_roll_photos_photo_id ON roll_photos(photo_id);

ALTER TABLE roll_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roll photos" ON roll_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can insert own roll photos" ON roll_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can update own roll photos" ON roll_photos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));
CREATE POLICY "Users can delete own roll photos" ON roll_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM rolls WHERE rolls.id = roll_photos.roll_id AND rolls.user_id = auth.uid()));

-- Roll photo count trigger
CREATE OR REPLACE FUNCTION update_roll_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rolls SET photo_count = photo_count + 1 WHERE id = NEW.roll_id;
    UPDATE rolls SET status = 'ready' WHERE id = NEW.roll_id AND photo_count >= 36 AND status = 'building';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rolls SET photo_count = photo_count - 1 WHERE id = OLD.roll_id;
    UPDATE rolls SET status = 'building' WHERE id = OLD.roll_id AND photo_count < 36 AND status = 'ready';
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roll_photo_count_trigger
  AFTER INSERT OR DELETE ON roll_photos
  FOR EACH ROW EXECUTE FUNCTION update_roll_photo_count();

-- ============================================
-- 5. FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  roll_id UUID NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. CIRCLES
-- ============================================
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_photo_url TEXT,
  member_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read" ON circles FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circles.id AND circle_members.user_id = auth.uid()));
CREATE POLICY "Creators can update" ON circles FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Roll+ users can create" ON circles FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE TRIGGER update_circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. CIRCLE_MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_members_user ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read circle membership" ON circle_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can insert self" ON circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. CIRCLE_INVITES
-- ============================================
CREATE TABLE IF NOT EXISTS circle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_invites_token ON circle_invites(token) WHERE consumed_at IS NULL;

ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage invites" ON circle_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM circles WHERE circles.id = circle_invites.circle_id AND circles.creator_id = auth.uid()));
CREATE POLICY "Anyone can read by token" ON circle_invites FOR SELECT USING (true);

-- ============================================
-- 9. CIRCLE_POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS circle_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_posts_circle ON circle_posts(circle_id, created_at DESC);

ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read posts" ON circle_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circle_posts.circle_id AND circle_members.user_id = auth.uid()));
CREATE POLICY "Members can insert posts" ON circle_posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM circle_members WHERE circle_members.circle_id = circle_posts.circle_id AND circle_members.user_id = auth.uid()));

-- ============================================
-- 10. CIRCLE_POST_PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS circle_post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  position INT NOT NULL,
  UNIQUE(post_id, position)
);

ALTER TABLE circle_post_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessible via post" ON circle_post_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_post_photos.post_id AND cm.user_id = auth.uid()
  ));

-- ============================================
-- 11. CIRCLE_REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS circle_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'smile', 'wow')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE circle_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read reactions" ON circle_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_reactions.post_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Users can manage own reactions" ON circle_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON circle_reactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 12. PRINT_ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_id UUID REFERENCES rolls(id),
  product TEXT NOT NULL CHECK (product IN ('roll_prints', 'album_prints', 'individual')),
  print_size TEXT NOT NULL CHECK (print_size IN ('4x6', '5x7')),
  photo_count INT NOT NULL,
  is_free_first_roll BOOLEAN NOT NULL DEFAULT false,
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  prodigi_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'in_production', 'shipped', 'delivered', 'cancelled', 'simulated')),
  tracking_url TEXT,
  estimated_delivery DATE,
  subtotal_cents INT,
  shipping_cents INT,
  total_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_orders_user ON print_orders(user_id, created_at DESC);

ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON print_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON print_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_print_orders_updated_at
  BEFORE UPDATE ON print_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 13. PRINT_ORDER_ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS print_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id),
  processed_storage_key TEXT NOT NULL,
  position INT NOT NULL,
  UNIQUE(order_id, position)
);

ALTER TABLE print_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessible via order" ON print_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM print_orders WHERE print_orders.id = print_order_items.order_id AND print_orders.user_id = auth.uid()));

-- ============================================
-- 14. PROCESSING_JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('filter', 'develop', 'generate_thumbnail')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload JSONB NOT NULL,
  result JSONB,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_pending ON processing_jobs(type, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user ON processing_jobs(user_id);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own jobs" ON processing_jobs FOR SELECT USING (auth.uid() = user_id);
