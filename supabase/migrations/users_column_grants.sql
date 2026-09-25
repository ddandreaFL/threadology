-- ============================================================
-- Threadology — public.users stops leaking its private columns
-- ============================================================
--
-- security_fixes_2.sql (Sep 17) was written and committed but never run.
-- Verified Sep 25 2026 with the anon key and no session: an unauthenticated
-- request to /rest/v1/users returns stripe_customer_id and vault_share_token
-- (and would return vault_password_hash where one is set). A readable
-- vault_share_token lets anyone open any vault shared by link, which defeats
-- the token model the sharing work rests on. my_stripe_customer_id() is also
-- missing, so the web billing portal cannot find a customer.
--
-- This supersedes security_fixes_2.sql — run this one, not that. It does
-- the same column grant, and adds what the vault-sharing work (which landed
-- after security_fixes_2 was written) needs so that grant does not break it:
-- the owner reads and changes their own vault's share settings through
-- SECURITY DEFINER functions scoped to auth.uid(), the same way billing
-- reads the Stripe id.
--
-- Ship order: this migration first, then the app build that calls
-- my_vault_share() / set_vault_visibility(). The current TestFlight build
-- reads the vault columns directly and its vault share sheet will show
-- "private" until updated — a visible regression, not a data one. Its
-- vault visibility switch is very likely already failing: security_fixes.sql
-- limits UPDATE on users to (username, bio, avatar_url).


-- ============================================================
-- 1. READ: six public columns, nothing else
-- ============================================================
-- Column grants are a denylist by omission: any column added after this
-- runs is NOT readable until granted, which is the safe direction.

revoke select on public.users from anon, authenticated;

grant select (id, username, avatar_url, bio, is_premium, created_at)
  on public.users to anon, authenticated;


-- ============================================================
-- 2. OWNER READS: billing id, vault share settings
-- ============================================================
-- Granting these columns to `authenticated` would hand them to every
-- signed-in user for every row — column grants are not row-aware.

create or replace function public.my_stripe_customer_id()
returns text
language sql security definer set search_path = public stable
as $$ select stripe_customer_id from public.users where id = auth.uid() $$;

-- The password itself never leaves the table; only whether one is set.
create or replace function public.my_vault_share()
returns jsonb
language sql security definer set search_path = public stable
as $$
  select jsonb_build_object(
    'visibility',   vault_visibility,
    'token',        vault_share_token,
    'has_password', vault_password_hash is not null
  )
  from public.users
  where id = auth.uid()
$$;


-- ============================================================
-- 3. OWNER WRITE: vault visibility
-- ============================================================
-- rotate_share_link and set_share_password already cover the token and the
-- password. Visibility was the one vault setting still written directly.

create or replace function public.set_vault_visibility(p_visibility container_visibility)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  update public.users set vault_visibility = p_visibility where id = auth.uid();
end;
$$;


-- ============================================================
-- 4. GRANTS
-- ============================================================
-- Revoke from PUBLIC and anon both: Postgres grants EXECUTE on a new
-- function to PUBLIC, and Supabase grants it to anon directly.

revoke execute on function public.my_stripe_customer_id()                      from public, anon;
revoke execute on function public.my_vault_share()                             from public, anon;
revoke execute on function public.set_vault_visibility(container_visibility)   from public, anon;
grant  execute on function public.my_stripe_customer_id()                      to authenticated;
grant  execute on function public.my_vault_share()                             to authenticated;
grant  execute on function public.set_vault_visibility(container_visibility)   to authenticated;


-- ============================================================
-- 5. Guard from security_fixes_2: the blanket pieces policy stays gone
-- ============================================================

drop policy if exists "pieces are publicly readable" on public.pieces;


-- ============================================================
-- CHECK (run after, with the anon key — should be 401/permission denied):
--   GET /rest/v1/users?select=vault_share_token
-- And in the SQL editor:
--   select has_column_privilege('anon', 'public.users', 'vault_share_token', 'select');  -- false
-- ============================================================
