-- ============================================================
-- Threadology — profile stats: one row per type, however it's spelled
-- ============================================================
--
-- get_profile_stats() grouped piece types exactly as typed, so the profile
-- showed "outerwear" and "Outerwear", "T Shirt" and "T-Shirt" as separate
-- rows. Types now group like brands: case, spaces and punctuation ignored,
-- shown in the most-used spelling. Everything else is unchanged from
-- profile_overhaul.sql.

create or replace function public.get_profile_stats()
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_uid uuid := auth.uid();
  v_user jsonb;
  v_brands jsonb;
  v_types jsonb;
  v_reactions jsonb;
  v_saves jsonb;
  v_shared boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
           'username',   u.username,
           'avatar_url', u.avatar_url,
           'bio',        u.bio,
           'created_at', u.created_at
         ),
         u.vault_share_token is not null
    into v_user, v_shared
    from public.users u
   where u.id = v_uid;

  v_shared := coalesce(v_shared, false)
    or exists (select 1 from public.collections where user_id = v_uid and share_token is not null)
    or exists (select 1 from public.fits        where user_id = v_uid and share_token is not null)
    or exists (select 1 from public.pieces      where user_id = v_uid and share_token is not null);

  -- Every brand, not just five: "see all" reads the same list.
  select coalesce(jsonb_agg(jsonb_build_object('brand', b.brand, 'count', b.n)
                            order by b.n desc, lower(b.brand)), '[]'::jsonb)
    into v_brands
    from (
      select mode() within group (order by trim(p.brand)) as brand, count(*) as n
        from public.pieces p
       where p.user_id = v_uid
         and coalesce(trim(p.brand), '') <> ''
       group by lower(regexp_replace(trim(p.brand), '\s+', ' ', 'g'))
    ) b;

  -- Grouped by a key that ignores case, spaces and punctuation, so
  -- "Outerwear"/"outerwear" and "T-Shirt"/"T Shirt" are one row each, shown
  -- in the spelling used most — the same rule as brands.
  with t as (
    select
      case when position(' — ' in p.type) > 0
           then trim(split_part(p.type, ' — ', 1))
           else trim(p.type) end as category,
      case when position(' — ' in p.type) > 0
           then nullif(trim(substr(p.type, position(' — ' in p.type) + 3)), '') end as subtype
      from public.pieces p
     where p.user_id = v_uid
       and coalesce(trim(p.type), '') <> ''
  ),
  k as (
    select category, subtype,
           lower(regexp_replace(category, '[^a-zA-Z0-9]', '', 'g')) as ckey,
           lower(regexp_replace(subtype, '[^a-zA-Z0-9]', '', 'g')) as skey
      from t
  )
  select coalesce(jsonb_agg(jsonb_build_object('type', c.category, 'count', c.n, 'subtypes', c.subs)
                            order by c.n desc, lower(c.category)), '[]'::jsonb)
    into v_types
    from (
      select mode() within group (order by k1.category) as category, count(*) as n,
             coalesce((
               select jsonb_agg(jsonb_build_object('subtype', s.subtype, 'count', s.n)
                                order by s.n desc, lower(s.subtype))
                 from (select mode() within group (order by k2.subtype) as subtype, count(*) as n
                         from k k2
                        where k2.ckey = k1.ckey and k2.subtype is not null
                        group by k2.skey) s
             ), '[]'::jsonb) as subs
        from k k1
       group by k1.ckey
    ) c;

  -- Reactions from other people, on your fits.
  with r as (
    select fr.emoji, fr.fit_id, fr.created_at
      from public.fit_reactions fr
      join public.fits f on f.id = fr.fit_id
     where f.user_id = v_uid
       and fr.user_id <> v_uid
  ),
  top_fit as (
    select r.fit_id, count(*) as n
      from r
     group by r.fit_id
     order by count(*) desc, max(r.created_at) desc
     limit 1
  )
  select jsonb_build_object(
    'total',     (select count(*) from r),
    'fit_count', (select count(distinct fit_id) from r),
    'by_emoji',  coalesce((select jsonb_agg(jsonb_build_object('emoji', e.emoji, 'count', e.n)
                                            order by e.n desc, e.first_at)
                             from (select emoji, count(*) as n, min(created_at) as first_at
                                     from r group by emoji) e), '[]'::jsonb),
    'most_reacted_fit', (
      select jsonb_build_object(
               'id',      f.id,
               'slug',    f.slug,
               'title',   f.title,
               'photo',   f.photos[1],
               'date',    coalesce(f.date::text, f.created_at::date::text),
               'total',   tf.n,
               'by_emoji', (select jsonb_agg(jsonb_build_object('emoji', e.emoji, 'count', e.n)
                                             order by e.n desc)
                              from (select emoji, count(*) as n from r
                                     where r.fit_id = f.id group by emoji) e)
             )
        from top_fit tf
        join public.fits f on f.id = tf.fit_id
    )
  ) into v_reactions;

  -- Saves of your things by other people. Rows whose container is gone are
  -- dropped, so the counts match what can be opened.
  with s as (
    select sv.user_id, sv.container_type, sv.container_id, sv.created_at
      from public.saves sv
     where sv.owner_id = v_uid
       and sv.user_id <> v_uid
       and case sv.container_type
             when 'vault'      then sv.container_id = v_uid
             when 'collection' then exists (select 1 from public.collections c where c.id = sv.container_id)
             when 'fit'        then exists (select 1 from public.fits f where f.id = sv.container_id)
             when 'piece'      then exists (select 1 from public.pieces p where p.id = sv.container_id)
             else false
           end
  ),
  top_item as (
    select s.container_type, s.container_id, count(*) as n
      from s
     group by s.container_type, s.container_id
     order by count(*) desc, max(s.created_at) desc
     limit 1
  )
  select jsonb_build_object(
    'total',       (select count(*) from s),
    'vault',       (select count(*) from s where container_type = 'vault'),
    'collections', (select count(*) from s where container_type = 'collection'),
    'fits',        (select count(*) from s where container_type = 'fit'),
    'pieces',      (select count(*) from s where container_type = 'piece'),
    'saver_count', (select count(distinct user_id) from s),
    'latest_at',   (select max(created_at) from s),
    -- Newest first; the profile shows five, the saver list shows them all.
    'savers', coalesce((
      select jsonb_agg(jsonb_build_object(
               'username',   u.username,
               'avatar_url', u.avatar_url,
               'count',      x.n,
               'latest_at',  x.latest_at
             ) order by x.latest_at desc)
        from (select user_id, count(*) as n, max(created_at) as latest_at
                from s group by user_id
               order by max(created_at) desc
               limit 200) x
        join public.users u on u.id = x.user_id
    ), '[]'::jsonb),
    'most_saved', (
      select jsonb_build_object(
               'kind',  ti.container_type,
               'id',    ti.container_id,
               'count', ti.n,
               'title', case ti.container_type
                          when 'vault'      then 'your vault'
                          when 'collection' then c.name
                          when 'fit'        then coalesce(f.title, 'untitled fit')
                          when 'piece'      then coalesce(p.name, p.type)
                        end,
               'photo', case ti.container_type
                          when 'fit'   then f.photos[1]
                          when 'piece' then p.photos[1]
                          when 'collection' then (
                            select pp.photos[1] from public.pieces pp
                              join public.collection_pieces cp on cp.piece_id = pp.id
                             where cp.collection_id = c.id
                             order by pp.created_at desc limit 1)
                          else (
                            select pp.photos[1] from public.pieces pp
                             where pp.user_id = v_uid
                             order by pp.created_at desc limit 1)
                        end
             )
        from top_item ti
        left join public.collections c on ti.container_type = 'collection' and c.id = ti.container_id
        left join public.fits f        on ti.container_type = 'fit'        and f.id = ti.container_id
        left join public.pieces p      on ti.container_type = 'piece'      and p.id = ti.container_id
    )
  ) into v_saves;

  return jsonb_build_object(
    'user', v_user,
    'totals', jsonb_build_object(
      'pieces',      (select count(*) from public.pieces      where user_id = v_uid),
      'fits',        (select count(*) from public.fits        where user_id = v_uid),
      'collections', (select count(*) from public.collections where user_id = v_uid)
    ),
    'brands', v_brands,
    'types', v_types,
    'reactions', v_reactions,
    'saves', v_saves,
    'shelf_count', (select count(*) from public.saves where user_id = v_uid),
    'unread_count', (select count(*) from public.notifications where user_id = v_uid and read_at is null),
    'latest_notification', public.notification_feed(1) -> 0,
    'has_ever_shared', v_shared
  );
end;
$$;

revoke execute on function public.get_profile_stats() from public, anon;
grant  execute on function public.get_profile_stats() to authenticated;

notify pgrst, 'reload schema';
