-- kudos + child tables (kudos_hashtags, kudos_images, kudos_mentions).
-- Read-only for authenticated; ALL writes go through create_kudos() (next migration),
-- no direct INSERT policy on any of these tables.

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  constraint kudos_title_length_check check (char_length(title) <= 100),
  is_anonymous boolean not null default false,
  anonymous_display_name text,
  created_at timestamptz not null default now(),
  constraint kudos_anonymous_sender_check check (
    (is_anonymous and sender_id is null) or
    (not is_anonymous and sender_id is not null)
  )
);

create table public.kudos_hashtags (
  kudos_id uuid not null references public.kudos(id) on delete cascade,
  hashtag_id bigint not null references public.hashtags(id) on delete restrict,
  primary key (kudos_id, hashtag_id)
);

create table public.kudos_images (
  id uuid primary key default gen_random_uuid(),
  kudos_id uuid not null references public.kudos(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.kudos_mentions (
  id uuid primary key default gen_random_uuid(),
  kudos_id uuid not null references public.kudos(id) on delete cascade,
  mentioned_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.kudos enable row level security;
alter table public.kudos_hashtags enable row level security;
alter table public.kudos_images enable row level security;
alter table public.kudos_mentions enable row level security;

create policy "kudos are readable by authenticated users" on public.kudos for select to authenticated using (true);
create policy "kudos_hashtags are readable by authenticated users" on public.kudos_hashtags for select to authenticated using (true);
create policy "kudos_images are readable by authenticated users" on public.kudos_images for select to authenticated using (true);
create policy "kudos_mentions are readable by authenticated users" on public.kudos_mentions for select to authenticated using (true);

-- Base table-level GRANTs (RLS alone does not expose these tables to the Data
-- API role — see supabase/config.toml [api] auto_expose_new_tables note).
-- INSERT is intentionally NOT granted here: all writes go through the
-- create_kudos() SECURITY DEFINER RPC (next migration), which runs with the
-- function owner's privileges regardless of the caller's table grants.
grant select on public.kudos, public.kudos_hashtags, public.kudos_images, public.kudos_mentions to authenticated;
