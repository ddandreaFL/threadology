-- ============================================================
-- Threadology — Stage 2: saving a link, and the inbox that follows
-- ============================================================
--
-- Stage 1 made a link readable. This makes it keepable.
--
-- Saving is the only reason a visitor needs an account, so it is the only
-- thing in the product that asks for one. Three consequences shape what
-- follows:
--
--   1. You can only save what you were given. Every save resolves its
--      container from the token, never from an id the client supplies, so
--      the save path cannot reach further than the read path.
--
--   2. A saved link has to keep working. The token is unguessable and the
--      saver already holds it in their URL, so the save stores a copy. If
--      the owner unshares, the token stops resolving and the saved row goes
--      quiet on its own — no separate revocation to keep in step.
--
--   3. Notifications are the payoff for saving, so they are generated where
--      the additions happen — in triggers on the tables the owner writes —
--      rather than by anything the client has to remember to call.


-- ============================================================
-- SAVES
-- ============================================================

alter table public.saves drop constraint if exists saves_container_type_check;
alter table public.saves
  add constraint saves_container_type_check
  check (container_type in ('vault', 'collection', 'fit'));

alter table public.saves
  -- The link as it was handed over. Reopening a saved container needs it,
  -- and the saver is already holding it.
  add column if not exists share_token text,
  -- Denormalised so the owner's fan-out and "who saved my collection" do not
  -- have to branch on container type to find the person being notified.
  add column if not exists owner_id uuid references public.users (id) on delete cascade;

create index if not exists saves_owner_idx on public.saves (owner_id);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================
--
-- Three kinds, which is the whole set:
--
--   addition — pieces landed in something you saved. The reason to save.
--   reaction — someone reacted to your fit. Added with reactions.
--   save     — someone kept something of yours. The signal that sharing
--              went somewhere, and the only one that is purely social.
--
-- A notification is a row per (recipient, container, kind, actor) inside a
-- window, not per event. Five pieces added over an afternoon is one line in
-- an inbox; five lines is a reason to turn the inbox off.

alter table public.notifications
  add column if not exists kind text not null default 'save',
  add column if not exists actor_id uuid references public.users (id) on delete cascade,
  add column if not exists emoji text;

alter table public.notifications drop constraint if exists notifications_container_type_check;
alter table public.notifications
  add constraint notifications_container_type_check
  check (container_type in ('vault', 'collection', 'fit'));

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('addition', 'reaction', 'save'));

-- Rows written before this migration were additions to a saved container;
-- the old default called them 'save', which now means something else.
update public.notifications set kind = 'addition' where kind = 'save' and actor_id is null;
alter table public.notifications alter column kind set default 'addition';

create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

-- No insert policy: every write comes from a security-definer function or a
-- trigger below. A client cannot put a line in someone else's inbox.


-- ============================================================
-- RESOLVING A CONTAINER FROM ITS TOKEN
-- ============================================================

-- One place that turns a token into (container id, owner). Returns nothing
-- when the token is unknown or the container is no longer shared, which is
-- what makes an unshared link unsaveable as well as unreadable.
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
  end if;
end;
$$;


-- ============================================================
-- SAVING
-- ============================================================

-- Save the container this token opens. Idempotent: saving twice is saving.
--
-- p_notify is the bell, not the save. It defaults off for a vault — someone
-- else's whole archive gaining a piece is often just Tuesday — and on for a
-- collection or a fit, which are chosen and finite.
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

  v_notify := coalesce(p_notify, p_container_type <> 'vault');

  insert into public.saves (user_id, container_type, container_id, notify, share_token, owner_id)
  values (auth.uid(), p_container_type, v_container, v_notify, p_token, v_owner)
  on conflict (user_id, container_type, container_id) do update
     set notify      = excluded.notify,
         share_token = excluded.share_token,
         owner_id    = excluded.owner_id;

  -- Tell the owner someone kept it — once per person per container. A save,
  -- an unsave and a save again is not three pieces of news.
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

