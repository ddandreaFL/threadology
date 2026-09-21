-- ============================================================
-- Piece limit enforcement via DB trigger
--
-- Replaces application-layer enforcement so the 25-piece cap
-- for free users cannot be bypassed by calling the API directly.
-- Premium users are exempt. Runs as SECURITY DEFINER so it can
-- read public.users regardless of caller role.
-- ============================================================

create or replace function public.enforce_piece_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_is_premium boolean;
  v_piece_count integer;
begin
  select is_premium into v_is_premium
  from public.users
  where id = new.user_id;

  if coalesce(v_is_premium, false) then
    return new;
  end if;

  select count(*) into v_piece_count
  from public.pieces
  where user_id = new.user_id;

  if v_piece_count >= 25 then
    raise exception 'Piece limit reached. Upgrade to Premium for unlimited pieces.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_piece_limit on public.pieces;

create trigger enforce_piece_limit
  before insert on public.pieces
  for each row execute procedure public.enforce_piece_limit();
