-- Phase 4.3: Collaborative Books
-- Pain Point: #6 (Baby Books)

-- Add collaborative fields to collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES circles(id);

-- Collection contributors table
CREATE TABLE IF NOT EXISTS collection_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_contributors_collection ON collection_contributors (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_contributors_user ON collection_contributors (user_id);

ALTER TABLE collection_contributors ENABLE ROW LEVEL SECURITY;

-- Contributors can see collections they belong to
CREATE POLICY "Contributors can view their collections" ON collection_contributors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Only the collection owner can manage contributors
CREATE POLICY "Owners can manage contributors" ON collection_contributors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collection_contributors cc
      WHERE cc.collection_id = collection_contributors.collection_id
        AND cc.user_id = auth.uid()
        AND cc.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collection_contributors cc
      WHERE cc.collection_id = collection_contributors.collection_id
        AND cc.user_id = auth.uid()
        AND cc.role = 'owner'
    )
  );
