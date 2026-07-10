-- Hashtags table: admin-managed list, seeded with the 8 MoMorph design values.
-- No INSERT/UPDATE/DELETE policy for `authenticated` — the list is admin/service-role managed only.

create table public.hashtags (
  id bigint generated always as identity primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.hashtags enable row level security;

create policy "hashtags are readable by authenticated users"
  on public.hashtags for select
  to authenticated
  using (is_active);

-- Base table-level GRANT (RLS alone does not expose the table to the Data API
-- role — see supabase/config.toml [api] auto_expose_new_tables note).
grant select on public.hashtags to authenticated;

insert into public.hashtags (name) values
  ('High-performing'), ('BE PROFESSIONAL'), ('BE OPTIMISTIC'), ('Be A Team'),
  ('THINK OUTSIDE THE BOX'), ('GET RISKY'), ('GO FAST'), ('WASSHOI');
