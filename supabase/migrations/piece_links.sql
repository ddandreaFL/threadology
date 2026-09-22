-- ============================================================
-- Threadology — a piece gets a link of its own
-- ============================================================
--
-- Until now a piece could only be shared by sharing something that held it:
-- a vault, a collection, a fit. But the thing people actually send each other
-- is one piece — "look at this jacket" — and the app had no honest control
-- for it, which is why the piece screen had no share button while everything
-- around it did.
--
-- Same model as every other container: a visibility state, an unguessable
-- token minted fresh each time sharing is switched on, an optional password,
-- and a security-definer read. Nothing new to reason about.
--
-- One deliberate difference. is_private hides a piece from every *container*
-- view, so a private piece in a shared collection stays out of it. A link
-- aimed at the piece itself is not a container view — it is the owner
-- pointing at one thing on purpose — so it opens. The two flags answer
-- different questions and a share link is the more specific answer.

alter table public.pieces
  add column if not exists visibility    container_visibility not null default 'private',
  add column if not exists share_token   text,
  add column if not exists password_hash text,
  add column if not exists slug          text;

create unique index if not exists pieces_share_token_key
  on public.pieces (share_token) where share_token is not null;

create index if not exists pieces_slug_idx on public.pieces (user_id, slug);


-- A readable, stable path segment. The id tail keeps it unique without a
-- retry loop, and without leaking how many pieces someone owns.
create or replace function public.piece_slug(p_piece public.pieces)
returns text
language sql immutable set search_path = public, extensions as $$
  select trim(both '-' from
    regexp_replace(lower(coalesce(nullif(p_piece.name, ''), p_piece.type, 'piece')), '[^a-z0-9]+', '-', 'g')
  ) || '-' || left(replace(p_piece.id::text, '-', ''), 6);
$$;


-- ============================================================
-- TOKEN-GATED READ
-- ============================================================

-- Public fields only. Price paid is not in this table at all, and estimated
-- value is left behind here as it is everywhere else that crosses the
-- boundary: what a collector paid or thinks it is worth is not part of what
-- they are showing you.
create or replace function public.shared_piece(
  p_token    text,
  p_password text default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_piece public.pieces%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_piece
    from public.pieces
   where share_token = p_token
     and visibility = 'link_only';

  if not found then
    return null;
  end if;

  if v_piece.password_hash is not null
     and (p_password is null or crypt(p_password, v_piece.password_hash) <> v_piece.password_hash)
  then
    return jsonb_build_object('password_required', true);
  end if;

  select * into v_owner from public.users where id = v_piece.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object(
      'username',   v_owner.username,
      'avatar_url', v_owner.avatar_url,
      'bio',        v_owner.bio
    ),
    'viewer', jsonb_build_object(
      'signed_in', auth.uid() is not null,
      'is_owner',  auth.uid() is not null and auth.uid() = v_piece.user_id
    ),
    'piece', jsonb_build_object(
      'id',             v_piece.id,
      'slug',           coalesce(v_piece.slug, public.piece_slug(v_piece)),
      'brand',          v_piece.brand,
      'type',           v_piece.type,
      'name',           v_piece.name,
      'year',           v_piece.year,
      'season',         v_piece.season,
      'size',           v_piece.size,
      'condition',      v_piece.condition,
      'story',          v_piece.story,
      'photos',         v_piece.photos,
      'materials',      v_piece.materials,
      'acquired_where', v_piece.acquired_where,
      'acquired_at',    v_piece.acquired_at
    )
  );
end;
$$;


-- ============================================================
-- OWNER MUTATORS GAIN A PIECE
-- ============================================================
-- Both are replaced wholesale rather than overloaded, so there stays one
-- definition of each to reason about. Minting a piece link also fills in the
-- slug, since the URL needs one and nothing else writes it.

create or replace function public.rotate_share_link(
  p_container_type text,
  p_container_id   uuid default null
)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token text := public.new_share_token();
  v_piece public.pieces%rowtype;
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
  elsif p_container_type = 'fit' then
    update public.fits
       set share_token = v_token
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'fit not found';
    end if;
  elsif p_container_type = 'piece' then
    select * into v_piece
      from public.pieces
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'piece not found';
    end if;
    update public.pieces
       set share_token = v_token,
           slug = coalesce(slug, public.piece_slug(v_piece))
     where id = p_container_id and user_id = auth.uid();
  else
    raise exception 'unknown container type: %', p_container_type;
  end if;

  return v_token;
end;
$$;

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
  elsif p_container_type = 'fit' then
    update public.fits
       set password_hash = v_hash
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'fit not found';
    end if;
  elsif p_container_type = 'piece' then
    update public.pieces
       set password_hash = v_hash
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'piece not found';
    end if;
  else
    raise exception 'unknown container type: %', p_container_type;
  end if;
end;
$$;


-- ============================================================
-- GRANTS
-- ============================================================

grant execute on function public.shared_piece(text, text) to anon, authenticated;
revoke execute on function public.piece_slug(public.pieces) from public, anon;

revoke execute on function public.rotate_share_link(text, uuid)        from public, anon;
revoke execute on function public.set_share_password(text, uuid, text) from public, anon;
grant  execute on function public.rotate_share_link(text, uuid)        to authenticated;
grant  execute on function public.set_share_password(text, uuid, text) to authenticated;
