-- ============================================================
-- Threadology — Friends: mutual, request and accept
-- ============================================================
--
-- Until now access was the link, not a relationship: you saw what you were
-- sent. This adds the first relationship, and it is mutual on purpose — a
-- request, an accept, and only then does either side see the other's
-- archive. Decisions (2026-09-29):
--
--   · Mutual friends, not a one-way follow.
--   · A friend sees everything that is not marked private: every piece
--     except is_private ones, every collection, every fit. Price paid and
--     estimated value (piece_private) never cross, as with links.
--   · Anyone signed in can open a profile, but a non-friend sees only the
--     avatar, @name, bio and the button to ask.
--
-- Every read and write goes through security-definer functions keyed on
-- auth.uid(); the table's own policy only lets each side see its rows.
--
-- Run after profile_overhaul.sql (notification_feed and the push trigger are
-- replaced here with the friend kinds added).


-- ============================================================
-- THE TABLE
-- ============================================================

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users (id) on delete cascade,
  addressee_id uuid not null references public.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever way round it was asked.
create unique index if not exists friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships: own rows" on public.friendships;
create policy "friendships: own rows"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
-- No insert, update or delete policies: the functions below are the only writers.


-- ============================================================
-- HELPERS
-- ============================================================

create or replace function public.is_friend(p_a uuid, p_b uuid)
returns boolean
language sql security definer set search_path = public, extensions stable as $$
  select exists (
    select 1 from public.friendships
     where status = 'accepted'
       and least(requester_id, addressee_id) = least(p_a, p_b)
       and greatest(requester_id, addressee_id) = greatest(p_a, p_b)
  );
$$;

-- Can the signed-in viewer see this owner's archive? Themselves, or a friend.
create or replace function public.can_see_archive(p_owner uuid)
returns boolean
language sql security definer set search_path = public, extensions stable as $$
  select auth.uid() is not null and (auth.uid() = p_owner or public.is_friend(auth.uid(), p_owner));
$$;

-- 'self' | 'friends' | 'requested' (you asked) | 'incoming' (they asked) | 'none'
create or replace function public.relationship_with(p_other uuid)
returns text
language sql security definer set search_path = public, extensions stable as $$
  select case
    when auth.uid() is null then 'none'
    when auth.uid() = p_other then 'self'
    else coalesce((
      select case
               when f.status = 'accepted' then 'friends'
               when f.requester_id = auth.uid() then 'requested'
               else 'incoming'
             end
        from public.friendships f
       where least(f.requester_id, f.addressee_id) = least(auth.uid(), p_other)
         and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_other)
    ), 'none')
  end;
$$;


-- ============================================================
-- NOTIFICATIONS: two new kinds, about a person
-- ============================================================
-- A friend notification is about a person, not a container, so it gets its
-- own container type: 'user', whose id is the other person.

alter table public.notifications drop constraint if exists notifications_container_type_check;
alter table public.notifications
  add constraint notifications_container_type_check
  check (container_type in ('vault', 'collection', 'fit', 'piece', 'user'));

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('addition', 'reaction', 'save', 'friend_request', 'friend_accepted'));


-- ============================================================
-- ASKING, ANSWERING, ENDING
-- ============================================================

