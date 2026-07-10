---
phase: 1
title: "Database Schema & Supabase Setup"
status: completed
effort: "0.5d"
---

# Phase 1: Database Schema & Supabase Setup

## Context Links

- Spec: [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md) → `## Key Entities`, `## Cross-Cutting Logic`
- Existing Supabase clients: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- Existing config: `supabase/config.toml` (no `migrations/` dir yet — this phase creates it)

## Overview

**Priority:** P0 (everything else depends on this)
**Status:** Pending

Creates the full Supabase schema for Send Kudos: a `profiles` directory synced from `auth.users`,
a managed `hashtags` list, the `kudos` table + 3 child tables, one atomic RPC to write a kudos in a
single transaction, RLS policies, and the `kudos-images` storage bucket. No migrations exist yet in
this repo — this phase creates `supabase/migrations/`.

## Key Insights

- Recipient is exactly ONE person per kudos (not multi-recipient).
- Anonymous kudos must have **no** recoverable sender reference — enforced at the DB layer via a
  CHECK constraint, not just app-layer discipline, so a bug in the UI/API can't leak identity.
- Child rows (hashtags, images, mentions) are written through one SECURITY DEFINER RPC together
  with the `kudos` row, so RLS on the child tables can stay simple (no direct client INSERT) and
  the whole write is atomic — no partial kudos with 0 hashtags if a later insert fails.
- `hashtags` is admin-managed (seeded here); no client-side create/update/delete policy.

## Requirements

- FR: `profiles` row exists for every `auth.users` row, kept in sync on insert/update.
- FR: `hashtags` seeded with the 8 values from the MoMorph design.
- FR: a kudos with `is_anonymous = true` can never have a non-null `sender_id`.
- FR: a kudos with `is_anonymous = false` must have a non-null `sender_id` (attribution required).
- NFR: writing a kudos + its hashtags/images/mentions is atomic (all-or-nothing).

## Architecture

```
auth.users --(trigger: handle_new_user)--> public.profiles
public.hashtags (seeded, admin-managed)
public.kudos --FK--> public.profiles (sender_id nullable, recipient_id not null)
public.kudos_hashtags (kudos_id, hashtag_id) --composite PK, join--
public.kudos_images (kudos_id --> storage object path in bucket "kudos-images")
public.kudos_mentions (kudos_id, mentioned_profile_id)

RPC: public.create_kudos(...) SECURITY DEFINER — the ONLY write path for kudos + children
```

## Related Code Files

**Create:**
- `supabase/migrations/00000000000001_profiles.sql`
- `supabase/migrations/00000000000002_hashtags.sql`
- `supabase/migrations/00000000000003_kudos.sql`
- `supabase/migrations/00000000000004_kudos_rpc.sql`
- `supabase/migrations/00000000000005_storage_kudos_images.sql`

Use the actual current UTC timestamp (`date -u +%Y%m%d%H%M%S`) as the filename prefix instead of
the placeholder zeros above — Supabase migrations are ordered lexicographically by filename.

## Implementation Steps

1. **`profiles` table + trigger** (`..._profiles.sql`):
   ```sql
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
   ```
   Note: Google OAuth via Supabase populates `raw_user_meta_data` with either `full_name`/`avatar_url`
   or `name`/`picture` depending on provider mapping — the `coalesce` covers both.

2. **`hashtags` table + seed** (`..._hashtags.sql`):
   ```sql
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

   insert into public.hashtags (name) values
     ('High-performing'), ('BE PROFESSIONAL'), ('BE OPTIMISTIC'), ('Be A Team'),
     ('THINK OUTSIDE THE BOX'), ('GET RISKY'), ('GO FAST'), ('WASSHOI');
   ```
   No INSERT/UPDATE/DELETE policy for `authenticated` — the list is admin/service-role managed only.

3. **`kudos` + child tables** (`..._kudos.sql`):
   ```sql
   create table public.kudos (
     id uuid primary key default gen_random_uuid(),
     sender_id uuid references public.profiles(id) on delete set null,
     recipient_id uuid not null references public.profiles(id) on delete cascade,
     content text not null,
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

   -- Read-only for authenticated; ALL writes go through create_kudos() (Step 4), no direct INSERT policy.
   create policy "kudos are readable by authenticated users" on public.kudos for select to authenticated using (true);
   create policy "kudos_hashtags are readable by authenticated users" on public.kudos_hashtags for select to authenticated using (true);
   create policy "kudos_images are readable by authenticated users" on public.kudos_images for select to authenticated using (true);
   create policy "kudos_mentions are readable by authenticated users" on public.kudos_mentions for select to authenticated using (true);
   ```
   Assumption carried from spec `## Assumptions`: kudos are readable by any authenticated user
   (recognition-wall pattern) — flag this to the user if a private/DM-style visibility model was
   intended instead; nothing in the MoMorph specs suggests kudos are private.

