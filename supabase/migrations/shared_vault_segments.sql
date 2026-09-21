-- ============================================================
-- Threadology — shared_vault returns segments (decision C1)
-- ============================================================
--
-- The shared vault page is the visitor state of the profile, and the profile
-- is segmented: pieces, fits, collections. shared_vault() returned pieces
-- only, so the page could not have been built to the layout it is supposed
-- to share with the app.
--
-- Collections and fits come back with their own share tokens, because a
-- visitor needs them to navigate. This exposes no data the vault token did
-- not already entitle them to: reaching the vault already shows every
-- non-private piece, and only containers the owner has already set to link
-- sharing are listed. A container still private is absent entirely.

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
    ), '[]'::jsonb),
    -- Only what the owner has already chosen to share by link, each with the
    -- token the visitor needs to open it.
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

-- Replacing a function resets its privileges.
grant execute on function public.shared_vault(text, text) to anon, authenticated;
