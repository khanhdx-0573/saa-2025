-- toggle_kudos_like + the Kudos Live Board read RPCs (get_kudos_feed,
-- get_highlight_kudos, get_spotlight_nodes, get_kudos_detail, get_kudos_stats).
-- Heart counts and stats are derived from kudos_likes at query time (BR-02) —
-- no denormalized counter column.
--
-- build_kudos_card is a private helper (not part of the public RPC contract)
-- shared by get_kudos_feed / get_highlight_kudos / get_kudos_detail to keep the
-- card-shaping logic DRY across all three.

create or replace function public.build_kudos_card(p_kudos_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', k.id,
    'title', k.title,
    'content', k.content,
    'created_at', k.created_at,
    'is_anonymous', k.is_anonymous,
    'anonymous_display_name', k.anonymous_display_name,
    'sender', case when k.sender_id is null then null else jsonb_build_object(
      'id', sp.id,
      'full_name', sp.full_name,
      'avatar_url', sp.avatar_url,
      'department', sp.department
    ) end,
    'recipient', jsonb_build_object(
      'id', rp.id,
      'full_name', rp.full_name,
      'avatar_url', rp.avatar_url,
      'department', rp.department
    ),
    'hashtags', coalesce((
      select jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name) order by h.id)
      from public.kudos_hashtags kh
      join public.hashtags h on h.id = kh.hashtag_id
      where kh.kudos_id = k.id
    ), '[]'::jsonb),
    'images', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', ki.id, 'storage_path', ki.storage_path, 'position', ki.position)
        order by ki.position
      )
      from public.kudos_images ki
      where ki.kudos_id = k.id
    ), '[]'::jsonb),
    'heart_count', (select count(*) from public.kudos_likes kl where kl.kudos_id = k.id),
    'liked_by_me', exists (
      select 1 from public.kudos_likes kl2 where kl2.kudos_id = k.id and kl2.user_id = auth.uid()
    ),
    'sender_received_count', case when k.sender_id is null then null
      else (select count(*) from public.kudos rk where rk.recipient_id = k.sender_id) end,
    'recipient_received_count', (select count(*) from public.kudos rk2 where rk2.recipient_id = k.recipient_id)
  )
  from public.kudos k
  join public.profiles rp on rp.id = k.recipient_id
  left join public.profiles sp on sp.id = k.sender_id
  where k.id = p_kudos_id;
$$;

grant execute on function public.build_kudos_card(uuid) to authenticated;

