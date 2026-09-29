-- ============================================================
-- Threadology — Stage 4: who reacted, for the fit's owner
-- ============================================================
--
-- fit_reactions_for_owner() returns counts per emoji; the owner could see
-- that three people 🔥'd a fit but not who. The rows already carry the
-- reactor. This returns them — to the fit's owner only, like the counts —
-- as the reactor's public profile fields and nothing else.

create or replace function public.fit_reactors_for_owner(p_fit_id uuid)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.fits where id = p_fit_id and user_id = auth.uid()
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'emoji',      r.emoji,
             'username',   u.username,
             'avatar_url', u.avatar_url,
             'created_at', r.created_at
           ) order by r.created_at desc)
      from public.fit_reactions r
      join public.users u on u.id = r.user_id
     where r.fit_id = p_fit_id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.fit_reactors_for_owner(uuid) from public, anon;
grant  execute on function public.fit_reactors_for_owner(uuid) to authenticated;

notify pgrst, 'reload schema';
