-- Add default_clip_length_s to reels table
ALTER TABLE reels
  ADD COLUMN IF NOT EXISTS default_clip_length_s INTEGER;