create or replace function public.unsave_container(
  p_container_type text,
  p_container_id   uuid
)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.saves
   where user_id = auth.uid()
     and container_type = p_container_type
     and container_id = p_container_id;

  return jsonb_build_object('saved', false);
end;
$$;

-- What this viewer's relationship to the link is, without re-reading the
-- container. Kept out of the shared_* functions so the public read path stays
-- one query and one shape whether or not anyone is signed in.
create or replace function public.my_save_state(
  p_container_type text,
  p_token          text
)
returns jsonb
language plpgsql security definer set search_path = public, extensions stable as $$
declare
  v_container uuid;
  v_owner     uuid;
  v_save      public.saves%rowtype;
begin
  select container_id, owner_id into v_container, v_owner
    from public.resolve_share_token(p_container_type, p_token);

  if v_container is null then
    return jsonb_build_object('signed_in', auth.uid() is not null);
  end if;

  select * into v_save
    from public.saves
   where user_id = auth.uid()
     and container_type = p_container_type
     and container_id = v_container;

  return jsonb_build_object(
    'signed_in',    auth.uid() is not null,
    'is_owner',     auth.uid() is not null and auth.uid() = v_owner,
    'container_id', v_container,
    'saved',        found,
    'notify',       coalesce(v_save.notify, false)
  );
end;
$$;

-- The saver's own shelf. Each row carries the token it was saved with, so
-- opening it goes back through the same gate it came through — and a row
-- whose link has since been switched off comes back marked inactive rather
-- than disappearing without explanation.
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
        end as title,
        case s.container_type
          when 'collection' then c.slug
          when 'fit'        then f.slug
        end as slug,
        case s.container_type
          when 'fit' then f.photos[1]
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
        end as active
      from public.saves s
      join public.users o on o.id = s.owner_id
      left join public.collections c on s.container_type = 'collection' and c.id = s.container_id
      left join public.fits f        on s.container_type = 'fit'        and f.id = s.container_id
     where s.user_id = auth.uid()
    ) r;

  return v_rows;
end;
$$;


-- ============================================================
-- FAN-OUT: PIECES LANDING IN SOMETHING SOMEONE SAVED
-- ============================================================

-- Adds to an existing unread line inside the window instead of writing a new
-- one, which is what turns "12 additions" into one inbox row that reads
-- "12 pieces added". Three hours is the spec's starting guess and the only
-- number here worth revisiting with real usage.
create or replace function public.notify_savers(
  p_container_type text,
  p_container_id   uuid,
  p_actor          uuid,
  p_count          integer default 1
)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_window constant interval := interval '3 hours';
begin
  -- Coalesce into the recipient's existing unread line for this container.
  update public.notifications n
     set piece_count = n.piece_count + p_count,
         created_at  = now()
   where n.kind = 'addition'
     and n.container_type = p_container_type
     and n.container_id = p_container_id
     and n.read_at is null
     and n.created_at > now() - v_window
     and n.user_id in (
       select s.user_id from public.saves s
        where s.container_type = p_container_type
          and s.container_id = p_container_id
          and s.notify
          and s.user_id <> p_actor
     );

  -- Everyone else who is subscribed and does not already have an open line.
  insert into public.notifications
    (user_id, container_type, container_id, kind, actor_id, piece_count)
  select s.user_id, p_container_type, p_container_id, 'addition', p_actor, p_count
    from public.saves s
   where s.container_type = p_container_type
     and s.container_id = p_container_id
     and s.notify
     and s.user_id <> p_actor
     and not exists (
       select 1 from public.notifications n
        where n.user_id = s.user_id
          and n.kind = 'addition'
          and n.container_type = p_container_type
          and n.container_id = p_container_id
          and n.read_at is null
          and n.created_at > now() - v_window
     );
end;
$$;

