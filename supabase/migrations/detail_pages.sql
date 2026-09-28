-- ============================================================
-- Threadology — piece & fit detail redesign
-- ============================================================
--
-- The redesigned detail pages show four things the database did not yet hand
-- out:
--
--   1. Views on a fit. fits.view_count has existed since the start and nothing
--      ever counted; record_fit_view() is the counter, called once per open
--      of a shared fit link.
--   2. Who reacted. The apps already call fit_reactors_for_owner(), but no
--      migration defined it, so the owner's "who" row fell back to nothing.
--   3. Where a fit was worn. shared_fit() gains location, which the fit
--      editors now write.
--   4. A shared piece's context. shared_piece() gains the date it was added,
--      the fits it was worn in and the collections it is in — each only when
--      that fit or collection is itself shared by link, carrying its own
--      token, exactly as shared_vault() already lists them. Nothing reaches a
--      visitor that a link to it has not already given out.
--
-- Safe to run before or after the app and web builds that read these: every
-- caller treats a missing field or a failed call as "nothing to show".


-- ============================================================
-- VIEWS
-- ============================================================

-- One open of a shared fit link. The owner opening their own link is not a
-- view. Anyone else — signed in or not — is, since the link is the audience.
-- Returns nothing: the count is the owner's to see, not the viewer's.
create or replace function public.record_fit_view(p_token text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.fits
     set view_count = view_count + 1
   where share_token = p_token
     and visibility = 'link_only'
     and (auth.uid() is null or user_id <> auth.uid());
end;
$$;

revoke execute on function public.record_fit_view(text) from public;
grant  execute on function public.record_fit_view(text) to anon, authenticated;


-- ============================================================
-- WHO REACTED (owner only)
-- ============================================================

-- One row per reaction, newest first: the handle, their avatar, the emoji and
-- when. Empty for anyone but the fit's owner.
create or replace function public.fit_reactors_for_owner(p_fit_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.fits where id = p_fit_id and user_id = auth.uid()
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select u.username, u.avatar_url, r.emoji, r.created_at
          from public.fit_reactions r
          join public.users u on u.id = r.user_id
         where r.fit_id = p_fit_id
      ) x
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.fit_reactors_for_owner(uuid) from public, anon;
grant  execute on function public.fit_reactors_for_owner(uuid) to authenticated;


-- ============================================================
-- SHARED FIT: + location
-- ============================================================
-- Replaced wholesale; differs from fit_reactions.sql only by location in the
-- fit block.

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
    'viewer', jsonb_build_object(
      'signed_in', auth.uid() is not null,
      'is_owner',  auth.uid() is not null and auth.uid() = v_fit.user_id
    ),
    'fit', jsonb_build_object(
      'id',       v_fit.id,
      'slug',     v_fit.slug,
      'title',    v_fit.title,
      'caption',  v_fit.caption,
      'date',     v_fit.date,
      'location', v_fit.location,
      'photos',   v_fit.photos
    ),
    'reactions', public.fit_reaction_summary(v_fit.id),
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

grant execute on function public.shared_fit(text, text) to anon, authenticated;


-- ============================================================
-- SHARED PIECE: + added on, worn in, collections
-- ============================================================
-- Replaced wholesale; differs from stage_three_made_in.sql by created_at and
-- the two lists at the end.

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
      'made_in',        v_piece.made_in,
      'story',          v_piece.story,
      'photos',         v_piece.photos,
      'materials',      v_piece.materials,
      'acquired_where', v_piece.acquired_where,
      'acquired_at',    v_piece.acquired_at,
      'created_at',     v_piece.created_at
    ),
    -- Only fits that are themselves out by link, each with its own token, so
    -- opening one goes through shared_fit() and its own password if it has
    -- one. The same rule shared_vault() lists them by.
    'worn_in', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.date desc nulls last)
        from (
          select ft.id, ft.slug, ft.title, ft.date, ft.photos[1] as photo, ft.share_token
            from public.fits ft
            join public.fit_pieces fp on fp.fit_id = ft.id
           where fp.piece_id = v_piece.id
             and ft.visibility = 'link_only'
             and ft.share_token is not null
        ) f
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.name)
        from (
          select cl.id, cl.name, cl.slug, cl.share_token
            from public.collections cl
            join public.collection_pieces cp on cp.collection_id = cl.id
           where cp.piece_id = v_piece.id
             and cl.visibility = 'link_only'
             and cl.share_token is not null
        ) c
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.shared_piece(text, text) to anon, authenticated;
