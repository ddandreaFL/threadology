-- Read-only. Can an anonymous visitor read share tokens or password hashes
-- on collections, fits or pieces? Reads no row data — only what the anon
-- role is permitted, and which row policies would let it through.
--
-- Safe result: every *_token / *_hash row says false in `anon_can_read`,
-- OR it says true but `anon_row_policies` is empty for that table.

with cols(tbl, col) as (
  values
    ('collections', 'share_token'),
    ('collections', 'password_hash'),
    ('fits',        'share_token'),
    ('fits',        'password_hash'),
    ('pieces',      'share_token'),
    ('pieces',      'password_hash')
)
select
  c.tbl,
  c.col,
  has_column_privilege('anon', format('public.%I', c.tbl), c.col, 'select') as anon_can_read,
  (select string_agg(p.policyname || ' → ' || coalesce(p.qual, 'true'), ' | ')
     from pg_policies p
    where p.schemaname = 'public'
      and p.tablename  = c.tbl
      and p.cmd in ('SELECT', 'ALL')
      and ('anon' = any(p.roles) or 'public' = any(p.roles))) as anon_row_policies
from cols c
order by c.tbl, c.col;
