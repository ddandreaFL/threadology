-- Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Junction table (many-to-many)
CREATE TABLE collection_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  piece_id uuid REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  position integer DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, piece_id)
);

-- RLS policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections: owner all" ON collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "collections: public read" ON collections
  FOR SELECT USING (true);

CREATE POLICY "collection_pieces: owner all" ON collection_pieces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "collection_pieces: public read" ON collection_pieces
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_pieces_collection_id ON collection_pieces(collection_id);
CREATE INDEX idx_collection_pieces_piece_id ON collection_pieces(piece_id);
