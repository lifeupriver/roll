-- Migration 004: Extend collections table for books/albums
-- Adds columns needed by the book API routes

ALTER TABLE collections ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'album';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS photo_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS captions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(user_id, type, created_at DESC);
