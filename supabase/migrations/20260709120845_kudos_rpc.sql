-- create_kudos: the only write path for kudos + child rows (hashtags, images, mentions).
-- SECURITY DEFINER, atomic (single transaction), enforces the anonymous/sender_id rule
-- server-side regardless of client input, and validates hashtag cardinality/activity.

create or replace function public.create_kudos(
  p_recipient_id uuid,
  p_title text,
  p_content text,
  p_is_anonymous boolean,
  p_anonymous_display_name text,
  p_hashtag_ids bigint[],
  p_image_paths text[],
  p_mentioned_profile_ids uuid[]
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_kudos_id uuid;
  v_sender_id uuid;
  v_hashtag_count int;
begin
  if btrim(p_title) = '' then
    raise exception 'title cannot be blank';
  end if;

  if char_length(p_title) > 100 then
    raise exception 'title exceeds max length of 100 characters';
  end if;

  if btrim(p_content) = '' then
    raise exception 'content cannot be blank';
  end if;

  if p_recipient_id = auth.uid() then
    raise exception 'cannot send kudos to yourself';
  end if;

  if p_is_anonymous and btrim(coalesce(p_anonymous_display_name, '')) = '' then
    raise exception 'anonymous display name cannot be blank';
  end if;

  if array_length(p_hashtag_ids, 1) is null or array_length(p_hashtag_ids, 1) < 1
    or array_length(p_hashtag_ids, 1) > 5 then
    raise exception 'kudos must have between 1 and 5 hashtags';
  end if;

  select count(*) into v_hashtag_count from public.hashtags
    where id = any(p_hashtag_ids) and is_active;
  if v_hashtag_count <> array_length(p_hashtag_ids, 1) then
    raise exception 'one or more hashtag_ids are invalid or inactive';
  end if;

  v_sender_id := case when p_is_anonymous then null else auth.uid() end;

  insert into public.kudos (sender_id, recipient_id, title, content, is_anonymous, anonymous_display_name)
  values (v_sender_id, p_recipient_id, p_title, p_content, p_is_anonymous, p_anonymous_display_name)
  returning id into v_kudos_id;

  insert into public.kudos_hashtags (kudos_id, hashtag_id)
    select v_kudos_id, h_id from unnest(p_hashtag_ids) as h_id;

  if p_image_paths is not null and array_length(p_image_paths, 1) > 0 then
    insert into public.kudos_images (kudos_id, storage_path, position)
      select v_kudos_id, path, row_number() over () - 1
      from unnest(p_image_paths) as path;
  end if;

  if p_mentioned_profile_ids is not null and array_length(p_mentioned_profile_ids, 1) > 0 then
    insert into public.kudos_mentions (kudos_id, mentioned_profile_id)
      select v_kudos_id, distinct_id from unnest(p_mentioned_profile_ids) as distinct_id
      where distinct_id is not null;
  end if;

  return v_kudos_id;
end;
$$;

grant execute on function public.create_kudos to authenticated;
