-- ============================================================
-- Threadology — estimated_value moves to piece_private
-- ============================================================
--
-- It is the same class of data as price paid: market figures the playbook says
-- Threadology does not publish. Today it sits on `pieces`, which means its
-- safety depends on every future query remembering to leave it out — the exact
-- failure mode the separate table exists to prevent.
--
-- This migration does the first half: piece_private gains the column and the
-- existing values are copied across. It deliberately does NOT drop
-- pieces.estimated_value yet.
--
-- Why not: eleven places still read it, including a live Next.js site on
-- Vercel. components/vault/collection-stats.tsx sums it into a total
-- collection value, and app/vault/[username]/page.tsx selects it. Dropping the
-- column now would break those on the next request.
--
-- The drop belongs with the Stage 1 web rewrite, when the public container
-- page is rebuilt on shared_vault(). Two things must be true first:
--
--   1. Nothing reads pieces.estimated_value — the native app reads
--      piece_private after this migration; the web app still does not.
--   2. The rebuilt public page does not show a total value. The current one
--      does, through collection-stats, which would put market data on a page
--      strangers can open.
--
-- Until the drop lands, piece_private.estimated_value is the source of truth
-- for the native app and pieces.estimated_value is a stale copy the web still
-- reads. That split is the reason not to leave this half-done for long.

alter table public.piece_private
  add column if not exists estimated_value numeric(12,2);

insert into public.piece_private (piece_id, estimated_value)
select id, estimated_value
  from public.pieces
 where estimated_value is not null
on conflict (piece_id) do update
  set estimated_value = excluded.estimated_value;
