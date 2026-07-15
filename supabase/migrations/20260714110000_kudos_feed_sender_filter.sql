-- get_kudos_feed: adds an optional p_sender_id filter so the All Kudos
-- section can scope the feed to only the current viewer's own sent kudos
-- (product decision — every card shown there must be editable by the
-- viewer). NULL (the default) keeps the prior company-wide behavior, so
-- get_highlight_kudos and any other caller are unaffected.
--
-- Anonymous kudos always have sender_id = null (create_kudos never stores
-- the real sender for those), so an anonymous kudos the viewer sent will
-- never match p_sender_id — an accepted limitation of the existing
-- anonymity model, not something this filter can work around.

-- `create or replace` only replaces a function with the EXACT SAME argument
-- type list — appending a 5th parameter would otherwise leave the original
-- 4-arg version as a stale, still-callable overload alongside this one.
drop function if exists public.get_kudos_feed(bigint, text, int, int);

create or replace function public.get_kudos_feed(
  p_hashtag_id bigint default null,
  p_department text default null,
  p_limit int default 10,
  p_offset int default 0,
  p_sender_id uuid default null
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
      and (p_sender_id is null or k.sender_id = p_sender_id)
    order by k.created_at desc, k.id desc
    limit p_limit
    offset p_offset
  ) f;
$$;

grant execute on function public.get_kudos_feed(bigint, text, int, int, uuid) to authenticated;
