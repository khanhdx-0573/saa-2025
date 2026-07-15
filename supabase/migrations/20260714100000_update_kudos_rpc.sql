-- update_kudos: lets the ORIGINAL SENDER edit the title/content/hashtags of
-- their own kudos after posting (Kudos Live Board edit-pencil action, C.3).
-- SECURITY DEFINER — ownership check (auth.uid() = sender_id) enforced
-- server-side regardless of client input, same validation rules as
-- create_kudos (title/content non-blank + title length, 1-5 active
-- hashtags). Recipient, sender identity, anonymity, and images are NOT
-- editable — out of scope, only the message itself can be revised.
-- Anonymous kudos (sender_id is null) can never be edited: there is no
-- owner to check against, and the frontend never shows the edit button for
-- them either (KudosCardData.sender is null in that case).

create or replace function public.update_kudos(
  p_kudos_id uuid,
  p_title text,
  p_content text,
  p_hashtag_ids bigint[]
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid;
  v_hashtag_count int;
begin
  select sender_id into v_sender_id from public.kudos where id = p_kudos_id;
  if v_sender_id is null then
    raise exception 'kudos not found or is anonymous (cannot be edited)';
  end if;
  if v_sender_id <> auth.uid() then
    raise exception 'only the original sender can edit this kudos';
  end if;

  if btrim(p_title) = '' then
    raise exception 'title cannot be blank';
  end if;
  if char_length(p_title) > 100 then
    raise exception 'title exceeds max length of 100 characters';
  end if;
  if btrim(p_content) = '' then
    raise exception 'content cannot be blank';
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

  update public.kudos set title = p_title, content = p_content where id = p_kudos_id;

  delete from public.kudos_hashtags where kudos_id = p_kudos_id;
  insert into public.kudos_hashtags (kudos_id, hashtag_id)
    select p_kudos_id, h_id from unnest(p_hashtag_ids) as h_id;

  return public.build_kudos_card(p_kudos_id);
end;
$$;

grant execute on function public.update_kudos(uuid, text, text, bigint[]) to authenticated;
