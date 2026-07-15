# Phase 01 — Likes schema + read RPCs (Track B)

## Context Links

- Spec: [technical-spec.md](./spec/kudos-live-board/technical-spec.md) — "New RPCs (contract)", "Key Entities".
- RPC template: `supabase/migrations/20260709120845_kudos_rpc.sql` (`create_kudos`, SECURITY DEFINER).
- Existing schema: `supabase/migrations/20260709120844_kudos.sql`, `20260709120842_profiles.sql`,
  `20260710105300_profiles_department.sql`.

## Overview

- **Priority:** P1 · **Status:** Pending · **Track:** B (chained; blocks nothing in Track A).
- Add the `kudos_likes` table (the one new write concept) and all read RPCs the UI needs. Foundational for
  the data layer (Phase 02). No Track A phase depends on this — UI builds against the RPC *contract* with mock
  data and is wired to it at Integration (Phase 12).

## Key Insights

- All existing kudos writes go through a SECURITY DEFINER RPC and tables have no direct INSERT grant — mirror
  that: `kudos_likes` gets select-only grant; likes toggle exclusively via `toggle_kudos_like`.
- Heart counts and stats are **derived** from `kudos_likes` (no denormalized counter) — DRY, matches BR-02/03.
- Anonymous kudos have `sender_id = NULL`, so BR-03 (hearts to sender) and BR-10 (no credit) fall out for free.

## Requirements

- Implements: FR-008, FR-010(url only), FR-011, FR-013, FR-017; BR-01..BR-06, BR-10; supports SC-01,02,03,06,
  07,08,10,11. Entities: `kudos_likes`.

## Architecture

**Data flow:** UI (Phase 12 wiring) → `lib/kudos` fn (Phase 02) → `supabase.rpc(...)` → these functions →
`kudos_likes` / existing tables → jsonb back to client.

**Migration 1 — `kudos_likes`:**
```
kudos_id uuid  FK -> kudos(id)     on delete cascade
user_id  uuid  FK -> profiles(id)  on delete cascade
created_at timestamptz not null default now()
primary key (kudos_id, user_id)                        -- BR-05 one like per user per kudos
```
- Enable RLS; policy `select ... to authenticated using (true)`; `grant select ... to authenticated`.
- NO insert/update/delete grant (writes via RPC only, like the F001 tables).
- Index: PK covers `(kudos_id, user_id)`; add index on `user_id` for "hearts received" / "did I like" scans.

**Migration 2 — RPCs** (see spec "New RPCs (contract)" for exact signatures + return shapes):
- `toggle_kudos_like(p_kudos_id uuid) returns jsonb` — SECURITY DEFINER. Reject if the kudos' `sender_id =
  auth.uid()` (BR-04). Delete the row if it exists else insert (idempotent toggle). Return
  `{ liked, heart_count }` where `heart_count = count(*) from kudos_likes where kudos_id = p_kudos_id`.
- `get_kudos_feed(p_hashtag_id bigint, p_department text, p_limit int, p_offset int) returns jsonb` — card
  array, `created_at desc`. NULL params = no filter. Filter by hashtag via `exists (kudos_hashtags ...)`; by
  department via `recipient.department`. Aggregate `hashtags[]`, `images[]` with `json_agg`. Include
  `heart_count`, `liked_by_me` (`exists kudos_likes where user_id = auth.uid()`), `sender_received_count`,
  `recipient_received_count` (correlated counts on `kudos.recipient_id`). Anonymous rows expose
  `anonymous_display_name` and NULL sender profile.
- `get_highlight_kudos(p_hashtag_id, p_department) returns jsonb` — same card shape, `order by heart_count
  desc limit 5` (BR-01).
- `get_spotlight_nodes(p_hashtag_id, p_department) returns jsonb` — `{ total_kudos, nodes[] }`; nodes group by
  `recipient_id` with `received_count`, `last_received_at = max(created_at)`, and `last_kudos_id` (the id of
  that max row).
- `get_kudos_detail(p_kudos_id uuid) returns jsonb` — one card object or null.
- `get_kudos_stats(p_user_id uuid) returns jsonb` — `{ received, sent, hearts }` per BR-03.
- Read RPCs: `language sql stable` (invoker) — RLS already allows authenticated select; `auth.uid()` resolves
  for `liked_by_me`. Grant execute to `authenticated`.

## Related Code Files

- **Create:** `supabase/migrations/20260712000001_kudos_likes.sql`,
  `supabase/migrations/20260712000002_kudos_read_rpcs.sql`.
- **Read (reference only, do NOT modify):** existing kudos/profiles migrations, `create_kudos` RPC.

## Related Spec IDs

FR-008, FR-011, FR-013, FR-017; BR-01..BR-06, BR-10; SC-01,02,03,06,07,08,10,11.

## Implementation Steps

1. Write migration 1 (`kudos_likes` table + RLS + grant + `user_id` index).
2. Write migration 2: `toggle_kudos_like` (SECURITY DEFINER, self-like guard, idempotent toggle, returns
   jsonb).
3. Add the five read RPCs (feed, highlight, spotlight, detail, stats) as `sql stable`, jsonb returns with
   `json_agg` for nested hashtags/images.
4. Grant execute on all six functions to `authenticated`.
5. Apply locally: `npx supabase migration up --local`; smoke-test each RPC in psql with seeded data.

## Todo List

- [x] `kudos_likes` table + RLS + grants + index
- [x] `toggle_kudos_like` RPC (self-like guard + idempotent + count)
- [x] `get_kudos_feed` RPC (filters, pagination, aggregates, liked_by_me, star counts)
- [x] `get_highlight_kudos` RPC (top-5)
- [x] `get_spotlight_nodes` RPC (total + grouped nodes + last_kudos_id)
- [x] `get_kudos_detail` + `get_kudos_stats` RPCs
- [x] Grants + local apply + psql smoke test

## Success Criteria

- `toggle_kudos_like` rejects self-likes, is idempotent, returns correct `{ liked, heart_count }` (SC-01,02).
- `get_highlight_kudos` returns ≤5 rows ordered by heart_count desc (SC-03).
- `get_kudos_feed` respects filters + limit/offset and returns no dupes across pages (SC-06).
- `get_spotlight_nodes.total_kudos` matches `count(*) from kudos`; node counts correct (SC-07).
- `get_kudos_stats` matches manual counts incl. anonymous exclusion from hearts (SC-08, SC-10).

## Risk Assessment

- **Aggregate perf (Med/Low):** feed + highlight do per-card correlated counts + json_agg. Fine at event
  scale. Mitigation upgrade: denormalized `kudos.heart_count` + trigger; materialized highlight view.
- **RPC/JSON contract drift (Med/Med):** Phase 02 types must match jsonb keys exactly. Mitigation: freeze the
  key names here (spec "New RPCs"); Phase 02 mirrors them 1:1.
- **Rollback:** drop the two migration files / `drop function` + `drop table kudos_likes` — no existing data
  touched (additive only).

## Security Considerations

- `toggle_kudos_like` is the only write path; self-like blocked server-side (BR-04) regardless of client.
- Read RPCs run under RLS (authenticated select-all, matching existing kudos read policy) — no new exposure.
- No secrets; all functions `set search_path = public` (definer one) per existing convention.

## Next Steps

- Phase 02 consumes these signatures. Integration (Phase 12) wires UI → Phase 02 → these RPCs.
