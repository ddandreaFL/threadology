-- ============================================================
-- Threadology — Database Schema
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";


-- ============================================================
-- ENUMS
-- ============================================================

create type fit_visibility as enum ('private', 'link_only', 'public');


-- ============================================================
-- TABLES
-- ============================================================

-- users (profile extension of auth.users)
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  is_premium  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- pieces (individual clothing items)
create table public.pieces (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  brand       text not null,
  type        text not null,  -- jacket, shirt, pants, shoes, etc.
  name        text,
  year        text,
  season      text,
  size        text,
  condition   text,
  story       text,
  photos      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- fits (outfits)
create table public.fits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  slug        text not null,
  title       text,
  photos      text[] not null default '{}',
  caption     text,
  date        date,
  location    text,
  visibility  fit_visibility not null default 'private',
  view_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- slug is unique per user
  unique (user_id, slug)
);

-- fit_pieces (junction: which pieces belong to which fit)
create table public.fit_pieces (
  id          uuid primary key default gen_random_uuid(),
  fit_id      uuid not null references public.fits (id) on delete cascade,
  piece_id    uuid not null references public.pieces (id) on delete cascade,
  layer_order integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (fit_id, piece_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index on public.pieces (user_id);
create index on public.fits (user_id);
create index on public.fits (visibility);
create index on public.fit_pieces (fit_id);
create index on public.fit_pieces (piece_id);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pieces_updated_at
  before update on public.pieces
  for each row execute procedure public.handle_updated_at();

create trigger fits_updated_at
  before update on public.fits
  for each row execute procedure public.handle_updated_at();


-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users      enable row level security;
alter table public.pieces     enable row level security;
alter table public.fits       enable row level security;
alter table public.fit_pieces enable row level security;


-- ------------------------------------------------------------
-- users policies
-- ------------------------------------------------------------

-- Anyone can read public profile info
create policy "users: public read"
  on public.users for select
  using (true);

-- Only the owner can update their own profile
create policy "users: owner update"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ------------------------------------------------------------
-- pieces policies
-- ------------------------------------------------------------

-- Owner: full CRUD
create policy "pieces: owner select"
  on public.pieces for select
  using (auth.uid() = user_id);

create policy "pieces: owner insert"
  on public.pieces for insert
  with check (auth.uid() = user_id);

create policy "pieces: owner update"
  on public.pieces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pieces: owner delete"
  on public.pieces for delete
  using (auth.uid() = user_id);

-- Public can view pieces that appear in a viewable fit
create policy "pieces: public read via fit"
  on public.pieces for select
  using (
    exists (
      select 1
      from public.fit_pieces fp
      join public.fits f on f.id = fp.fit_id
      where fp.piece_id = pieces.id
        and f.visibility in ('link_only', 'public')
    )
  );


-- ------------------------------------------------------------
-- fits policies
-- ------------------------------------------------------------

-- Owner: full CRUD
create policy "fits: owner select"
  on public.fits for select
  using (auth.uid() = user_id);

create policy "fits: owner insert"
  on public.fits for insert
  with check (auth.uid() = user_id);

create policy "fits: owner update"
  on public.fits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fits: owner delete"
  on public.fits for delete
  using (auth.uid() = user_id);

-- Public can view link_only and public fits
create policy "fits: public read"
  on public.fits for select
  using (visibility in ('link_only', 'public'));


-- ------------------------------------------------------------
-- fit_pieces policies
-- ------------------------------------------------------------

-- Owner: full CRUD (via fit ownership)
create policy "fit_pieces: owner select"
  on public.fit_pieces for select
  using (
    exists (
      select 1 from public.fits f
      where f.id = fit_pieces.fit_id and f.user_id = auth.uid()
    )
  );

create policy "fit_pieces: owner insert"
  on public.fit_pieces for insert
  with check (
    exists (
      select 1 from public.fits f
      where f.id = fit_pieces.fit_id and f.user_id = auth.uid()
    )
  );

create policy "fit_pieces: owner update"
  on public.fit_pieces for update
  using (
    exists (
      select 1 from public.fits f
      where f.id = fit_pieces.fit_id and f.user_id = auth.uid()
    )
  );

create policy "fit_pieces: owner delete"
  on public.fit_pieces for delete
  using (
    exists (
      select 1 from public.fits f
      where f.id = fit_pieces.fit_id and f.user_id = auth.uid()
    )
  );

-- Public can view fit_pieces for viewable fits
create policy "fit_pieces: public read via fit"
  on public.fit_pieces for select
  using (
    exists (
      select 1 from public.fits f
      where f.id = fit_pieces.fit_id
        and f.visibility in ('link_only', 'public')
    )
  );
