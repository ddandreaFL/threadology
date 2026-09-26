-- ============================================================
-- Threadology — no paywall
-- ============================================================
--
-- Decision 2026-09-26: no piece or collection limits, no premium, no
-- upgrade flow, on the web or in the app.
--
-- The 25-piece limit lived here as well as in both apps: a trigger that
-- refused the 26th insert for anyone without is_premium, whichever client
-- sent it. Dropping it is what actually lifts the limit.
--
-- is_premium and stripe_customer_id stay on public.users, unused, so a
-- future change of model needs no data brought back. my_stripe_customer_id()
-- stays too; nothing calls it once the billing routes are gone.

drop trigger if exists enforce_piece_limit on public.pieces;
drop function if exists public.enforce_piece_limit();

-- Check: expect false.
select exists (select 1 from pg_trigger where tgname = 'enforce_piece_limit') as limit_trigger_still_there;
