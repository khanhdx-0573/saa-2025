# Phase 02 — Data layer (Track B)

## Context Links

- Spec: [technical-spec.md](./spec/kudos-live-board/technical-spec.md) — "New RPCs (contract)", "Algorithms".
- Existing conventions: `lib/kudos/{types,queries,mutations,validation}.ts` (extend, same patterns:
  `createClient()` from `@/lib/supabase/client`, typed `.returns<T[]>()` / `.rpc()`, errors thrown not
  swallowed).
- Depends on Phase 01 RPC contract (signatures/return shapes).

## Overview

- **Priority:** P1 · **Status:** Pending · **Track:** B (blockedBy Phase 01; no Track A link).
- Typed client wrappers for the new RPCs + the star-rating util + filter-option queries + profile queries.
  Track A components stay presentational; this layer is imported only by the Integration phase's containers.

## Key Insights

- Star thresholds are limits → live in `validation.ts` (single source of truth), NOT redefined in components.
- One TS type per RPC jsonb shape; keys mirror Phase 01 exactly (contract freeze).
- Profile stats reuse `get_kudos_stats` (DRY) rather than a duplicate query.

## Requirements

- Implements/supports: FR-003,004,007,008,010,011,012,013,016,017; BR-01..BR-06; SC-01..SC-11.

## Architecture

**Data flow:** Integration container → these fns → `supabase.rpc(...)` (Phase 01) → jsonb → typed object.

**Types (`lib/kudos/types.ts`, extend):**
- `KudosCard` — id, sender: `Profile | null`, recipient: `Profile`, isAnonymous, anonymousDisplayName,
  title, content, createdAt, hashtags: `Hashtag[]`, images: `{ path: string }[]`, heartCount, likedByMe,
  senderReceivedCount, recipientReceivedCount.
- `SpotlightNode` — recipientId, fullName, avatarUrl, receivedCount, lastReceivedAt, lastKudosId.
- `SpotlightData` — `{ totalKudos: number; nodes: SpotlightNode[] }`.
- `KudosStats` — `{ received: number; sent: number; hearts: number }`.
- `KudosFilters` — `{ hashtagId: number | null; department: string | null }`.

**Queries (`lib/kudos/queries.ts`, extend):**
- `listHighlightKudos(filters): Promise<KudosCard[]>` → `get_highlight_kudos`.
- `listAllKudos(filters, limit, offset): Promise<KudosCard[]>` → `get_kudos_feed`.
- `getSpotlightData(filters): Promise<SpotlightData>` → `get_spotlight_nodes`.
- `getKudosDetail(id): Promise<KudosCard | null>` → `get_kudos_detail`.
- `getKudosStats(userId): Promise<KudosStats>` → `get_kudos_stats`.
- `listDepartments(): Promise<string[]>` → distinct `profiles.department` (filter dropdown options).
- (Hashtag options reuse existing `listHashtags()`.)

**Mutations (`lib/kudos/mutations.ts`, extend):**
- `toggleKudosLike(kudosId): Promise<{ liked: boolean; heartCount: number }>` → `toggle_kudos_like`.

**Validation (`lib/kudos/validation.ts`, extend):**
- `STAR_1_THRESHOLD = 10`, `STAR_2_THRESHOLD = 20`, `STAR_3_THRESHOLD = 50`.
- `SPOTLIGHT_SEARCH_MAX_CHARS = 100`.
- `starRating(receivedCount: number): 0 | 1 | 2 | 3` (BR-06 algorithm).

**Profile (`lib/profile/`, new feature folder per AGENTS.md):**
- `lib/profile/types.ts` — `ProfileDetail` (Profile + stats + starRating).
- `lib/profile/queries.ts` — `getProfileById(id): Promise<Profile | null>`; profile page composes it with
  `getKudosStats` (reused) rather than duplicating stats SQL.

## Related Code Files

- **Modify:** `lib/kudos/types.ts`, `lib/kudos/queries.ts`, `lib/kudos/mutations.ts`, `lib/kudos/validation.ts`.
- **Create:** `lib/profile/types.ts`, `lib/profile/queries.ts`.
- **Do NOT modify:** `lib/kudos/use-kudos-form.ts` and existing F001 query/mutation fns (extend only).

## Related Spec IDs

FR-003,004,007,008,010,011,012,013,016,017; BR-01..BR-06; SC-01..SC-11.

## Implementation Steps

1. Add types to `types.ts` mirroring Phase 01 jsonb keys.
2. Add star thresholds + `starRating()` + `SPOTLIGHT_SEARCH_MAX_CHARS` to `validation.ts`.
3. Add the six query fns + `listDepartments` to `queries.ts` (throw on error, `?? []` / `?? null` defaults).
4. Add `toggleKudosLike` to `mutations.ts`.
5. Create `lib/profile/{types,queries}.ts`.
6. `npm run lint` + `tsc` (strict, zero `any`) — confirm compile.
7. Watch file size: if `queries.ts` nears 200 lines, split by concern (e.g. `queries-feed.ts`) re-exported
   from `queries.ts` (keep the public import surface stable).

## Todo List

- [x] Types added (KudosCard, SpotlightNode, SpotlightData, KudosStats, KudosFilters)
- [x] validation.ts: star thresholds + `starRating()` + search cap
- [x] queries.ts: highlight/feed/spotlight/detail/stats/departments
- [x] mutations.ts: `toggleKudosLike`
- [x] `lib/profile/{types,queries}.ts`
- [x] Lint + typecheck clean

## Success Criteria

- `starRating` returns 0/1/2/3 at the 10/20/50 boundaries (SC-09; unit-tested in Phase 13).
- Each query returns a typed object matching the RPC jsonb; errors thrown, not swallowed.
- Zero `any`; `npm run lint` + typecheck pass.

## Risk Assessment

- **Type/JSON mismatch (Med/Med):** camelCase TS vs snake_case jsonb — map explicitly in each wrapper.
  Mitigation: Phase 13 unit tests assert shape against a fixture.
- **queries.ts size (Low/Low):** may exceed 200 lines. Mitigation: split-by-concern re-export.
- **Rollback:** additive; revert the file edits / delete `lib/profile/`.

## Security Considerations

- No new auth surface — thin wrappers over Phase 01 RPCs (which enforce the rules). No client-side trust for
  self-like (server enforces).

## Next Steps

- Integration (Phase 12) imports these into section containers. Phase 13 unit-tests `starRating` + wrappers.
