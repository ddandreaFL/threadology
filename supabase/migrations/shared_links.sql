-- ============================================================
-- Threadology — Shared links, piece privacy, saves
-- Handoff 3 (shared link spec) + the owner-only fields handoff 4 needs.
-- ============================================================
--
-- Two rules from the spec drive the shape of this migration:
--
--   1. Price paid never crosses the public boundary, and there is no toggle.
--      Rather than trust a policy to strip a column, the owner-only fields
--      live in their own table. A stranger cannot read them because they are
--      not in the table a stranger can reach at all.
--
--   2. A viewer can see a piece when it is not marked private AND they can
--      reach at least one container holding it. Reachability is proven by
--      holding the container's share token, so access runs through the
--      security-definer functions at the bottom of this file rather than
--      through a blanket anon SELECT.
--
-- On that second point: "anyone with the link" has to mean the link. A policy
-- of the form `using (visibility = 'link_only')` lets anyone with the anon key
-- list every unlisted container through the REST API without ever holding a
-- URL. The existing `fits: public read` policy has that shape and should be
-- revisited; this migration does not repeat it.


-- ============================================================
-- ENUM
-- ============================================================

-- Deliberately no 'public' member. Discoverable/indexed is a separate future
-- state, and someone sharing a link with one friend must never land in a
-- search result.
--
-- 'invite_only' stays in the type but is not offered in the app: dropping a
-- value from a live enum means rebuilding the type and every column using it,
-- which is not worth doing for an unused member. Nothing grants access
-- through it.
do $$ begin
  create type container_visibility as enum ('private', 'link_only', 'invite_only');
exception when duplicate_object then null;
end $$;


-- ============================================================
-- CONTAINER VISIBILITY
-- ============================================================

-- The vault is not a table: it is everything a user owns, so its visibility
-- lives on the user.
alter table public.users
  add column if not exists vault_visibility    container_visibility not null default 'private',
  add column if not exists vault_share_token   text,
  add column if not exists vault_password_hash text;

alter table public.collections
  add column if not exists visibility    container_visibility not null default 'private',
  add column if not exists share_token   text,
  add column if not exists password_hash text;

create unique index if not exists users_vault_share_token_key
  on public.users (vault_share_token) where vault_share_token is not null;

create unique index if not exists collections_share_token_key
  on public.collections (share_token) where share_token is not null;


-- ============================================================
-- PIECE PRIVACY
-- ============================================================

-- Hides a piece from every shared view regardless of which container it sits
-- in. Added now rather than after links ship: retrofitting it once people have
-- shared URLs is considerably worse.
alter table public.pieces
  add column if not exists is_private boolean not null default false;

-- Public per the field table: provenance crosses the boundary, the price does
-- not. "Thrifted in Tokyo, 2019" is the best part of a collector's record.
alter table public.pieces
  add column if not exists materials      text,
  add column if not exists acquired_where text,
  add column if not exists acquired_at    date;

create index if not exists pieces_is_private_idx on public.pieces (is_private);

-- Owner-only fields, in their own table so that no public read path can reach
-- them even by mistake. Column grants are not row-aware, so granting these on
-- `pieces` would hand them to every signed-in user for every readable row.
create table if not exists public.piece_private (
  piece_id      uuid primary key references public.pieces (id) on delete cascade,
  price_paid    numeric(12,2),
  private_notes text,
  updated_at    timestamptz not null default now()
);

alter table public.piece_private enable row level security;

drop policy if exists "piece_private: owner all" on public.piece_private;
create policy "piece_private: owner all"
  on public.piece_private for all
  using (
    exists (
      select 1 from public.pieces p
      where p.id = piece_private.piece_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pieces p
      where p.id = piece_private.piece_id and p.user_id = auth.uid()
    )
  );

-- Note on estimated_value: it predates this spec and stays exactly where it is.
-- It is arguably the same class of data as price paid — market figures the
-- playbook says Threadology does not publish — but the spec does not call for
-- moving it, the app reads it today, and dropping a live column is not a
-- decision this migration should make. The shared_* functions below simply do
-- not return it, so it does not cross the boundary either way.


-- ============================================================
-- SAVES AND SUBSCRIPTIONS
-- ============================================================

-- A save is a bookmark; `notify` is the bell on it. For a vault the container
-- is the owner's user id, since the vault has no row of its own.
create table if not exists public.saves (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  container_type text not null check (container_type in ('vault', 'collection')),
  container_id   uuid not null,
  -- Default on, which is the collection case. A vault is everything someone
  -- owns, so an addition is often just Tuesday; the app saves those with the
  -- bell off.
  notify         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (user_id, container_type, container_id)
);

alter table public.saves enable row level security;

drop policy if exists "saves: owner all" on public.saves;
create policy "saves: owner all"
  on public.saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saves_container_idx
  on public.saves (container_type, container_id) where notify;

-- One row per delivered batch. Coalescing additions into a window is delivery
-- logic and lives outside this migration; the three-hour figure in the spec is
-- a starting guess, not a measured value.
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  container_type text not null check (container_type in ('vault', 'collection')),
  container_id   uuid not null,
  piece_count    integer not null default 1,
  created_at     timestamptz not null default now(),
  read_at        timestamptz
);

alter table public.notifications enable row level security;

drop policy if exists "notifications: recipient read" on public.notifications;
create policy "notifications: recipient read"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications: recipient update" on public.notifications;
create policy "notifications: recipient update"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;


-- ============================================================
-- CLOSING AN EXISTING LEAK
-- ============================================================

