# Phase 13 — Testing (unit + e2e)

## Context Links

- Spec: [technical-spec.md](./spec/kudos-live-board/technical-spec.md), [edge-cases.md](./spec/kudos-live-board/edge-cases.md).
- Test conventions: `AGENTS.md` (mandatory dual-suite: Vitest unit + Playwright e2e); existing
  `lib/kudos/*.test.ts`, `e2e/kudos.spec.ts`, `e2e/global-setup.ts`.

## Overview

- **Priority:** P1 · **Status:** Pending · **blockedBy:** Phase 12.
- A feature is not "done" until BOTH suites exist and pass (AGENTS.md). Unit-cover the pure logic; e2e-cover the
  primary Live Board journey through the real UI against a production build.

## Key Insights

- Pure/deterministic logic (star rating, spotlight layout, feed dedup) is where unit tests earn their keep.
- e2e can't be skipped "because unit covers it" — integration/auth/layout regressions only show through the UI.
- Reuse the existing Playwright auth bootstrap (`global-setup.ts`, Supabase Admin API storageState) — do NOT
  automate real OAuth.

## Requirements

- Verifies SC-01..SC-12 across unit + e2e.

## Architecture

**Unit (Vitest, co-located `*.test.ts`):**
- `lib/kudos/validation.test.ts` (extend) — `starRating` boundaries 9/10/19/20/49/50 → 0/1/1/2/2/3 (SC-09);
  `SPOTLIGHT_SEARCH_MAX_CHARS`.
- `components/kudos/spotlight-layout.test.ts` — deterministic positions (same input → same output), font-size
  scaling incl. all-equal-counts fallback (SC-07 layout).
- `components/kudos/use-kudos-feed.test.ts` — pagination advance, dedup by id, hasMore stop, filter-change
  reset to page 1 (SC-06, SC-04).
- Query/mutation wrappers: light shape assertions against a fixture (camelCase mapping) if a supabase mock is
  practical; otherwise rely on e2e for the RPC round-trip.

**e2e (Playwright, `e2e/kudos-live-board.spec.ts`, new):** against `next build && next start` via the existing
`test:e2e` runner; reuse storageState.
- Board loads: banner, Highlight carousel (≤5), Spotlight canvas, All Kudos feed, sidebar stats visible.
- Like toggles heart count + active state; own kudos heart disabled (SC-01, SC-02).
- Copy Link → toast "Link copied — ready to share!" (SC-05).
- Filter change updates feed + resets to page 1 (SC-04).
- Infinite scroll loads more without dupes (SC-06).
- Click card/content → `/kudos/[id]` detail; click avatar → `/profile/[id]`; bad id → not-found (SC-11).
- Spotlight node click → detail (SC-07).

## Related Code Files

- **Create:** `components/kudos/spotlight-layout.test.ts`, `components/kudos/use-kudos-feed.test.ts`,
  `e2e/kudos-live-board.spec.ts`.
- **Modify:** `lib/kudos/validation.test.ts` (extend).
- **Read:** all Phase 02/04/07/08 sources; `e2e/global-setup.ts`.
- Tester owns test files only; never edits implementation (team rule).

## Related Spec IDs

SC-01..SC-12; edge-cases table (like/self-like/idempotent/anonymous/empty/scroll/bad-id/boundaries).

## Implementation Steps

1. Extend `validation.test.ts` with `starRating` boundary cases.
2. Write `spotlight-layout.test.ts` (determinism + scaling + edge counts).
3. Write `use-kudos-feed.test.ts` (pagination/dedup/reset).
4. Write `e2e/kudos-live-board.spec.ts` covering the journey + key edge cases.
5. `npm run test` (unit) and `npm run test:e2e` — all green. Fix by recommendation; DO NOT wave through
   failures. No mocks/cheats to force green.

## Todo List

- [x] `starRating` boundary unit tests
- [x] spotlight-layout determinism/scaling tests
- [x] use-kudos-feed pagination/dedup/reset tests
- [x] e2e live-board journey spec (load, like, copy, filter, scroll, nav, bad-id)
- [x] `npm run test` + `npm run test:e2e` both pass

## Success Criteria

- Unit + e2e suites exist and pass; SC-01..SC-12 exercised.
- No skipped/xfail tests to paper over failures; no fabricated data to force green.

## Risk Assessment

- **e2e data dependence (Med/Med):** journey needs seeded kudos + likes + a self-authored kudos. Mitigation:
  seed via global-setup / Admin API fixtures (mirror existing pattern), including one kudos authored by the
  test user (self-like disable) and enough rows to trigger a second feed page.
- **Flaky infinite-scroll/pan-zoom (Med/Low):** timing/pointer events. Mitigation: wait on network idle +
  explicit element assertions; drive pan/zoom via deterministic events.
- **Rollback:** test-only; safe to iterate.

## Security Considerations

- Confirm unauthenticated `/kudos`, `/kudos/[id]`, `/profile/[id]` redirect to `/login` (edge-cases table).
- Confirm anonymous cards expose no sender identity in the DOM (SC-10).

## Next Steps

- On green: hand to `reviewer`. Then `project-manager` updates `docs/` roadmap/changelog (documentation-
  management.md). Spec promotion (`spec_draft` → `spec:` + `F###`) happens when `/tkm:takumi` runs this plan.
