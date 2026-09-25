-- Read-only. Every row policy that can return collections, fits or pieces,
-- for every role, one per row. Pairs with share_token_exposure.sql.
--
-- Safe: each `rule` is scoped to the owner (auth.uid() = user_id) or to
-- rows that are not carrying a live token. Anything that is just `true`,
-- or lets `authenticated` read other users' rows, exposes share tokens.
select
  tablename            as tbl,
  policyname           as policy,
  array_to_string(roles, ', ') as roles,
  cmd,
  coalesce(qual, 'true') as rule
from pg_policies
where schemaname = 'public'
  and tablename in ('collections', 'fits', 'pieces')
  and cmd in ('SELECT', 'ALL')
order by tablename, policyname;