4. **`create_kudos` RPC** (`..._kudos_rpc.sql`) — the only write path, atomic, enforces the
   anonymous/sender_id rule server-side regardless of client input:
   ```sql
   create or replace function public.create_kudos(
     p_recipient_id uuid,
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

     insert into public.kudos (sender_id, recipient_id, content, is_anonymous, anonymous_display_name)
     values (v_sender_id, p_recipient_id, p_content, p_is_anonymous, p_anonymous_display_name)
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
   ```
   Image count (max 5) is validated client-side + re-checked in the Phase 2 server action before
   calling this RPC (the RPC itself only guards hashtag cardinality since that's the hard DB
   invariant tied to the join table; image count is a soft UX limit, not a data-integrity risk).

5. **Storage bucket** (`..._storage_kudos_images.sql`):
   ```sql
   insert into storage.buckets (id, name, public)
   values ('kudos-images', 'kudos-images', true)
   on conflict (id) do nothing;

   create policy "kudos-images are publicly readable"
     on storage.objects for select
     using (bucket_id = 'kudos-images');

   create policy "authenticated users can upload to their own folder"
     on storage.objects for insert
     to authenticated
     with check (
       bucket_id = 'kudos-images'
       and (storage.foldername(name))[1] = auth.uid()::text
     );
   ```
   Upload path convention (enforced by the policy above): `kudos-images/{auth.uid()}/{uuid}.{ext}`.
   File size (5MB) and MIME type (jpg/png only) are enforced client-side and in the Phase 2 server
   action before upload — Supabase Storage bucket-level `file_size_limit`/`allowed_mime_types` can
   also be set via `supabase/config.toml` `[storage.buckets.kudos-images]` as a second layer; add
   this if the local CLI version supports per-bucket config (check `supabase --version` first).

6. Run `supabase db reset` (or `supabase migration up` against local dev) to apply and smoke-test
   locally before touching any remote/staging project.

## Todo List

- [x] `profiles` table + RLS + `handle_auth_user_sync` trigger
- [x] `hashtags` table + RLS + seed data (8 rows)
- [x] `kudos`, `kudos_hashtags`, `kudos_images`, `kudos_mentions` tables + RLS (read-only policies)
- [x] `create_kudos` SECURITY DEFINER RPC with anonymous/sender_id enforcement + hashtag validation
- [x] `kudos-images` public storage bucket + read/upload policies
- [x] Local `supabase db reset` succeeds with no errors; seed data present

## Success Criteria

- [x] All 4 kudos-domain tables + `profiles` + `hashtags` exist with RLS enabled
- [x] Inserting a kudos with `is_anonymous = true` and a non-null `sender_id` is impossible (constraint fires)
- [x] `create_kudos(...)` with an invalid/inactive hashtag id raises and rolls back the whole transaction
- [x] A new `auth.users` row produces a matching `profiles` row automatically (test via local Supabase Studio or SQL)
- [x] Uploading to `kudos-images/{other-uid}/...` as a different authenticated user is rejected by the storage policy

## Risk Assessment

- **Google OAuth metadata shape drift**: if `raw_user_meta_data` keys differ from the `coalesce` list,
  `full_name`/`avatar_url` land null. Mitigation: log actual metadata shape from a real login once in
  dev before finalizing the trigger (check via `select raw_user_meta_data from auth.users limit 1;`).
- **Kudos visibility assumption**: this phase makes kudos readable by all authenticated users
  (recognition-wall pattern). If the intended visibility is sender/recipient-only, the SELECT policy
  on `kudos` and children must be tightened before shipping — flag this explicitly at review.

## Security Considerations

- All writes to `kudos`/child tables go through the SECURITY DEFINER RPC only — no direct client
  INSERT policy exists, so the anonymous/sender_id invariant cannot be bypassed from the client.
- Storage upload policy scopes writes to the caller's own `auth.uid()` folder — prevents one user
  from uploading into another's path.
- `hashtags` has no client write policy — prevents arbitrary tag injection.

## Next Steps

- Phase 2 (Backend Data Layer) wraps `create_kudos`, profile search, and image upload behind
  typed server-side functions.