-- Every collection name in the database is currently readable by anyone
-- holding the anon key, including collections belonging to other users. The
-- two security migrations closed the equivalent holes on pieces and fits and
-- missed this one. Shared collections are served by the functions below, so
-- nothing needs a blanket read.
drop policy if exists "collections: public read" on public.collections;


-- ============================================================
-- TOKEN-GATED READ PATH
-- ============================================================

-- Unguessable token. 32 bytes of randomness, url-safe.
create or replace function public.new_share_token()
returns text language sql volatile set search_path = public, extensions as $$
  select translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
$$;

-- Owner-only. Mints the container's token, which the app calls once the first
-- time link sharing is switched on. Access is governed by visibility alone:
-- switching back to private kills every link immediately, and switching back
-- to link sharing makes the same URL work again. There is no separate revoke,
-- so nothing calls this a second time — but it stays capable of issuing a
-- fresh token if that changes.
create or replace function public.rotate_share_link(
  p_container_type text,
  p_container_id   uuid default null
)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token text := public.new_share_token();
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_container_type = 'vault' then
    update public.users
       set vault_share_token = v_token
     where id = auth.uid();
  elsif p_container_type = 'collection' then
    update public.collections
       set share_token = v_token
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'collection not found';
    end if;
  else
    raise exception 'unknown container type: %', p_container_type;
  end if;

  return v_token;
end;
$$;

-- Owner-only. Passing null clears the password.
create or replace function public.set_share_password(
  p_container_type text,
  p_container_id   uuid,
  p_password       text
)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_hash text := case when p_password is null or p_password = ''
                      then null
                      else crypt(p_password, gen_salt('bf')) end;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_container_type = 'vault' then
    update public.users set vault_password_hash = v_hash where id = auth.uid();
  elsif p_container_type = 'collection' then
    update public.collections
       set password_hash = v_hash
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'collection not found';
    end if;
  else
    raise exception 'unknown container type: %', p_container_type;
  end if;
end;
$$;

-- The public read path. Returns null when the token is unknown, the container
-- is no longer shared, or the password is wrong — the caller cannot tell those
-- apart, so a revoked link leaks neither the owner's name nor a piece count.
--
-- Pieces are filtered by the access rule: not private, and reachable through
-- this container. Owner-only fields are absent by construction, since they
-- live in piece_private and nothing here reads that table.
create or replace function public.shared_vault(
  p_token    text,
  p_password text default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_owner public.users%rowtype;
begin
  select * into v_owner
    from public.users
   where vault_share_token = p_token
     and vault_visibility = 'link_only';

  if not found then
    return null;
  end if;

  if v_owner.vault_password_hash is not null
     and (p_password is null or crypt(p_password, v_owner.vault_password_hash) <> v_owner.vault_password_hash)
  then
    return jsonb_build_object('password_required', true);
  end if;

  return jsonb_build_object(
    'owner', jsonb_build_object(
      'username',   v_owner.username,
      'avatar_url', v_owner.avatar_url,
      'bio',        v_owner.bio
    ),
    'pieces', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
        from (
          select p.id, p.brand, p.type, p.name, p.year, p.season, p.size,
                 p.condition, p.story, p.photos, p.materials,
                 p.acquired_where, p.acquired_at, p.created_at
            from public.pieces p
           where p.user_id = v_owner.id
             and p.is_private = false
        ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.shared_collection(
  p_token    text,
  p_password text default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_col   public.collections%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_col
    from public.collections
   where share_token = p_token
     and visibility = 'link_only';

  if not found then
    return null;
  end if;

  if v_col.password_hash is not null
     and (p_password is null or crypt(p_password, v_col.password_hash) <> v_col.password_hash)
  then
    return jsonb_build_object('password_required', true);
  end if;

  select * into v_owner from public.users where id = v_col.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object(
      'username',   v_owner.username,
      'avatar_url', v_owner.avatar_url,
      'bio',        v_owner.bio
    ),
    'collection', jsonb_build_object('id', v_col.id, 'name', v_col.name, 'slug', v_col.slug),
    'pieces', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
        from (
          select p.id, p.brand, p.type, p.name, p.year, p.season, p.size,
                 p.condition, p.story, p.photos, p.materials,
                 p.acquired_where, p.acquired_at, p.created_at
            from public.pieces p
            join public.collection_pieces cp on cp.piece_id = p.id
           where cp.collection_id = v_col.id
             and p.is_private = false
        ) x
    ), '[]'::jsonb)
  );
end;
$$;


-- ============================================================
-- GRANTS
-- ============================================================

-- Reading a shared container needs no account.
grant execute on function public.shared_vault(text, text)      to anon, authenticated;
grant execute on function public.shared_collection(text, text)  to anon, authenticated;

-- Changing what is shared is always the owner. Revoke from PUBLIC, not from
-- anon: Postgres grants EXECUTE on a new function to PUBLIC, and anon is a
-- member of it, so revoking the role alone leaves the function callable.
-- Both PUBLIC and anon: Supabase grants EXECUTE on public-schema functions to
-- anon directly, so revoking PUBLIC alone leaves that direct grant in place.
revoke execute on function public.rotate_share_link(text, uuid)        from public, anon;
revoke execute on function public.set_share_password(text, uuid, text) from public, anon;
grant  execute on function public.rotate_share_link(text, uuid)        to authenticated;
grant  execute on function public.set_share_password(text, uuid, text) to authenticated;

-- new_share_token is an internal helper; nothing outside these functions calls it.
revoke execute on function public.new_share_token() from public, anon, authenticated;