create or replace function public.send_friend_request(p_username text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_other uuid;
  v_row   public.friendships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into v_other from public.users where lower(username) = lower(p_username);
  if v_other is null then
    raise exception 'no such user';
  end if;
  if v_other = auth.uid() then
    raise exception 'cannot friend yourself';
  end if;

  select * into v_row from public.friendships
   where least(requester_id, addressee_id) = least(auth.uid(), v_other)
     and greatest(requester_id, addressee_id) = greatest(auth.uid(), v_other);

  if found then
    -- They already asked you: asking back is accepting.
    if v_row.status = 'pending' and v_row.addressee_id = auth.uid() then
      return public.respond_friend_request(p_username, true);
    end if;
    return jsonb_build_object('relationship', public.relationship_with(v_other));
  end if;

  insert into public.friendships (requester_id, addressee_id) values (auth.uid(), v_other);

  insert into public.notifications (user_id, container_type, container_id, kind, actor_id)
  values (v_other, 'user', auth.uid(), 'friend_request', auth.uid());

  return jsonb_build_object('relationship', 'requested');
end;
$$;

create or replace function public.respond_friend_request(p_username text, p_accept boolean)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_other uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into v_other from public.users where lower(username) = lower(p_username);
  if v_other is null then
    raise exception 'no such user';
  end if;

  -- The request, now answered, is no longer news.
  update public.notifications
     set read_at = coalesce(read_at, now())
   where user_id = auth.uid() and kind = 'friend_request' and actor_id = v_other;

  if p_accept then
    update public.friendships
       set status = 'accepted', accepted_at = now()
     where requester_id = v_other and addressee_id = auth.uid() and status = 'pending';
    if found then
      insert into public.notifications (user_id, container_type, container_id, kind, actor_id)
      values (v_other, 'user', auth.uid(), 'friend_accepted', auth.uid());
    end if;
  else
    delete from public.friendships
     where requester_id = v_other and addressee_id = auth.uid() and status = 'pending';
  end if;

  return jsonb_build_object('relationship', public.relationship_with(v_other));
end;
$$;

-- Unfriend, or take back a request you sent. Either way the pair is gone.
create or replace function public.remove_friend(p_username text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_other uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into v_other from public.users where lower(username) = lower(p_username);
  if v_other is null then
    raise exception 'no such user';
  end if;

  delete from public.friendships
   where least(requester_id, addressee_id) = least(auth.uid(), v_other)
     and greatest(requester_id, addressee_id) = greatest(auth.uid(), v_other);

  -- A request taken back should not sit in their inbox.
  delete from public.notifications
   where user_id = v_other and kind = 'friend_request' and actor_id = auth.uid();

  return jsonb_build_object('relationship', 'none');
end;
$$;

-- Your friends, and the requests either way, newest first.
create or replace function public.my_friends()
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object('username', u.username, 'avatar_url', u.avatar_url, 'since', f.accepted_at)
                       order by f.accepted_at desc)
        from public.friendships f
        join public.users u on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
       where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('username', u.username, 'avatar_url', u.avatar_url, 'since', f.created_at)
                       order by f.created_at desc)
        from public.friendships f
        join public.users u on u.id = f.requester_id
       where f.status = 'pending' and f.addressee_id = auth.uid()
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('username', u.username, 'avatar_url', u.avatar_url, 'since', f.created_at)
                       order by f.created_at desc)
        from public.friendships f
        join public.users u on u.id = f.addressee_id
       where f.status = 'pending' and f.requester_id = auth.uid()
    ), '[]'::jsonb)
  );
end;
$$;


-- ============================================================
-- READING SOMEONE ELSE
-- ============================================================

-- A person, by @name. Everyone signed in gets the card; a friend (or you)
-- also gets the archive: pieces that are not private, collections, fits.
create or replace function public.user_profile(p_username text)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_user public.users%rowtype;
  v_rel  text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select * into v_user from public.users where lower(username) = lower(p_username);
  if not found then
    return null;
  end if;

  v_rel := public.relationship_with(v_user.id);

  if not public.can_see_archive(v_user.id) then
    return jsonb_build_object(
      'user', jsonb_build_object('username', v_user.username, 'avatar_url', v_user.avatar_url, 'bio', v_user.bio, 'created_at', v_user.created_at),
      'relationship', v_rel
    );
  end if;

  return jsonb_build_object(
    'user', jsonb_build_object('username', v_user.username, 'avatar_url', v_user.avatar_url, 'bio', v_user.bio, 'created_at', v_user.created_at),
    'relationship', v_rel,
    'pieces', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'brand', p.brand, 'type', p.type, 'name', p.name, 'photo', p.photos[1])
                       order by p.created_at desc)
        from public.pieces p
       where p.user_id = v_user.id and p.is_private = false
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'name', c.name,
               'count', (select count(*) from public.collection_pieces cp join public.pieces p on p.id = cp.piece_id
                          where cp.collection_id = c.id and p.is_private = false),
               'photo', (select p.photos[1] from public.collection_pieces cp join public.pieces p on p.id = cp.piece_id
                          where cp.collection_id = c.id and p.is_private = false order by p.created_at desc limit 1)
             ) order by c.position nulls last, c.created_at)
        from public.collections c
       where c.user_id = v_user.id
    ), '[]'::jsonb),
    'fits', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'title', f.title, 'date', f.date, 'photo', f.photos[1])
                       order by f.date desc nulls last, f.created_at desc)
        from public.fits f
       where f.user_id = v_user.id
    ), '[]'::jsonb)
  );
