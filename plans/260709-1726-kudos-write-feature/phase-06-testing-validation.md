---
phase: 6
title: "Testing & Validation"
status: completed
effort: "0.5d"
---

# Phase 6: Testing & Validation

## Context Links

- Depends on: all prior phases (1-5)
- Spec: [`spec/send-kudos/edge-cases.md`](./spec/send-kudos/edge-cases.md) (15 scenarios — the primary test source)
- Original MoMorph test cases: screen `ihQ26W78P2` (57 cases) — see `plan.md` MoMorph refs

## Overview

**Priority:** P0 (gate before this feature is considered done — no failing tests get waved through)
**Status:** Pending

No test runner is currently configured in this repo (`package.json` has no `test` script, no
Jest/Vitest/Playwright dependency). This phase's first job is confirming that with the user before
writing anything further — do not silently add a new testing framework as a side effect of "just
needing tests," since that's itself a new-dependency decision.

## Key Insights

- `package.json` scripts are only `dev`, `build`, `start`, `lint` — there is no existing test
  infrastructure to slot into, unlike a typical "add tests to the existing suite" task.
- Given the AGENTS.md "no new dependencies without approval" rule and the fact a test framework is
  a repo-wide decision (not scoped to this one feature), this must be raised explicitly rather than
  assumed.

## Requirements

- Confirm test framework strategy with the user before installing anything.
- Whatever the answer, cover: RPC-level constraint enforcement (Phase 1), the submit-gating logic
  (Phase 4's `canSubmit`), and image/hashtag validation guards (Phase 2/3).
- Manual QA pass against every row in `spec/send-kudos/edge-cases.md` is mandatory regardless of
  automated coverage, since this is fundamentally a UI-heavy feature translated from a visual design.

## Implementation Steps

1. **Before writing any test code**, ask the user (or check `docs/code-standards.md` if it exists
   and already answers this) which of these applies:
   - No automated tests for this feature — manual QA against `edge-cases.md` only (fastest, matches
     current repo state, but least durable).
   - Add a minimal test runner now (e.g. Vitest — lightweight, works well with Next.js/React 19) as
     a new dependency, scoped to covering this feature's pure-logic units (`use-kudos-form.ts`'s
     `canSubmit`, `lib/kudos/validation.ts`'s guards) — NOT full component/E2E tests, to keep scope
     proportional.
   - Something else the user already has planned repo-wide (defer entirely, just do manual QA now).

2. **If a test runner is approved**, cover with unit tests (no mocking the database — per
   `development-rules.md`, and since these are pure functions with no DB dependency):
   - `lib/kudos/validation.ts`: `isValidKudosImage` — valid jpg/png under 5MB → true; oversized →
     false; wrong mime type → false.
   - `use-kudos-form.ts`'s `canSubmit` derivation: all combinations of
     recipient/content/hashtagIds presence → correct boolean (this is the single most
     test-case-dense piece of logic per the spec's edge-cases table).
   - Do NOT unit-test Supabase RPC calls with mocks (per `primary-workflow.md`: "no fake data,
     mocks, cheats... to fake a green build") — the RPC's own constraints (Phase 1) are the right
     place to verify server-side invariants, via a real local Supabase instance, not a mocked client.

3. **Database-level verification (regardless of test-runner decision)** — run these against the
   local Supabase instance from Phase 1 (`supabase start` + `supabase db reset`), as manual SQL or
   a throwaway script, not committed test code unless a runner was approved:
   - Insert a kudos via `create_kudos` with `p_is_anonymous = true` → confirm `sender_id is null` in the row.
   - Attempt to insert directly into `public.kudos` bypassing the RPC as the `authenticated` role →
     confirm it's rejected (no INSERT policy exists).
   - Call `create_kudos` with an empty `p_hashtag_ids` array → confirm it raises and no `kudos` row
     was left behind (transaction rolled back, not a partial insert).
   - Call `create_kudos` with 6 hashtag ids → confirm it raises.
   - Insert a row into `auth.users` (or sign up via the real Google OAuth flow in dev) → confirm a
     matching `public.profiles` row appears with `full_name`/`avatar_url` populated.

4. **Manual UI QA** — walk every row of `spec/send-kudos/edge-cases.md` in the running app
   (`npm run dev`), plus the full happy path (recipient → content w/ formatting+mention → 1-5
   hashtags → 0-5 images → optional anonymous → submit → modal closes). Record any deviation from
   the spec as a bug to fix before marking this phase done — do not mark done with known deviations.

5. Run `npm run lint` and `npm run build` one final time across the whole feature (all phases'
   files together) to catch any cross-phase integration issue (e.g. an unused import left from an
   earlier phase, a type mismatch between `lib/kudos/types.ts` and a component prop).

## Todo List

- [x] Test-framework strategy confirmed with the user (not assumed)
- [x] If approved: unit tests for `isValidKudosImage` and `canSubmit` written and passing
- [x] DB-level RPC constraint checks (anonymous sender_id null, hashtag count 1-5, rollback-on-error) verified
- [x] `profiles` auto-sync verified against a real or local-emulated auth.users insert
- [x] Every row of `spec/send-kudos/edge-cases.md` manually walked and passes in the running app
- [x] `npm run lint` and `npm run build` both green on the full feature diff

## Success Criteria

- [x] Zero known deviations from `spec/send-kudos/edge-cases.md` at sign-off
- [x] No failing test is waved through to close this phase (per `primary-workflow.md`)
- [x] Build and lint both green

## Risk Assessment

- **Scope creep into repo-wide test infra**: resist turning this phase into "set up Jest/Vitest for
  the whole repo" — if the user wants that, it's a separate, repo-wide decision/plan, not a rider on
  this feature.

## Security Considerations

- The DB-level RPC bypass check (Step 3, second bullet) is itself a security verification — it
  confirms the RLS/no-INSERT-policy design from Phase 1 actually holds, not just that the happy
  path works.

## Next Steps

- None — this is the final phase. Feature is ready for `reviewer` agent hand-off per
  `development-rules.md` ("Hand finished work to the `reviewer` agent after every implementation").
