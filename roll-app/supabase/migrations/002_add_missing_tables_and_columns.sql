-- Migration 002: Add missing tables and profile columns
-- Adds 5 tables referenced in application code but absent from 001
-- Adds 3 missing profile columns required for Stripe billing and referrals
-- Adds RPC for atomic position decrement on roll photo removal

-- ============================================
-- ADD MISSING PROFILE COLUMNS
-- ============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- ============================================
-- 15. PUSH_SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 16. REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed_up', 'converted')),
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can insert own referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Users can update own referrals" ON referrals FOR UPDATE USING (auth.uid() = referrer_id);

-- ============================================
-- 17. PEOPLE
-- ============================================
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  photo_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_people_user ON people(user_id);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own people" ON people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own people" ON people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own people" ON people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own people" ON people FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 18. PHOTO_TAGS
-- ============================================
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL CHECK (x >= 0 AND x <= 1),
  y DOUBLE PRECISION NOT NULL CHECK (y >= 0 AND y <= 1),
  width DOUBLE PRECISION NOT NULL CHECK (width > 0 AND width <= 1),
  height DOUBLE PRECISION NOT NULL CHECK (height > 0 AND height <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_person ON photo_tags(person_id);

ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own photo tags" ON photo_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM photos WHERE photos.id = photo_tags.photo_id AND photos.user_id = auth.uid()));
CREATE POLICY "Users can insert own photo tags" ON photo_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM photos WHERE photos.id = photo_tags.photo_id AND photos.user_id = auth.uid()));
CREATE POLICY "Users can delete own photo tags" ON photo_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM photos WHERE photos.id = photo_tags.photo_id AND photos.user_id = auth.uid()));

-- Photo tag count trigger: keep people.photo_count in sync
CREATE OR REPLACE FUNCTION update_person_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE people SET photo_count = photo_count + 1 WHERE id = NEW.person_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE people SET photo_count = photo_count - 1 WHERE id = OLD.person_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_tag_count_trigger
  AFTER INSERT OR DELETE ON photo_tags
  FOR EACH ROW EXECUTE FUNCTION update_person_photo_count();

-- ============================================
-- 19. CIRCLE_COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS circle_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_comments_post ON circle_comments(post_id, created_at ASC);

ALTER TABLE circle_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Circle members can read comments" ON circle_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_comments.post_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Circle members can insert comments" ON circle_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM circle_posts cp
    JOIN circle_members cm ON cm.circle_id = cp.circle_id
    WHERE cp.id = circle_comments.post_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own comments" ON circle_comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- UTILITY: Atomic position decrement for roll photos
-- Used by DELETE /api/rolls/[id]/photos to avoid N+1 updates
-- ============================================
CREATE OR REPLACE FUNCTION decrement_positions_after(p_roll_id UUID, p_removed_position INT)
RETURNS VOID AS $$
BEGIN
  UPDATE roll_photos
  SET position = position - 1
  WHERE roll_id = p_roll_id AND position > p_removed_position;
END;
$$ LANGUAGE plpgsql;
