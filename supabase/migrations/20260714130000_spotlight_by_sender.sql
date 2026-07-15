-- Spotlight word-cloud switches from grouping by RECIPIENT (who received the
-- most kudos) to grouping by SENDER (who gave the most kudos) — product
-- decision, not a Momorph fidelity fix (the design doesn't dictate either
-- semantic). Anonymous kudos have no sender identity (sender_id is null), so
-- they're excluded from the word-cloud aggregate; they still count toward
-- the ticker below, since that's about the RECIPIENT, who is never null.
--
-- The activity ticker ("{name} đã nhận được một Kudos mới") stays about
-- RECIPIENTS receiving kudos — that phrasing didn't change, only the
-- word-cloud's grouping did — so it can no longer reuse the sender-grouped
-- `nodes` array as its data source (that used to work only because both
-- happened to be recipient-based). `recent_activity` is a new, separate
-- chronological feed of individual kudos-received events, decoupled from
-- the per-sender aggregation.
--
-- `p_department` keeps filtering by the RECIPIENT's department, matching
-- every other board RPC (get_highlight_kudos / get_kudos_feed) — "Department
-- = X" means "kudos received by X", consistently across the whole board;
-- for the Spotlight word-cloud this reads as "who gave kudos to X".
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
    select k.id, k.sender_id, k.recipient_id, k.created_at
    from public.kudos k
    join public.profiles r on r.id = k.recipient_id
    where (p_hashtag_id is null or exists (
            select 1 from public.kudos_hashtags kh where kh.kudos_id = k.id and kh.hashtag_id = p_hashtag_id
          ))
      and (p_department is null or r.department = p_department)
  ),
  sender_grouped as (
    select sender_id, count(*) as sent_count, max(created_at) as last_sent_at
    from filtered
    where sender_id is not null
    group by sender_id
  ),
  last_kudos_by_sender as (
    select distinct on (sender_id) sender_id, id as last_kudos_id
    from filtered
    where sender_id is not null
    order by sender_id, created_at desc, id desc
  ),
  recent_activity as (
    select f.id as kudos_id, f.recipient_id, f.created_at
    from filtered f
    order by f.created_at desc, f.id desc
    limit 20
  )
  select jsonb_build_object(
    'total_kudos', (select count(*) from public.kudos),
    'nodes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sender_id', g.sender_id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'sent_count', g.sent_count,
        'last_sent_at', g.last_sent_at,
        'last_kudos_id', lk.last_kudos_id
      ) order by g.sent_count desc, g.sender_id)
      from sender_grouped g
      join public.profiles p on p.id = g.sender_id
      join last_kudos_by_sender lk on lk.sender_id = g.sender_id
    ), '[]'::jsonb),
    'recent_activity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'kudos_id', ra.kudos_id,
        'recipient_id', ra.recipient_id,
        'full_name', rp.full_name,
        'received_at', ra.created_at
      ) order by ra.created_at desc)
      from recent_activity ra
      join public.profiles rp on rp.id = ra.recipient_id
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_spotlight_nodes(bigint, text) to authenticated;

-- Realtime (BR-xx product ask): the activity ticker + word-cloud counts
-- should update live when a new kudos is sent, not just on next page load /
-- filter change. Requires the table in the `supabase_realtime` publication —
-- `postgres_changes` subscriptions still enforce the table's existing RLS
-- ("kudos are readable by authenticated users"), so no policy change needed.
alter publication supabase_realtime add table public.kudos;
