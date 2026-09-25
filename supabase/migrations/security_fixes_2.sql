-- SUPERSEDED by users_column_grants.sql (2026-09-25). This file was never
-- run, and running it now would break vault sharing. Run that one instead.

-- ============================================================
-- Security fixes 2 — run in Supabase SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 1. Stop exposing stripe_customer_id on public profiles
--
-- "users: public read" (schema.sql) is USING (true) on purpose:
-- profiles are public. But RLS grants ROWS, not COLUMNS, so every
-- column added to the table since then joined the public set by
-- default. add_stripe_customer_id.sql (Apr 19) added a billing
-- identifier that way.
--
-- Verified Sep 17 2026: an unauthenticated request with the anon
-- key returns id, username, avatar_url, bio, is_premium,
-- created_at, stripe_customer_id.
--
-- Same technique security_fixes.sql used for UPDATE, applied to
-- SELECT. Column grants are a denylist-by-omission: a column added
-- after this runs is NOT granted, which is the safe direction.
-- ------------------------------------------------------------

REVOKE SELECT ON public.users FROM anon, authenticated;

GRANT SELECT (id, username, avatar_url, bio, is_premium, created_at)
  ON public.users TO anon, authenticated;

-- The owner still needs their own billing id (e.g. to open the Stripe
-- portal). Granting it to `authenticated` would hand it to every signed-in
-- user for every row, since column grants are not row-aware. Read it from
-- a SECURITY DEFINER function scoped to the caller instead.
CREATE OR REPLACE FUNCTION public.my_stripe_customer_id()
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $$ SELECT stripe_customer_id FROM public.users WHERE id = auth.uid() $$;

REVOKE EXECUTE ON FUNCTION public.my_stripe_customer_id() FROM anon;
GRANT  EXECUTE ON FUNCTION public.my_stripe_customer_id() TO authenticated;


-- ------------------------------------------------------------
-- 2. Confirm the pieces blanket policy is absent
--
-- public_read_policies.sql (Apr 5) created "pieces are publicly
-- readable" USING (true), which would OR away the scoped
-- "pieces: public read via fit" policy. security_fixes.sql dropped
-- the twin policy on fits but not this one.
--
-- Verified Sep 17 2026 that it is NOT live: an anonymous read of
-- pieces returns 0 rows while collection_pieces returns rows
-- referencing those same pieces, so the table is not merely empty.
-- This DROP is therefore a no-op guard, kept so the policy cannot
-- be reintroduced by re-running the older migration.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "pieces are publicly readable" ON public.pieces;
