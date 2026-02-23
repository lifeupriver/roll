-- Migration 003: Add collections table
-- User-curated collections of photos (distinct from rolls and favorites)

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  cover_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  photo_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id, created_at DESC);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Junction table: which photos belong to which collections
CREATE TABLE IF NOT EXISTS collection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  position INT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, photo_id),
  UNIQUE(collection_id, position)
);

CREATE INDEX IF NOT EXISTS idx_collection_photos_collection ON collection_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_photo ON collection_photos(photo_id);

ALTER TABLE collection_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own collection photos" ON collection_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_photos.collection_id AND collections.user_id = auth.uid()));
CREATE POLICY "Users can insert own collection photos" ON collection_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_photos.collection_id AND collections.user_id = auth.uid()));
CREATE POLICY "Users can delete own collection photos" ON collection_photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_photos.collection_id AND collections.user_id = auth.uid()));

-- Keep collection.photo_count in sync
CREATE OR REPLACE FUNCTION update_collection_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections SET photo_count = photo_count + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections SET photo_count = photo_count - 1 WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collection_photo_count_trigger
  AFTER INSERT OR DELETE ON collection_photos
  FOR EACH ROW EXECUTE FUNCTION update_collection_photo_count();
