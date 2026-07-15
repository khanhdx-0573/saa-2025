# Kudos Live Board (F002) Planning & Full Forge Session

**Date**: 2026-07-12 15:30  
**Severity**: Medium (13-phase multi-agent session, backend integration, Spotlight panel novel component)  
**Component**: Kudos live board page, word-cloud spotlight panel, profile + detail pages, test suite refresh  
**Status**: Completed—all 13 phases done, reviewer sealed at 9/10, work staged uncommitted per user choice

## What Happened

Ran a single large session combining `/tkm:create-plan` → `/tkm:takumi` for the "Kudos Live Board" (F002) peer-recognition social feed feature. The source was one MoMorph screen ("Sun* Kudos - Live board", fileKey `9ypp4enmFmdK3YAFJLIu6C`, screenId `MaZUn5xHXZ`) plus clarifications around two mock-only elements: Secret Box stats and the "10 SUNNER NHẬN QUÀ MỚI NHẤT" (10 newest gift recipients) carousel.

**Planning phase**: Ran Clarification Protocol via 5 rounds of AskUserQuestion covering build approach for the Spotlight word-cloud panel (locked: custom SVG/CSS pan-zoom, no new npm dependency), special-day 2x heart bonus (locked: deferred to backlog), heart-credit on anonymous likes (locked: no one—user pasted MoMorph screenshot showing anonymous card variant; sender identity hidden means no credit), Profile + Kudos Detail page scope (locked: both minimal, real pages not stubs), and leaderboard mention in prose vs. absent from frame (locked: omit it). Authored SDD spec across 5 files covering 20 functional requirements, 10 behavioral rules, 12 success criteria, 10 user stories, plus 12 edge cases and technical notes.

**Implementation phase**: Promoted spec to `docs/features/F002_KudosLiveBoard/` (F002 allocated in feature registry). Executed 13 phases in dependency-respecting waves:
- **Wave 1** (6 phases in parallel): Phase 01 DB/RPCs + Phase 03 toast notifications + Phase 05 banner+compose modal + Phase 07 Spotlight board SVG + Phase 09 sidebar recent + Phase 10 profile page—all with zero unmet dependency.
- **Wave 2** (2 phases): Phase 02 data layer (queries/mutations) + Phase 04 shared `KudosCard` component family.
- **Wave 3** (3 phases): Phase 06 highlight badge + Phase 08 all-kudos feed + Phase 11 kudos-detail page.
- **Phase 12** (single-owner merge): Integration—board shell rewrite, filter-state lifted to board level, type-boundary mapper between `KudosCard`(lib) ↔ `KudosCardData`(component), i18n namespace migration to `KudosLiveBoard`.
- **Phase 13**: Full test suite (85 unit + 16 e2e).

All phases dispatched via `implementer` subagents (code discipline). Final code review + evidence gate + docs promotion completed.

## The Brutal Truth

This was a forge that actually *held*. Six months ago that would have been surprising. Now it's the new normal for code discipline—the rigor works. The hard part wasn't the code; it was the *friction* that doesn't show up in a changelog.

**The Docker delay stung.** For most of the session, local Supabase wasn't running (user's Docker daemon wasn't up). Phase 01 wrote the migrations but never applied them. We sat there with unverified SQL for hours. User spun up Docker themselves mid-session (their move, not ours), but that's a gap in the process—we need a `--local-db-required` flag or a pre-flight check that fires before any DB phase starts. The migrations landed clean once applied (`npx supabase migration up --local`), but the 3-hour window of "we assume this works" was genuinely uncomfortable.

**Agent rate-limits bit twice.** Two Wave-3 launches transiently failed (session rate-limit + brief model-availability blip). Zero partial writes, clean re-launches. Modern infrastructure is resilient, but the *visibility* into "this just paused for 90 seconds" threw off the human's sense of momentum. Not a failure, but a feel.

**The e2e regression was real.** After all 13 phases reported done, running the FULL suite (not just F002) surfaced a genuine break in the pre-existing F001 `e2e/kudos.spec.ts`. The new Live Board's page content introduced accessible-name collisions: the compose trigger's name changed from "Viết Kudo" to a long placeholder string by design; a "Gửi" (send) substring match now also hit the new pill. Stable selectors switched to prefix/exact. No app behavior broke—just test selectors were stale. That's the real story: features can collide in the test harness even when the app works fine. We caught it because we ran the full suite, not just the feature spec.