end;
$$;

-- The three detail reads, gated by friendship. Same shapes as shared_piece,
-- shared_fit and shared_collection, so the apps render them with the same
-- screens; the lists inside carry ids rather than tokens, because a friend
-- opens them the same way.

create or replace function public.friend_piece(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_piece public.pieces%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_piece from public.pieces where id = p_id;
  if not found or v_piece.is_private or not public.can_see_archive(v_piece.user_id) then
    return null;
  end if;
  select * into v_owner from public.users where id = v_piece.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object('username', v_owner.username, 'avatar_url', v_owner.avatar_url),
    'viewer', jsonb_build_object('signed_in', true, 'is_owner', auth.uid() = v_piece.user_id),
    'piece', jsonb_build_object(
      'id', v_piece.id, 'brand', v_piece.brand, 'type', v_piece.type, 'name', v_piece.name,
      'year', v_piece.year, 'season', v_piece.season, 'size', v_piece.size,
      'condition', v_piece.condition, 'made_in', v_piece.made_in, 'story', v_piece.story,
      'photos', v_piece.photos, 'created_at', v_piece.created_at
    ),
    'worn_in', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'title', f.title, 'date', f.date, 'photo', f.photos[1])
                       order by f.date desc nulls last)
        from public.fits f join public.fit_pieces fp on fp.fit_id = f.id
       where fp.piece_id = v_piece.id
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.name)
        from public.collections c join public.collection_pieces cp on cp.collection_id = c.id
       where cp.piece_id = v_piece.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.friend_fit(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_fit   public.fits%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_fit from public.fits where id = p_id;
  if not found or not public.can_see_archive(v_fit.user_id) then
    return null;
  end if;
  select * into v_owner from public.users where id = v_fit.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object('username', v_owner.username, 'avatar_url', v_owner.avatar_url),
    'viewer', jsonb_build_object('signed_in', true, 'is_owner', auth.uid() = v_fit.user_id),
    'fit', jsonb_build_object(
      'id', v_fit.id, 'slug', v_fit.slug, 'title', v_fit.title, 'caption', v_fit.caption,
      'date', v_fit.date, 'location', v_fit.location, 'photos', v_fit.photos
    ),
    'reactions', public.fit_reaction_summary(v_fit.id),
    'pieces', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.layer_order)
        from (
          select p.id, p.brand, p.type, p.name, p.year, p.season, p.size, p.condition, p.photos, fp.layer_order
            from public.fit_pieces fp join public.pieces p on p.id = fp.piece_id
           where fp.fit_id = v_fit.id and p.is_private = false
        ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.friend_collection(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_col   public.collections%rowtype;
  v_owner public.users%rowtype;
begin
  select * into v_col from public.collections where id = p_id;
  if not found or not public.can_see_archive(v_col.user_id) then
    return null;
  end if;
  select * into v_owner from public.users where id = v_col.user_id;

  return jsonb_build_object(
    'owner', jsonb_build_object('username', v_owner.username, 'avatar_url', v_owner.avatar_url, 'bio', v_owner.bio),
    'collection', jsonb_build_object('id', v_col.id, 'name', v_col.name, 'slug', v_col.slug),
    'pieces', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
        from (
          select p.id, p.brand, p.type, p.name, p.year, p.season, p.size, p.condition, p.story, p.photos, p.created_at
            from public.pieces p join public.collection_pieces cp on cp.piece_id = p.id
           where cp.collection_id = v_col.id and p.is_private = false
        ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- Reacting as a friend: the same toggle as react_to_fit, gated by the
-- friendship instead of a token.
create or replace function public.react_to_friend_fit(p_fit_id uuid, p_emoji text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_fit     public.fits%rowtype;
  v_deleted int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_emoji is null or char_length(p_emoji) < 1 or char_length(p_emoji) > 16 then
    raise exception 'invalid reaction';
  end if;

  select * into v_fit from public.fits where id = p_fit_id;
  if not found or v_fit.user_id = auth.uid() or not public.is_friend(auth.uid(), v_fit.user_id) then
    raise exception 'not allowed';
  end if;

  delete from public.fit_reactions
   where fit_id = v_fit.id and user_id = auth.uid() and emoji = p_emoji;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.fit_reactions (fit_id, user_id, emoji)
    values (v_fit.id, auth.uid(), p_emoji)
    on conflict do nothing;

    insert into public.notifications (user_id, container_type, container_id, kind, actor_id, emoji)
    select v_fit.user_id, 'fit', v_fit.id, 'reaction', auth.uid(), p_emoji
     where not exists (
       select 1 from public.notifications
        where user_id = v_fit.user_id and container_id = v_fit.id
          and kind = 'reaction' and actor_id = auth.uid() and emoji = p_emoji
     );
  end if;

  return public.fit_reaction_summary(v_fit.id);
end;
$$;


-- ============================================================
-- THE INBOX, WITH PEOPLE
-- ============================================================
-- notification_feed from profile_overhaul.sql plus the 'user' container:
-- the title is empty and the person is the actor.

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
          when 'user'  then a.avatar_url
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
        when n.container_type in ('vault', 'user') then n.container_id
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

-- The push, with the friend kinds. Same as profile_overhaul.sql otherwise.
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
    when 'friend_request' then
      '@' || coalesce(v_actor, 'someone') || ' wants to be friends'
    when 'friend_accepted' then
      '@' || coalesce(v_actor, 'someone') || ' accepted your friend request'
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
                      'actor_username', v_actor,
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


-- ============================================================
-- GRANTS
-- ============================================================

revoke execute on function public.is_friend(uuid, uuid)          from public, anon, authenticated;
revoke execute on function public.can_see_archive(uuid)          from public, anon, authenticated;
revoke execute on function public.relationship_with(uuid)        from public, anon, authenticated;
revoke execute on function public.tg_push_notification()         from public, anon, authenticated;

revoke execute on function public.send_friend_request(text)             from public, anon;
revoke execute on function public.respond_friend_request(text, boolean) from public, anon;
revoke execute on function public.remove_friend(text)                   from public, anon;
revoke execute on function public.my_friends()                          from public, anon;
revoke execute on function public.user_profile(text)                    from public, anon;
revoke execute on function public.friend_piece(uuid)                    from public, anon;
revoke execute on function public.friend_fit(uuid)                      from public, anon;
revoke execute on function public.friend_collection(uuid)               from public, anon;
revoke execute on function public.react_to_friend_fit(uuid, text)       from public, anon;

grant execute on function public.send_friend_request(text)             to authenticated;
grant execute on function public.respond_friend_request(text, boolean) to authenticated;
grant execute on function public.remove_friend(text)                   to authenticated;
grant execute on function public.my_friends()                          to authenticated;
grant execute on function public.user_profile(text)                    to authenticated;
grant execute on function public.friend_piece(uuid)                    to authenticated;
grant execute on function public.friend_fit(uuid)                      to authenticated;
grant execute on function public.friend_collection(uuid)               to authenticated;
grant execute on function public.react_to_friend_fit(uuid, text)       to authenticated;

notify pgrst, 'reload schema';
