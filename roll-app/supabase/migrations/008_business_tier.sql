-- Phase 3.4: Roll Pro — Business Tier
-- Pain Point: #9 (Small Business)

-- Update profiles tier constraint to support 'pro'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'plus', 'pro'));

-- Add business profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_accent_color TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Public gallery fields on rolls
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS public_settings JSONB DEFAULT '{}';
-- public_settings: { logo_url, accent_color, contact_info, watermark }

CREATE INDEX IF NOT EXISTS idx_rolls_public_slug ON rolls (public_slug) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON profiles (public_slug) WHERE public_slug IS NOT NULL;