-- toggle_kudos_like: the only write path for kudos_likes.
-- SECURITY DEFINER — self-like guard (BR-04) enforced server-side regardless
-- of client input; idempotent insert/delete toggle (BR-05 uniqueness comes
-- from the composite PK); returns the fresh { liked, heart_count } state.
create or replace function public.toggle_kudos_like(p_kudos_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid;
  v_liked boolean;
  v_heart_count int;
begin
  select sender_id into v_sender_id from public.kudos where id = p_kudos_id;

  if not found then
    raise exception 'kudos not found';
  end if;

  if v_sender_id = auth.uid() then
    raise exception 'cannot like your own kudos';
  end if;

  delete from public.kudos_likes
    where kudos_id = p_kudos_id and user_id = auth.uid();

  if found then
    v_liked := false;
  else
    insert into public.kudos_likes (kudos_id, user_id)
    values (p_kudos_id, auth.uid());
    v_liked := true;
  end if;

  select count(*) into v_heart_count from public.kudos_likes where kudos_id = p_kudos_id;

  return jsonb_build_object('liked', v_liked, 'heart_count', v_heart_count);
end;
$$;

grant execute on function public.toggle_kudos_like(uuid) to authenticated;

-- get_kudos_feed: paginated, filterable card feed for the All Kudos section.
-- NULL filter params = no filter on that dimension.
create or replace function public.get_kudos_feed(
  p_hashtag_id bigint default null,
  p_department text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(public.build_kudos_card(f.id) order by f.created_at desc, f.id desc), '[]'::jsonb)
  from (
    select k.id, k.created_at
    from public.kudos k
    join public.profiles r on r.id = k.recipient_id
    where (p_hashtag_id is null or exists (
            select 1 from public.kudos_hashtags kh where kh.kudos_id = k.id and kh.hashtag_id = p_hashtag_id
          ))
      and (p_department is null or r.department = p_department)
    order by k.created_at desc, k.id desc
    limit p_limit
    offset p_offset
  ) f;
$$;

grant execute on function public.get_kudos_feed(bigint, text, int, int) to authenticated;

-- get_highlight_kudos: top-5 kudos by heart_count, event-wide (BR-01).
create or replace function public.get_highlight_kudos(
  p_hashtag_id bigint default null,
  p_department text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(public.build_kudos_card(f.id) order by f.heart_count desc, f.created_at desc, f.id desc),
    '[]'::jsonb
  )
  from (
    select k.id, k.created_at,
      (select count(*) from public.kudos_likes kl where kl.kudos_id = k.id) as heart_count
    from public.kudos k
    join public.profiles r on r.id = k.recipient_id
    where (p_hashtag_id is null or exists (
            select 1 from public.kudos_hashtags kh where kh.kudos_id = k.id and kh.hashtag_id = p_hashtag_id
          ))
      and (p_department is null or r.department = p_department)
    order by heart_count desc, k.created_at desc, k.id desc
    limit 5
  ) f;
$$;

grant execute on function public.get_highlight_kudos(bigint, text) to authenticated;

-- get_spotlight_nodes: per-recipient aggregate for the Spotlight board.
-- total_kudos is the event-wide count (FR-011 header), independent of the
-- filter; nodes[] is grouped over the (optionally filtered) kudos set.
create or replace function public.get_spotlight_nodes(
  p_hashtag_id bigint default null,
  p_department text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with filtered as (
    select k.id, k.recipient_id, k.created_at
    from public.kudos k
    join public.profiles r on r.id = k.recipient_id
    where (p_hashtag_id is null or exists (
            select 1 from public.kudos_hashtags kh where kh.kudos_id = k.id and kh.hashtag_id = p_hashtag_id
          ))
      and (p_department is null or r.department = p_department)
  ),
  grouped as (
    select recipient_id, count(*) as received_count, max(created_at) as last_received_at
    from filtered
    group by recipient_id
  ),
  last_kudos as (
    select distinct on (recipient_id) recipient_id, id as last_kudos_id
    from filtered
    order by recipient_id, created_at desc, id desc
  )
  select jsonb_build_object(
    'total_kudos', (select count(*) from public.kudos),
    'nodes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'recipient_id', g.recipient_id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'received_count', g.received_count,
        'last_received_at', g.last_received_at,
        'last_kudos_id', lk.last_kudos_id
      ) order by g.received_count desc, g.recipient_id)
      from grouped g
      join public.profiles p on p.id = g.recipient_id
      join last_kudos lk on lk.recipient_id = g.recipient_id
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_spotlight_nodes(bigint, text) to authenticated;

-- get_kudos_detail: single full card, or null when the id does not exist
-- (FR-017 404 handling is done by the caller on a null result).
create or replace function public.get_kudos_detail(p_kudos_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select case when exists (select 1 from public.kudos where id = p_kudos_id)
    then public.build_kudos_card(p_kudos_id)
    else null
  end;
$$;

grant execute on function public.get_kudos_detail(uuid) to authenticated;

-- get_kudos_stats: sidebar stats for one profile (BR-03). Anonymous kudos
-- (sender_id null) never match `k.sender_id = p_user_id`, so they are
-- excluded from "hearts" for free.
create or replace function public.get_kudos_stats(p_user_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'received', (select count(*) from public.kudos where recipient_id = p_user_id),
    'sent', (select count(*) from public.kudos where sender_id = p_user_id),
    'hearts', (
      select count(*)
      from public.kudos_likes kl
      join public.kudos k on k.id = kl.kudos_id
      where k.sender_id = p_user_id
    )
  );
$$;

grant execute on function public.get_kudos_stats(uuid) to authenticated;
