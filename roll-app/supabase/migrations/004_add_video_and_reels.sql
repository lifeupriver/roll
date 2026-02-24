-- ============================================
-- Video support: extend photos table
-- ============================================

ALTER TABLE photos ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'photo'
  CHECK (media_type IN ('photo', 'video'));

ALTER TABLE photos ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

ALTER TABLE photos ADD COLUMN IF NOT EXISTS duration_category TEXT
  CHECK (duration_category IN (NULL, 'flash', 'moment', 'scene'));

ALTER TABLE photos ADD COLUMN IF NOT EXISTS preview_storage_key TEXT;

ALTER TABLE photos ADD COLUMN IF NOT EXISTS audio_classification TEXT
  CHECK (audio_classification IN (NULL, 'speech', 'music', 'ambient', 'silent'));

ALTER TABLE photos ADD COLUMN IF NOT EXISTS stabilization_score REAL;

-- Extend filter_reason for video-specific reasons
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_filter_reason_check;
ALTER TABLE photos ADD CONSTRAINT photos_filter_reason_check
  CHECK (filter_reason IN (NULL, 'blur', 'screenshot', 'duplicate', 'exposure', 'document', 'accidental', 'screen_recording', 'too_shaky'));

-- Index for video content mode queries
CREATE INDEX IF NOT EXISTS idx_photos_user_video ON photos(user_id) WHERE media_type = 'video' AND filter_status = 'visible';

-- ============================================
-- Reels table (parallel to rolls)
-- ============================================

CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'ready', 'processing', 'developed', 'error')),
  film_profile TEXT
    CHECK (film_profile IN (NULL, 'warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern')),
  audio_mood TEXT NOT NULL DEFAULT 'original'
    CHECK (audio_mood IN ('original', 'quiet_film', 'silent_film', 'ambient')),
  reel_size TEXT NOT NULL DEFAULT 'short'
    CHECK (reel_size IN ('short', 'standard', 'feature')),
  target_duration_ms INTEGER NOT NULL DEFAULT 60000,
  current_duration_ms INTEGER NOT NULL DEFAULT 0,
  clip_count INTEGER NOT NULL DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  clips_processed INTEGER DEFAULT 0,
  correction_skipped_count INTEGER DEFAULT 0,
  assembled_storage_key TEXT,
  poster_storage_key TEXT,
  assembled_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reels_user ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_user_status ON reels(user_id, status);

ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reels" ON reels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reels" ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reels" ON reels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reels" ON reels FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Reel clips table (parallel to roll_photos)
-- ============================================

CREATE TABLE IF NOT EXISTS reel_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id),
  position INTEGER NOT NULL,
  trim_start_ms INTEGER NOT NULL DEFAULT 0,
  trim_end_ms INTEGER,
  trimmed_duration_ms INTEGER NOT NULL,
  processed_storage_key TEXT,
  correction_applied BOOLEAN DEFAULT true,
  transition_type TEXT NOT NULL DEFAULT 'crossfade'
    CHECK (transition_type IN ('crossfade', 'cut', 'dip_to_black')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_reel_clip UNIQUE(reel_id, photo_id),
  CONSTRAINT uq_reel_position UNIQUE(reel_id, position)
);

CREATE INDEX IF NOT EXISTS idx_reel_clips_reel ON reel_clips(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_clips_photo ON reel_clips(photo_id);

ALTER TABLE reel_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own reel clips" ON reel_clips FOR SELECT
  USING (EXISTS (SELECT 1 FROM reels WHERE reels.id = reel_clips.reel_id AND reels.user_id = auth.uid()));
CREATE POLICY "Users can insert own reel clips" ON reel_clips FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM reels WHERE reels.id = reel_clips.reel_id AND reels.user_id = auth.uid()));
CREATE POLICY "Users can update own reel clips" ON reel_clips FOR UPDATE
  USING (EXISTS (SELECT 1 FROM reels WHERE reels.id = reel_clips.reel_id AND reels.user_id = auth.uid()));
CREATE POLICY "Users can delete own reel clips" ON reel_clips FOR DELETE
  USING (EXISTS (SELECT 1 FROM reels WHERE reels.id = reel_clips.reel_id AND reels.user_id = auth.uid()));

-- ============================================
-- Favorite reels table
-- ============================================

CREATE TABLE IF NOT EXISTS favorite_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_favorite_reel UNIQUE(user_id, reel_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_reels_user ON favorite_reels(user_id);

ALTER TABLE favorite_reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorite reels" ON favorite_reels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorite reels" ON favorite_reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorite reels" ON favorite_reels FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Extend circle_posts for reel sharing
-- ============================================

ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'photos'
  CHECK (post_type IN ('photos', 'reel'));

ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS reel_storage_key TEXT;
ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS reel_poster_key TEXT;
ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS reel_duration_ms INTEGER;
