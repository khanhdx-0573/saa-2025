-- Profiles table synced from auth.users, with RLS and auto-sync trigger.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- RLS restricts rows, but the Data API role still needs the base table-level
-- GRANT to query it at all (this Supabase version does not auto-expose new
-- tables to anon/authenticated — see supabase/config.toml [api]).
grant select on public.profiles to authenticated;

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_auth_user_sync();
