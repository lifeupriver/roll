-- Migration 005: Free Circle for Free Users + Photo-Level Captions
-- Phase 1: Allow free users to create 1 circle
-- Phase 2: Add caption fields to roll_photos and story to rolls

-- ================================================================
-- Phase 1: Free Circle Creation
-- ================================================================

-- Drop existing restrictive policy that only allows Roll+ users
DROP POLICY IF EXISTS "Roll+ users can create circles" ON circles;

-- New policy: Free users can create 1 circle, Roll+ unlimited
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

-- ================================================================
-- Phase 2: Photo-Level Captions
-- ================================================================

-- Add caption fields to roll_photos table
ALTER TABLE roll_photos ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE roll_photos ADD COLUMN IF NOT EXISTS caption_source TEXT
  CHECK (caption_source IN ('manual', 'voice', 'auto_draft', 'auto_accepted'));
ALTER TABLE roll_photos ADD COLUMN IF NOT EXISTS caption_updated_at TIMESTAMPTZ;

-- Add story field to rolls table (roll-level narrative)
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS story TEXT;

-- Full-text search index on captions
CREATE INDEX IF NOT EXISTS idx_roll_photos_caption
  ON roll_photos USING gin(to_tsvector('english', caption))
  WHERE caption IS NOT NULL;

-- ================================================================
-- Notification History (for cron deduplication)
-- ================================================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notification_history_user
  ON notification_history (user_id, notification_type, sent_at DESC);

ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification history" ON notification_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
