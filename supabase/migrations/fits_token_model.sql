-- ============================================================
-- Threadology — fits join the token model (decision B1)
-- ============================================================
--
-- Fits had their own visibility column, their own enumerable read policy, and
-- their own web path. Closing the enumeration hole dropped that policy, which
-- left fits owner-only and fit sharing dead. This puts them on the same
-- footing as vaults and collections: a token in the URL, checked by a
-- security-definer function, with no blanket anon read anywhere.
--
-- fit_visibility keeps its own enum rather than moving to
-- container_visibility. The values line up for the states that matter
-- ('private', 'link_only'), the column is live, and rebuilding a type in use
-- buys nothing here. 'public' stays a member and is treated as unshared by
-- the function below — discoverable is a separate future state and nothing
-- should reach it by accident.

alter table public.fits
  add column if not exists share_token   text,
  add column if not exists password_hash text;

create unique index if not exists fits_share_token_key
  on public.fits (share_token) where share_token is not null;


-- ============================================================
-- TOKEN-GATED READ
-- ============================================================

-- Mirrors shared_vault and shared_collection. Returns null when the token is
-- unknown or the fit is no longer shared, so a dead link leaks neither the
-- owner nor the fit's existence.
--
-- The piece breakdown is the reason this page exists, so it comes back with
-- the fit — filtered by the same rule containers use: a piece that is marked
-- private never crosses, whichever container reaches it.
create or replace function public.shared_fit(
  p_token    text,
  p_password text default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_fit   public.fits%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_fit
    from public.fits
   where share_token = p_token
     and visibility = 'link_only';

  if not found then
    return null;
  end if;

  if v_fit.password_hash is not null
     and (p_password is null or crypt(p_password, v_fit.password_hash) <> v_fit.password_hash)
  then
    return jsonb_build_object('password_required', true);
  end if;

  select * into v_owner from public.users where id = v_fit.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object(
      'username',   v_owner.username,
      'avatar_url', v_owner.avatar_url,
      'bio',        v_owner.bio
    ),
    'fit', jsonb_build_object(
      'id',      v_fit.id,
      'slug',    v_fit.slug,
      'title',   v_fit.title,
      'caption', v_fit.caption,
      'date',    v_fit.date,
      'photos',  v_fit.photos
    ),
    'pieces', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.layer_order)
        from (
          select p.id, p.brand, p.type, p.name, p.year, p.season, p.size,
                 p.condition, p.photos, fp.layer_order
            from public.fit_pieces fp
            join public.pieces p on p.id = fp.piece_id
           where fp.fit_id = v_fit.id
             and p.is_private = false
        ) x
    ), '[]'::jsonb)
  );
end;
$$;


-- ============================================================
-- OWNER MUTATORS
-- ============================================================

-- rotate_share_link and set_share_password gain a 'fit' container type. Both
-- are replaced wholesale rather than overloaded, so there is one definition
-- of each to reason about.
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
  elsif p_container_type = 'fit' then
    update public.fits
       set share_token = v_token
     where id = p_container_id and user_id = auth.uid();
    if not found then
      raise exception 'fit not found';
    end if;
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
  else
    raise exception 'unknown container type: %', p_container_type;
  end if;
end;
$$;


-- ============================================================
-- GRANTS
-- ============================================================
-- Replacing a function resets its privileges, so the read grants and the
-- revokes have to be restated here or anon regains the mutators.

grant execute on function public.shared_fit(text, text) to anon, authenticated;

revoke execute on function public.rotate_share_link(text, uuid)        from public, anon;
revoke execute on function public.set_share_password(text, uuid, text) from public, anon;
grant  execute on function public.rotate_share_link(text, uuid)        to authenticated;
grant  execute on function public.set_share_password(text, uuid, text) to authenticated;
