-- Add orientation and audio settings to reels table
ALTER TABLE reels
  ADD COLUMN IF NOT EXISTS orientation text NOT NULL DEFAULT 'horizontal',
  ADD COLUMN IF NOT EXISTS ambient_audio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS transcribe_audio boolean NOT NULL DEFAULT false;

-- Add audio_enabled to reel_clips table
ALTER TABLE reel_clips
  ADD COLUMN IF NOT EXISTS audio_enabled boolean NOT NULL DEFAULT true;
