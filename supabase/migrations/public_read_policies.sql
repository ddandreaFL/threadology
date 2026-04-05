-- Allow anyone (including unauthenticated visitors) to read pieces.
-- This powers the public vault page at /vault/[username].
-- Owners already have full access via their existing policy; this adds
-- a separate anon/authenticated SELECT for all rows.
CREATE POLICY "pieces are publicly readable"
  ON pieces
  FOR SELECT
  USING (true);

-- Allow anyone to read fits (for public fit detail pages).
CREATE POLICY "fits are publicly readable"
  ON fits
  FOR SELECT
  USING (true);
