-- ============================================================
-- Threadology — Profile overhaul: pieces are saveable, and the numbers
-- ============================================================
--
-- Two things, run together because the profile's "saved by others" counts
-- pieces:
--
--   1. A piece shared by link can be saved, like a vault, a collection or a
--      fit. Every function that branches on container type learns 'piece'.
--      Nothing is ever added to a piece, so a piece save never subscribes to
--      additions; it exists to keep the link and to tell the owner.
--
--   2. get_profile_stats() — everything the profile page shows, in one call,
--      so the page has one loading state and the app and web count alike.
--
-- Depends on stage_four_push.sql (tg_push_notification is replaced here).
-- Run before shipping any build that calls get_profile_stats.


-- ============================================================
-- 1. PIECES ARE SAVEABLE
-- ============================================================

alter table public.saves drop constraint if exists saves_container_type_check;
alter table public.saves
  add constraint saves_container_type_check
  check (container_type in ('vault', 'collection', 'fit', 'piece'));

alter table public.notifications drop constraint if exists notifications_container_type_check;
alter table public.notifications
  add constraint notifications_container_type_check
  check (container_type in ('vault', 'collection', 'fit', 'piece'));

create or replace function public.resolve_share_token(
  p_container_type text,
  p_token          text
)
returns table (container_id uuid, owner_id uuid)
language plpgsql security definer set search_path = public, extensions stable as $$
begin
  if p_container_type = 'vault' then
    return query
      select u.id, u.id from public.users u
       where u.vault_share_token = p_token
         and u.vault_visibility = 'link_only';
  elsif p_container_type = 'collection' then
    return query
      select c.id, c.user_id from public.collections c
       where c.share_token = p_token
         and c.visibility = 'link_only';
  elsif p_container_type = 'fit' then
    return query
      select f.id, f.user_id from public.fits f
       where f.share_token = p_token
         and f.visibility = 'link_only';
  elsif p_container_type = 'piece' then
    return query
      select p.id, p.user_id from public.pieces p
       where p.share_token = p_token
         and p.visibility = 'link_only';
  end if;
end;
$$;