**The reviewer rework taught us something.** First pass: 8/10, REWORK flagged two real issues. One: `gift-recipients-list.tsx` used fake mock ids (`"mock-1"` etc.) that would 404 on click, violating the spec's "real navigation" requirement even though the list data is mock. Two: dead code file `lib/profile/queries.ts` with an unused `getProfileById` export. Orchestrator fixed both directly (swapped in real seeded profile UUIDs from the test DB, deleted dead file). Second reviewer pass was narrowly scoped to those two fixes plus a full re-sweep—score 9, SEALED. The lesson: we signed off on code that *looked* right (the UI rendered, the page worked in the app) but was architecturally soft (mock ids dangling into real routes). Spec discipline works, but you still need eyes on the boundary between mock and real.

**Evidence gate was actually important.** The plan's `evidence/` directory didn't exist (Study/Spec stages are skipped for `code` discipline). Orchestrator built `study-context.json` and `temper-results.json` from real command runs, then spawned a second narrowly-scoped `reviewer` pass to confirm the two fixes and produce a genuine `inspection-verdict.json`. The orchestrator deliberately avoided hand-writing a fake SEALED verdict itself—that gate ran for real and sealed clean. That discipline matters. A human might have just typed "SEALED ✓" to move on. The gate made sure the work actually earned it.

**Doc gen-gate exposed process gaps.** `docs/.rebuild-state.json` showed the repo's Core doc layer (via `rebuild-spec`) had never been bootstrapped. User initially asked for "Core only," but once the orchestrator read the actual pipeline (scout + 9 research artifacts + review/fix cycle + promote—a whole separate undertaking), it went back to the user with corrected scope. User chose to defer the full Core rebuild-spec pass to a separate session. That's good judgment. We could have silently plowed ahead; instead, we said "this is actually bigger than you're asking for."

**One real drift in docs.** The `doc-writer` caught and fixed during promote: `docs/generated/feature-list.md`'s F002 row still said `draft` after `technical-spec.md` had flipped to `implemented`. Small, but the kind of thing that rots trust in docs if it goes unnoticed.

## Technical Details

### Clarification Decisions

All locked via AskUserQuestion:

1. **Spotlight board build**: Custom SVG with CSS pan-zoom, no external library (Three.js / Pixi.js rejected). User chose lightweight interactivity over feature-rich physics.

2. **Special-day 2x heart bonus**: Deferred to backlog. Implementation deferred; hearts are always 1x today. No DB schema reserved for it; it's a future feature, not today's.

3. **Anonymous kudos heart-credit**: No one. User pasted MoMorph screenshot showing Ẩn danh (anonymous) card variant—heart button exists, but sender name is hidden/null. Therefore, no sender to credit. Confirmed via design artifact, not guessed.

4. **Profile + Detail pages**: Both built minimal (not stubs). Real navigation, real Supabase queries, real pages in the tree. Not mock URLs or placeholder screens.

5. **Leaderboard**: Prose mentioned "rank-up leaderboard" but absent from actual frame. Omitted entirely. Frame is source of truth, not prose.

### Architecture Decisions

**Spotlight panel SVG + CSS**: The Live Board's centerpiece. User-sentiment word cloud rendered as clickable SVG, pan-able via CSS transforms + pointer events. No Three.js, no canvas library. Constraints: pan-zoom must be smooth (60fps), words must be clickable, SVG must be small enough to load fast. Chosen approach: pre-bake the word positions in the SVG (static layout, not force-directed graph), apply CSS transform on pan gesture. Trade-off: layout is fixed per session (can't reflow dynamically), but load time is instant. Acceptable for MVP.

**KudosCard component family**: 4 variants (feed-item, highlight-badge, detail-page, sidebar-recent). All share the same lib-level `KudosCardData` interface (struct of id, sender, recipient, message, hearts, timestamp, is_anonymous). Component layer defines presentation. Integration phase (Phase 12) built the mapper between the two—this boundary caught the "fake mock id" issue during review.

**Filter state lifted to board level**: All filter toggles (by hashtag, by sender, by recipient) managed at the `KudosLiveBoard` page component. Child components (feed, sidebar, spotlight) receive filtered data as props. Single source of truth for filter state. Re-renders happen at the board level; children are presentational. This is boring architecture, but it's right.

**i18n namespace**: Moved all UI strings to a `KudosLiveBoard` namespace in `messages/en.json` and `messages/vi.json` during Phase 12. `useTranslations('kudos-board')` in components. Decouples this feature's strings from global i18n pollution.

### Implementation Friction & Fixes

1. **Docker/Supabase unavailable**: Phase 01 migrations written but not applied until user spun up Docker mid-session. Lesson: pre-flight check needed for DB phases.

2. **E2E regression (F001)**: Compose trigger name collision. Fixed via exact selector matching, not substring. No application behavior broke; test selectors were fragile.

3. **Mock ID dangling into real routes**: `gift-recipients-list.tsx` used `"mock-1"` etc., URLs would 404. Fixed by using real seeded UUIDs from test database.

4. **Dead code `lib/profile/queries.ts`**: Unused `getProfileById` export. Deleted during rework.

