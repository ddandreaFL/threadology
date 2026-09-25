-- ============================================================
-- Threadology — Stage 3: made in becomes a field
-- ============================================================
--
-- The add flow has always asked where a piece was made, but pieces had no
-- column for it, so the answer was written into the story as its first line:
-- "Made in Italy.\n\n<story>". That made it uneditable in any real sense —
-- the edit screen had no field for it, and changing it meant finding and
-- rewriting a sentence the owner never typed.
--
-- This gives it a column, lifts the existing answers out of the story, and
-- adds it to every read that crosses the share boundary, so a shared page
-- does not lose the line when it leaves the story.
--
-- Run order: this migration first, then ship the app build that writes the
-- column. A build still packing the story will keep working — its pieces
-- just carry the old sentence until they are edited.


-- ============================================================
-- COLUMN + BACKFILL
-- ============================================================

alter table public.pieces
  add column if not exists made_in text;

-- The packed form is exactly what the app wrote: "Made in <country>." at the
-- very start, then a blank line if a story followed. Country names on the
-- list carry no full stop, so the first one ends the value.
update public.pieces
   set made_in = substring(story from '^Made in ([^.\n]+)\.'),
       story   = nullif(btrim(regexp_replace(story, '^Made in [^.\n]+\.(\n\n)?', '')), '')
 where made_in is null
   and story ~ '^Made in [^.\n]+\.';


-- ============================================================
-- SHARED READS CARRY IT
-- ============================================================
-- Each is replaced wholesale, as before, and differs from its last
-- definition only by the added made_in field.

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
      'acquired_at',    v_piece.acquired_at
    )
  );
end;
$$;

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
                 p.condition, p.made_in, p.story, p.photos, p.materials,
                 p.acquired_where, p.acquired_at, p.created_at
            from public.pieces p
           where p.user_id = v_owner.id
             and p.is_private = false
        ) x
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.name)
        from (
          select cl.id, cl.name, cl.slug, cl.share_token,
                 (select count(*)
                    from public.collection_pieces cp
                    join public.pieces p on p.id = cp.piece_id
                   where cp.collection_id = cl.id
                     and p.is_private = false) as piece_count,
                 (select coalesce(jsonb_agg(q.photo), '[]'::jsonb) from (
                    select p2.photos[1] as photo
                      from public.collection_pieces cp2
                      join public.pieces p2 on p2.id = cp2.piece_id
                     where cp2.collection_id = cl.id
                       and p2.is_private = false
                       and p2.photos[1] is not null
                     limit 4
                  ) q) as previews
            from public.collections cl
           where cl.user_id = v_owner.id
             and cl.visibility = 'link_only'
             and cl.share_token is not null
        ) c
    ), '[]'::jsonb),
    'fits', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.date desc nulls last)
        from (
          select ft.id, ft.slug, ft.title, ft.date, ft.photos, ft.share_token
            from public.fits ft
           where ft.user_id = v_owner.id
             and ft.visibility = 'link_only'
             and ft.share_token is not null
        ) f
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
                 p.condition, p.made_in, p.story, p.photos, p.materials,
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

-- Replacing a function resets its privileges.
grant execute on function public.shared_piece(text, text)      to anon, authenticated;
grant execute on function public.shared_vault(text, text)      to anon, authenticated;
grant execute on function public.shared_collection(text, text) to anon, authenticated;
