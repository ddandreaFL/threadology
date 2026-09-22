-- ============================================================
-- Threadology — reactions on a shared fit
-- ============================================================
--
-- A fit that someone sends you is the one place in the app where a reply
-- makes sense, so reactions live on fits and nowhere else. The model is the
-- one the product asked for: a small set of emoji, dropped on someone's fit
-- card, visible to everyone else holding the same link.
--
-- Access is the token, not a follow. Anyone who can open the link can react,
-- provided they are signed in — an account is what makes a reaction
-- attributable and undoable, and it is the one thing a link alone cannot
-- give. A signed-out visitor sees the counts and is asked to sign in.

create table if not exists public.fit_reactions (
  id         uuid primary key default gen_random_uuid(),
  fit_id     uuid not null references public.fits (id)      on delete cascade,
  user_id    uuid not null references public.users (id)     on delete cascade,
  emoji      text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (fit_id, user_id, emoji)
);

create index if not exists fit_reactions_fit_idx on public.fit_reactions (fit_id);

alter table public.fit_reactions enable row level security;

-- No policies: every read and write goes through the security-definer
-- functions below, which check the share token first. A client holding the
-- anon key can reach nothing here directly.


-- ============================================================
-- NOTIFICATIONS GAIN FITS
-- ============================================================
-- The table was written for saves out of a vault or collection. A reaction is
-- the second thing worth telling an owner about, so container_type learns
-- 'fit' and a kind column says which event a row is. Existing rows are saves.

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
  add constraint notifications_kind_check check (kind in ('save', 'reaction'));


-- ============================================================
-- READ
-- ============================================================

-- The reaction summary for a fit, as the viewer holding this token sees it:
-- one row per emoji with its count, and whether this viewer is in it.
create or replace function public.fit_reaction_summary(p_fit_id uuid)
returns jsonb
language sql security definer set search_path = public, extensions stable as $$
  select coalesce(jsonb_agg(x order by x.count desc, x.emoji), '[]'::jsonb)
    from (
      select emoji,
             count(*)::int                                     as count,
             bool_or(user_id = auth.uid())                     as mine
        from public.fit_reactions
       where fit_id = p_fit_id
       group by emoji
    ) x;
$$;

-- shared_fit gains two things: the reactions, and who the viewer is relative
-- to this fit. The viewer block is what lets a client send an owner opening
-- their own link to their own screen instead of the visitor page.
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
      'id',      v_fit.id,
      'slug',    v_fit.slug,
      'title',   v_fit.title,
      'caption', v_fit.caption,
      'date',    v_fit.date,
      'photos',  v_fit.photos
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


-- The owner's own view of their fit. Reactions that only the people holding
-- the link can see would be pointless: the person they are for is the owner,
-- and the owner reaches their fit by id, not by token.
create or replace function public.fit_reactions_for_owner(p_fit_id uuid)
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

  return public.fit_reaction_summary(p_fit_id);
end;
$$;


-- ============================================================
-- WRITE
-- ============================================================

-- Toggle one emoji on the fit this token opens. The token is checked the same
-- way the read path checks it, so a reaction cannot be aimed at a fit the
-- caller was never given — the fit id never comes from the client.
--
-- Returns the fresh summary, so a client never has to guess what its own tap
-- did to the counts.
create or replace function public.react_to_fit(
  p_token text,
  p_emoji text
)
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

  select * into v_fit
    from public.fits
   where share_token = p_token
     and visibility = 'link_only';

  if not found then
    raise exception 'link is not active';
  end if;

  -- A password-gated fit still reacts: the client only reaches this call
  -- after the same function that unlocked the page returned its contents.

  delete from public.fit_reactions
   where fit_id = v_fit.id and user_id = auth.uid() and emoji = p_emoji;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.fit_reactions (fit_id, user_id, emoji)
    values (v_fit.id, auth.uid(), p_emoji)
    on conflict do nothing;

    -- Tell the owner, but not about themselves, and not twice for the same
    -- emoji: an unreact/react cycle should not ring the bell again.
    if v_fit.user_id <> auth.uid() then
      insert into public.notifications
        (user_id, container_type, container_id, kind, actor_id, emoji)
      select v_fit.user_id, 'fit', v_fit.id, 'reaction', auth.uid(), p_emoji
       where not exists (
         select 1 from public.notifications
          where user_id = v_fit.user_id
            and container_id = v_fit.id
            and kind = 'reaction'
            and actor_id = auth.uid()
            and emoji = p_emoji
       );
    end if;
  end if;

  return public.fit_reaction_summary(v_fit.id);
end;
$$;


-- ============================================================
-- GRANTS
-- ============================================================
-- Replacing a function resets its privileges, so shared_fit is re-granted
-- here. Reacting needs an account; the summary helper is internal.

grant execute on function public.shared_fit(text, text) to anon, authenticated;

revoke execute on function public.fit_reaction_summary(uuid) from public, anon, authenticated;
revoke execute on function public.react_to_fit(text, text)   from public, anon;
grant  execute on function public.react_to_fit(text, text)   to authenticated;

revoke execute on function public.fit_reactions_for_owner(uuid) from public, anon;
grant  execute on function public.fit_reactions_for_owner(uuid) to authenticated;