5. **Docs drift**: `feature-list.md` F002 row still `draft` after spec was `implemented`. Fixed during promote phase.

## What We Tried

The entire 13-phase sequence was the "trying." Key decision points:

- **Spotlight: SVG only, no canvas library?** Yes, locked. User prioritized load speed + simplicity over dynamic layout.
- **Anonymous kudos: truly no credit?** Yes, confirmed by design screenshot. Enforced at app + DB level.
- **Profile pages: minimal or full?** Minimal, but real—not stubs or mock routes. User chose to ship something usable rather than delay for polish.

No major failed attempts after Phase 01 (DB was solid once it ran). Most friction was visibility/coordination, not engineering.

## Root Cause Analysis

Why did this forge hold?

1. **Code discipline enforced atomicity.** Each phase was a subagent-owned unit. BlockedBy chains respected. Parallel waves only spawned when deps were met.

2. **Spec before code.** Clarification phase nailed the ambiguities before a single line was written. No "we'll figure it out during implementation" guessing.

3. **Type boundaries explicit.** `KudosCardData` (lib) ↔ `KudosCard` (component) separation caught the mock-id issue during review. Loose boundaries = loose discipline.

4. **Full test suite run caught the regression.** Feature tested in isolation passes. Feature tested with the whole codebase reveals collisions. We ran the whole suite.

5. **Evidence gate refused hand-written verdicts.** Forcing real `inspection-verdict.json` generation (not fake SEALED stamping) meant actual scrutiny happened.

## Lessons Learned

1. **Pre-flight checks for resource-dependent phases.** If a phase requires a running service (Supabase, API server, etc.), check it *before* dispatching the phase, not after writing code that can't be verified. The 3-hour gap between "migration written" and "migration applied" was uncomfortable.

2. **Feature tests alone don't catch integration regressions.** We need a "run full suite on every implementation" step, not just "run the feature spec." That's what surfaced the e2e collision.

3. **Mock data boundaries must be guarded in code.** `gift-recipients-list.tsx` rendering real links with mock IDs was a category error. The reviewer should have caught it (and did), but the code structure should have made it impossible. Consider a build-time check: "any component importing 'mock-data' must have 'Mock' in its filename" or similar.

4. **Docs promotion is a real phase, not a checklist.** The `feature-list.md` drift happened because someone (doc-writer) had to actively notice the spec status changed and update it. It didn't auto-sync. Real process.

5. **Agent rate-limits are invisible but real.** When a session pauses at a 90-second boundary, the human doesn't see it—the orchestrator just reports "agent restarted." Transparency matters. If we're going to run large sessions (13 phases), we need a monitor showing queue depth/latency so humans know why momentum dropped.

6. **Single-owner merge phases are worth the latency.** Phase 12 (Integration) was owned by one subagent, executed sequentially (not parallel with Wave 3). That cost us maybe 15 minutes of wall time. It bought us a clean, single-threaded refactor of the page shell, filter state, and type mapping. The alternative (having 3 agents touch the page simultaneously) would have been chaos.

## Next Steps

1. **Git commit**: Work is staged and ready. User explicitly chose NOT to commit this session—leaving it staged for separate review/approval. Respect that choice. Do not commit unless user asks.

2. **Docker pre-flight**: Add a check before any Phase with `requires_local_db: true`. If Supabase is not running, fail fast with a clear message.

3. **Full suite in CI**: Current e2e job probably runs only new specs. Add a weekly job that runs the entire e2e suite (old + new) to catch inter-feature collisions early.

4. **Mock data linting**: Add an eslint rule or build-time check to flag files importing mock-data files without "Mock" in the component name. Or isolate all mock data to a separate test-only directory.

5. **Docs auto-update on spec finish**: The `feature-list.md` drift happened because updating it was manual. Consider a post-promote hook that auto-bumps status in `feature-list.md` based on what was actually created.

6. **Session monitor for large orchestrations**: When running 13-phase sessions, show queue depth + agent restart logs in realtime. The two rate-limit hits were invisible to the human until they were over.

---

**Status:** DONE  
**Summary:** Kudos Live Board (F002) planned and fully implemented via 13 phases in code discipline. Spec locked (5 clarifications), all phases executed (85 unit + 16 e2e tests passing), reviewer sealed at 9/10, two rework items fixed (mock IDs, dead code), evidence gate sealed. Work staged uncommitted per user choice. Ready for user review before git commit.  
**Concerns/Lessons:** Docker unavailable for 3 hours mid-session (pre-flight check needed for DB phases); two transient agent rate-limits (visibility gaps); e2e collision between F001 and F002 caught and fixed (full suite run essential); docs drift in feature-list.md fixed during promote (docs are manual, not auto-synced); 13-phase sessions expose latency in round-trip queue (monitor needed for visibility).
