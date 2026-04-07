-- ============================================================
-- Security fixes — run in Supabase SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 1. Restrict is_premium self-grant
--
-- The broad UPDATE policy on public.users lets any authenticated
-- user set is_premium = true on their own row via the REST API.
-- Revoke the broad grant and replace with column-level privileges
-- so only bio, avatar_url, and username are user-writable.
-- is_premium must only be flipped by a service-role webhook.
-- ------------------------------------------------------------

REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (username, bio, avatar_url) ON public.users TO authenticated;


-- ------------------------------------------------------------
-- 2. Remove overly permissive fits policy
--
-- The public_read_policies.sql migration added USING (true) on
-- fits, exposing private fits to anyone. Remove it. The original
-- "fits: public read" policy (visibility IN ('link_only', 'public'))
-- from schema.sql is sufficient and should already exist.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "fits are publicly readable" ON public.fits;

-- Recreate the scoped policy if it was somehow dropped.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'fits'
      AND policyname = 'fits: public read'
  ) THEN
    CREATE POLICY "fits: public read"
      ON public.fits FOR SELECT
      USING (visibility IN ('link_only', 'public'));
  END IF;
END $$;
