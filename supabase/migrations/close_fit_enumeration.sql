-- ============================================================
-- Threadology — close the fit enumeration hole
-- ============================================================
--
-- `fits: public read` is `using (visibility in ('link_only','public'))`, which
-- lets anyone holding the anon key list every unlisted fit through REST
-- without ever being given a URL. The anon key ships inside the app binary, so
-- it is public. This is the exact shape the shared-links work was built to
-- avoid.
--
-- Two more policies share it. `pieces: public read via fit` and
-- `fit_pieces: public read via fit` test the fits table directly, and a policy
-- expression is not itself subject to RLS on the tables it references — so
-- dropping only the fits policy would leave pieces reachable through a shared
-- fit. All three go together or the vector stays open.
--
-- Dropping them removes cross-user viewing of a shared fit. At the time of
-- writing the fits table is empty and there are two accounts, so nothing is
-- actually lost. Restoring it properly means putting fits on the same token
-- model as vaults and collections — one sharing system, and this hole cannot
-- come back — which is a decision still to be made. Until then, fits are owner
-- only.

drop policy if exists "fits: public read"             on public.fits;
drop policy if exists "pieces: public read via fit"   on public.pieces;
drop policy if exists "fit_pieces: public read via fit" on public.fit_pieces;
