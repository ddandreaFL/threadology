-- ============================================================
-- Threadology — estimated value lives in one place
-- ============================================================
--
-- The second half of move_estimated_value.sql. That migration copied every
-- estimated value into piece_private and left pieces.estimated_value behind
-- because the web still read and wrote it. Since then the app has edited
-- piece_private and the web has edited pieces, so the two have drifted.
--
-- RUN ORDER: only after the web build that writes piece_private is live on
-- Vercel. The previous web build writes pieces.estimated_value on every edit
-- and would start failing the moment the column is gone.
--
-- Preview what the sync below will do before running it:
--
--   select p.id, p.estimated_value as web_value, pp.estimated_value as app_value
--     from pieces p
--     left join piece_private pp on pp.piece_id = p.id
--    where p.estimated_value is not null
--      and pp.estimated_value is distinct from p.estimated_value;


-- ============================================================
-- SYNC
-- ============================================================
-- piece_private wins where it has a value: the app is where values are
-- being edited, and it has been the source of truth since the move. A value
-- only the web ever set is carried across rather than lost.

insert into public.piece_private (piece_id, estimated_value)
select p.id, p.estimated_value
  from public.pieces p
 where p.estimated_value is not null
on conflict (piece_id) do update
  set estimated_value = excluded.estimated_value
  where public.piece_private.estimated_value is null;


-- ============================================================
-- DROP
-- ============================================================
-- No function, view or trigger reads the column; the shared_* reads never
-- returned it. What a collector thinks a piece is worth now sits only
-- behind piece_private's owner-only policy.

alter table public.pieces drop column if exists estimated_value;