-- Unchanged from stage two except the notify default: a piece, like a vault,
-- starts with the bell off — and for a piece the bell has nothing to ring for.
create or replace function public.save_container(
  p_container_type text,
  p_token          text,
  p_notify         boolean default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_container uuid;
  v_owner     uuid;
  v_notify    boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select container_id, owner_id into v_container, v_owner
    from public.resolve_share_token(p_container_type, p_token);

  if v_container is null then
    raise exception 'link is not active';
  end if;

  if v_owner = auth.uid() then
    raise exception 'cannot save your own';
  end if;

  v_notify := coalesce(p_notify, p_container_type in ('collection', 'fit'));

  insert into public.saves (user_id, container_type, container_id, notify, share_token, owner_id)
  values (auth.uid(), p_container_type, v_container, v_notify, p_token, v_owner)
  on conflict (user_id, container_type, container_id) do update
     set notify      = excluded.notify,
         share_token = excluded.share_token,
         owner_id    = excluded.owner_id;

  insert into public.notifications (user_id, container_type, container_id, kind, actor_id)
  select v_owner, p_container_type, v_container, 'save', auth.uid()
   where not exists (
     select 1 from public.notifications
      where user_id = v_owner
        and container_id = v_container
        and kind = 'save'
        and actor_id = auth.uid()
   );

  return jsonb_build_object('saved', true, 'notify', v_notify);
end;
$$;

-- The shelf, with pieces. A piece's title is its name, else its type — the
-- same fallback the app uses everywhere a piece has no name.
create or replace function public.my_saves()
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_rows jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(jsonb_agg(r order by r.saved_at desc), '[]'::jsonb) into v_rows
    from (
      select
        s.container_type,
        s.container_id,
        s.share_token,
        s.notify,
        s.created_at as saved_at,
        o.username    as owner_username,
        o.avatar_url  as owner_avatar,
        case s.container_type
          when 'vault'      then o.username || '''s vault'
          when 'collection' then c.name
          when 'fit'        then coalesce(f.title, 'untitled fit')
          when 'piece'      then coalesce(pc.name, pc.type)
        end as title,
        case s.container_type
          when 'collection' then c.slug
          when 'fit'        then f.slug
          when 'piece'      then pc.slug
        end as slug,
        case s.container_type
          when 'fit'   then f.photos[1]
          when 'piece' then pc.photos[1]
          else (
            select p.photos[1]
              from public.pieces p
              left join public.collection_pieces cp on cp.piece_id = p.id
             where p.is_private = false
               and case s.container_type
                     when 'collection' then cp.collection_id = s.container_id
                     else p.user_id = s.container_id
                   end
             order by p.created_at desc
             limit 1
          )
        end as thumbnail,
        case s.container_type
          when 'vault'      then o.vault_visibility = 'link_only'
          when 'collection' then c.visibility = 'link_only'
          when 'fit'        then f.visibility = 'link_only'
          when 'piece'      then pc.visibility = 'link_only'
        end as active
      from public.saves s
      join public.users o on o.id = s.owner_id
      left join public.collections c on s.container_type = 'collection' and c.id = s.container_id
      left join public.fits f        on s.container_type = 'fit'        and f.id = s.container_id
      left join public.pieces pc     on s.container_type = 'piece'      and pc.id = s.container_id
     where s.user_id = auth.uid()
    ) r;

  return v_rows;
end;
$$;

create or replace function public.notification_feed(
  p_limit  integer default 50,
  p_before timestamptz default null
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_rows jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) into v_rows
    from (
      select
        n.id,
        n.kind,
        n.container_type,
        n.container_id,
        n.piece_count,
        n.emoji,
        n.created_at,
        n.read_at,
        a.username   as actor_username,
        a.avatar_url as actor_avatar,
        case n.container_type
          when 'vault'      then co.username || '''s vault'
          when 'collection' then c.name
          when 'fit'        then coalesce(f.title, 'untitled fit')
          when 'piece'      then coalesce(pc.name, pc.type)
        end as title,
        case n.container_type
          when 'collection' then c.slug
          when 'fit'        then f.slug
          when 'piece'      then pc.slug
        end as slug,
        co.username as owner_username,
        case n.container_type
          when 'fit'   then f.photos[1]
          when 'piece' then pc.photos[1]
          else (
            select p.photos[1]
              from public.pieces p
              left join public.collection_pieces cp on cp.piece_id = p.id
             where p.is_private = false
               and case n.container_type
                     when 'collection' then cp.collection_id = n.container_id
                     else p.user_id = n.container_id
                   end
             order by p.created_at desc
             limit 1
          )
        end as thumbnail,
        case when n.kind = 'addition' then s.share_token else null end as share_token
      from public.notifications n
      left join public.users a on a.id = n.actor_id
      left join public.collections c on n.container_type = 'collection' and c.id = n.container_id
      left join public.fits f        on n.container_type = 'fit'        and f.id = n.container_id
      left join public.pieces pc     on n.container_type = 'piece'      and pc.id = n.container_id
      left join public.users co on co.id = case
        when n.container_type = 'vault'      then n.container_id
        when n.container_type = 'collection' then c.user_id
        when n.container_type = 'fit'        then f.user_id
        when n.container_type = 'piece'      then pc.user_id
      end
      left join public.saves s
        on s.user_id = n.user_id
       and s.container_type = n.container_type
       and s.container_id = n.container_id
     where n.user_id = auth.uid()
       and (p_before is null or n.created_at < p_before)
     order by n.created_at desc
     limit least(greatest(p_limit, 1), 100)
    ) r;

  return v_rows;
end;
$$;

-- A deleted piece takes its saves and its notifications with it. Collections
-- and fits leave theirs behind today; a piece is the thing most often
-- deleted, so it starts clean.
create or replace function public.tg_piece_deleted()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from public.saves         where container_type = 'piece' and container_id = old.id;
  delete from public.notifications where container_type = 'piece' and container_id = old.id;
  return old;
end;
$$;

drop trigger if exists pieces_clear_saves on public.pieces;
create trigger pieces_clear_saves
  after delete on public.pieces
  for each row execute function public.tg_piece_deleted();

revoke execute on function public.tg_piece_deleted() from public, anon, authenticated;

-- The push, with pieces. Same as stage_four_push.sql plus the piece branch.
create or replace function public.tg_push_notification()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_messages jsonb;
  v_actor    text;
  v_owner    text;
  v_title    text;
  v_slug     text;
  v_token    text;
  v_body     text;
begin
  if not exists (select 1 from public.push_tokens where user_id = new.user_id) then
    return new;
  end if;

  select username into v_actor from public.users where id = new.actor_id;

  if new.container_type = 'fit' then
    select f.title, f.slug, u.username into v_title, v_slug, v_owner
      from public.fits f join public.users u on u.id = f.user_id
     where f.id = new.container_id;
  elsif new.container_type = 'collection' then
    select c.name, c.slug, u.username into v_title, v_slug, v_owner
      from public.collections c join public.users u on u.id = c.user_id
     where c.id = new.container_id;
  elsif new.container_type = 'piece' then
    select coalesce(p.name, p.type), p.slug, u.username into v_title, v_slug, v_owner
      from public.pieces p join public.users u on u.id = p.user_id
     where p.id = new.container_id;
  else
    select username into v_owner from public.users where id = new.container_id;
  end if;

  v_body := case new.kind
    when 'addition' then
      '@' || coalesce(v_owner, v_actor, 'someone') || ' added ' || coalesce(new.piece_count, 1)
        || case when coalesce(new.piece_count, 1) = 1 then ' piece' else ' pieces' end
        || ' to ' || coalesce(v_title, 'their vault')
    when 'reaction' then
      '@' || coalesce(v_actor, 'someone') || ' reacted ' || coalesce(new.emoji, '')
        || ' to ' || coalesce(v_title, 'your fit')
    else
      '@' || coalesce(v_actor, 'someone') || ' saved '
        || coalesce(v_title, case new.container_type when 'vault' then 'your vault' else 'yours' end)
  end;

  if new.kind = 'addition' then
    select share_token into v_token
      from public.saves
     where user_id = new.user_id
       and container_type = new.container_type
       and container_id = new.container_id;
  end if;

  select jsonb_agg(jsonb_build_object(
           'to',    t.token,
           'title', 'threadology',
           'body',  v_body,
           'sound', 'default',
           'data',  jsonb_build_object(
                      'kind',           new.kind,
                      'container_type', new.container_type,
                      'container_id',   new.container_id,
                      'share_token',    v_token,
                      'owner_username', v_owner,
                      'slug',           v_slug
                    )
         ))
    into v_messages
    from public.push_tokens t
   where t.user_id = new.user_id;

  perform net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    body    := v_messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new;
end;
$$;

revoke execute on function public.tg_push_notification() from public, anon, authenticated;


-- ============================================================
-- 2. THE PROFILE'S NUMBERS
-- ============================================================
--
-- Owner-only: everything is keyed on auth.uid(). Savers and reactors are
-- named because the inbox already names them; nothing here reaches past
-- what the owner's notifications have told them.
--
-- Brands are grouped case- and space-insensitively ("Levi's", "levi's ")
-- and shown in the spelling used most. Types split on " — " the way the app
-- packs them ("Tops — T-Shirt"); a type without the separator is its own
-- category with no subtypes, which is how the app's type picker reads it.

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
  )
  select coalesce(jsonb_agg(jsonb_build_object('type', c.category, 'count', c.n, 'subtypes', c.subs)
                            order by c.n desc, lower(c.category)), '[]'::jsonb)
    into v_types
    from (
      select t1.category, count(*) as n,
             coalesce((
               select jsonb_agg(jsonb_build_object('subtype', s.subtype, 'count', s.n)
                                order by s.n desc, lower(s.subtype))
                 from (select t2.subtype, count(*) as n
                         from t t2
                        where t2.category = t1.category and t2.subtype is not null
                        group by t2.subtype) s
             ), '[]'::jsonb) as subs
        from t t1
       group by t1.category
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
