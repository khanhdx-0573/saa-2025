-- kudos_likes: one row per (user, kudos) like/heart.
-- Read-only for authenticated; the ONLY write path is the toggle_kudos_like() RPC
-- (next migration), no direct INSERT/UPDATE/DELETE policy on this table
-- (mirrors the kudos/kudos_hashtags/kudos_images/kudos_mentions convention).

create table public.kudos_likes (
  kudos_id uuid not null references public.kudos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kudos_id, user_id) -- BR-05: one like per user per kudos
);

create index kudos_likes_user_id_idx on public.kudos_likes (user_id);

alter table public.kudos_likes enable row level security;

create policy "kudos_likes are readable by authenticated users"
  on public.kudos_likes for select
  to authenticated
  using (true);

-- Base table-level GRANT (RLS alone does not expose the table to the Data API
-- role — see supabase/config.toml [api] auto_expose_new_tables note).
-- INSERT/UPDATE/DELETE are intentionally NOT granted here: all writes go
-- through the toggle_kudos_like() SECURITY DEFINER RPC (next migration).
grant select on public.kudos_likes to authenticated;
