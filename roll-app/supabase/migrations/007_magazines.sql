-- Phase 3.1: Photo Magazine Product
-- Pain Points: #6 (Baby Books), #12 (Books Expensive)

-- Magazines table
CREATE TABLE IF NOT EXISTS magazines (
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
  prodigi_order_id TEXT,
  price_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magazines_user ON magazines (user_id, created_at DESC);

-- RLS
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own magazines" ON magazines
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Magazine subscriptions table
CREATE TABLE IF NOT EXISTS magazine_subscriptions (
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

ALTER TABLE magazine_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own magazine subscriptions" ON magazine_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