-- A piece added to a vault. Private pieces never announce themselves: a
-- notification naming a piece nobody can open is worse than silence.
create or replace function public.tg_piece_added()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.is_private then
    return new;
  end if;
  perform public.notify_savers('vault', new.user_id, new.user_id, 1);
  return new;
end;
$$;

drop trigger if exists pieces_notify_savers on public.pieces;
create trigger pieces_notify_savers
  after insert on public.pieces
  for each row execute function public.tg_piece_added();

-- A piece added to a collection. The same piece can legitimately produce two
-- lines — one for the vault, one for the collection — because they are two
-- different things to have saved.
create or replace function public.tg_collection_piece_added()
returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_owner   uuid;
  v_private boolean;
begin
  select user_id into v_owner from public.collections where id = new.collection_id;
  select is_private into v_private from public.pieces where id = new.piece_id;

  if coalesce(v_private, true) then
    return new;
  end if;

  perform public.notify_savers('collection', new.collection_id, v_owner, 1);
  return new;
end;
$$;

drop trigger if exists collection_pieces_notify_savers on public.collection_pieces;
create trigger collection_pieces_notify_savers
  after insert on public.collection_pieces
  for each row execute function public.tg_collection_piece_added();


-- ============================================================
-- THE INBOX
-- ============================================================

-- One call, everything a row needs to render and to open: who did it, what
-- it happened to, a thumbnail, and the token for the containers the reader
-- reaches through a link rather than by owning them.
--
-- An 'addition' opens through the token stored on the reader's own save. A
-- 'reaction' or a 'save' is about something the reader owns, so it opens on
-- their own screen and carries no token at all.
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
        end as title,
        case n.container_type
          when 'collection' then c.slug
          when 'fit'        then f.slug
        end as slug,
        co.username as owner_username,
        case n.container_type
          when 'fit' then f.photos[1]
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
      left join public.users co on co.id = case
        when n.container_type = 'vault'      then n.container_id
        when n.container_type = 'collection' then c.user_id
        when n.container_type = 'fit'        then f.user_id
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

create or replace function public.unread_notification_count()
returns integer
language sql security definer set search_path = public, extensions stable as $$
  select count(*)::int
    from public.notifications
   where user_id = auth.uid() and read_at is null;
$$;

-- Null marks everything read, which is what opening the inbox does. Ids are
-- there for marking one line read on tap without clearing the rest.
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null
     and (p_ids is null or id = any(p_ids));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ============================================================
-- GRANTS
-- ============================================================
-- Everything here needs an account. resolve_share_token and notify_savers are
-- internal: they are called from inside definer functions and triggers, which
-- run with the owner's rights, so no client needs to reach them.

revoke execute on function public.resolve_share_token(text, text)            from public, anon, authenticated;
revoke execute on function public.notify_savers(text, uuid, uuid, integer)   from public, anon, authenticated;
revoke execute on function public.tg_piece_added()                           from public, anon, authenticated;
revoke execute on function public.tg_collection_piece_added()                from public, anon, authenticated;

revoke execute on function public.save_container(text, text, boolean) from public, anon;
revoke execute on function public.unsave_container(text, uuid)        from public, anon;
revoke execute on function public.my_save_state(text, text)           from public, anon;
revoke execute on function public.my_saves()                          from public, anon;
revoke execute on function public.notification_feed(integer, timestamptz) from public, anon;
revoke execute on function public.unread_notification_count()         from public, anon;
revoke execute on function public.mark_notifications_read(uuid[])     from public, anon;

grant execute on function public.save_container(text, text, boolean) to authenticated;
grant execute on function public.unsave_container(text, uuid)        to authenticated;
grant execute on function public.my_save_state(text, text)           to authenticated;
grant execute on function public.my_saves()                          to authenticated;
grant execute on function public.notification_feed(integer, timestamptz) to authenticated;
grant execute on function public.unread_notification_count()         to authenticated;
grant execute on function public.mark_notifications_read(uuid[])     to authenticated;
