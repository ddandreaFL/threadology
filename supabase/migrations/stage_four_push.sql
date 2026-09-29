-- ============================================================
-- Threadology — Stage 4: push notifications
-- ============================================================
--
-- The inbox is only news if someone opens it. This sends each new
-- notification to the recipient's phones as a push, through Expo's push
-- service.
--
-- Grouping comes for free: notifications are already a row per
-- (recipient, container, kind, actor) inside a window — five pieces added
-- over an afternoon update one open row rather than adding five — so a push
-- goes out only when a row is inserted, never when one is updated.
--
-- Delivery is asynchronous (pg_net queues the request), so a slow push
-- service can never hold up the save, reaction or addition that caused it.
--
-- Run order: this migration, then the app build that includes
-- expo-notifications. Builds without it simply never register a token.


-- ============================================================
-- TOKENS
-- ============================================================

create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  platform   text,
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens: owner read" on public.push_tokens;
create policy "push_tokens: owner read"
  on public.push_tokens for select
  using (user_id = auth.uid());

-- Registration goes through a function rather than a direct insert: a phone
-- that changes hands between accounts carries its token to the new one,
-- and a row policy could not move a row the caller does not own.
create or replace function public.register_push_token(p_token text, p_platform text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_token is null or p_token !~ '^ExponentPushToken\[.+\]$' then
    raise exception 'not an Expo push token';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant  execute on function public.register_push_token(text, text) to authenticated;


-- ============================================================
-- SENDING
-- ============================================================

create extension if not exists pg_net with schema extensions;

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
  else
    select username into v_owner from public.users where id = new.container_id;
  end if;

  -- Same sentence the inbox shows.
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

  -- Additions reopen through the recipient's own saved link.
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
  -- A push is a courtesy; it must never undo the notification itself.
  return new;
end;
$$;

drop trigger if exists push_on_notification on public.notifications;
create trigger push_on_notification
  after insert on public.notifications
  for each row execute function public.tg_push_notification();

revoke execute on function public.tg_push_notification() from public, anon, authenticated;

notify pgrst, 'reload schema';
