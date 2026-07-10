# Send Kudos Feature Planning Session

**Date**: 2026-07-09 17:26  
**Severity**: Medium (architecture-shaping decision, new dependencies)  
**Component**: Kudos write feature, database schema, backend RPC, frontend modal  
**Status**: Completed—ready for implementation phase

## What Happened

Ran `/tkm:create-plan` to produce a complete implementation blueprint for the "Send Kudos" (Viết Kudo) peer-recognition feature. This is a new feature, sourced from two MoMorph Figma screens (compose modal + hashtag dropdown). The codebase was vanilla—only a Google-OAuth login existed before this session; no profiles table, no rich-text library, no kudos code. 

We walked through Clarification Protocol fully: fetched specs and test cases from both screens, ran six rounds of AskUserQuestion to resolve 20+ ambiguous design and implementation questions, authored a complete SDD spec (4 files, 15 edge-case rows, 5 user stories), and packaged the whole thing into a 6-phase implementation plan with explicit blockedBy chains and risk callouts.

**No code was written.** This was spec-authoring and planning only. Implementation will follow via `/tkm:takumi`.

## The Brutal Truth

This session felt lean and purposeful—the Clarification Protocol actually *worked*. Each question sharpened the next decision. By the end, we had shipped a spec that the user explicitly approved at the "Rest Point" gate. The galling part usually comes later: specs are clean until the first engineer reads the ambiguous corner of the RLS policy or discovers the kudos_mentions table design doesn't scale. This one may hold up better than most because we locked down the atomic-write invariant and anonymous-sender constraint *in the database layer, not just the app*, which is the hard choice.

The other win: this repo had zero test infrastructure before we started. We flagged that loudly—Phase 6 explicitly calls out that adding a test runner is a repo-wide decision, not a feature-team surprise. That's honesty. We could have smuggled Vitest in as a phase step and hoped nobody noticed. We didn't.

The sting: we committed to new TipTap dependencies without shipping a "test what this actually renders" pass. The spec says "rich-text editor with mention support"—we know *what* TipTap is, but we haven't wired it into the Next.js build or seen whether a 19.x React version plays nice with it. That's a bet we're taking early. If TipTap chokes on React 19 during Phase 4, we'll hit it mid-implementation, not before. Acceptable risk, but it's there.

## Technical Details

### Decisions Made (Clarification Rounds)

1. **Rich-text + mentions**: Approved adding `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-mention` as new npm dependencies—an explicit exception to AGENTS.md's "no new packages without approval" baseline. User weighed the alternative (a barebones `<textarea>` with no bold/link/mention) and chose the TipTap route.

2. **Hashtags**: Selection-only from a predefined, managed list. Free-text hashtag creation is out of scope. Matches the "Dropdown list hashtag" MoMorph screen exactly. User rejected "user can add their own hashtags" option.

3. **Entry point**: A minimal `/kudos` page hosting just the trigger button ("Write Kudo"). No feed, no list of past kudos. User chose to ship the write path first.

4. **Profiles table**: New `public.profiles` table, created via a trigger on `auth.users`, holds searchable metadata (display name, avatar URL, department) for the "@mention recipient picker" and recipient autocomplete. Denormalizes `auth.users` data into the app's namespace.

5. **Anonymous kudos**: When sender opts in, NO identity is persisted anywhere—not for internal audit, not for abuse tracing. User accepted the trade-off explicitly. Enforced via DB CHECK constraint (`CASE WHEN is_anonymous THEN sender_id IS NULL ELSE TRUE END`), not just app discipline.

6. **Images**: New public Supabase Storage bucket `kudos-images`, authenticated upload only, 5MB/file max, jpg/png only. User chose to allow optional image attachments but with a hard cap.

7. **Spec language**: User chose to author the spec in English despite MoMorph content being Vietnamese, matching the repo's English-language code/docs convention.

### Architecture: Atomic Writes via Security-Definer RPC

All writes to `kudos` + child tables (`kudos_hashtags`, `kudos_images`, `kudos_mentions`) route through ONE Postgres function marked `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION create_kudos(
  sender_id UUID,
  recipient_id UUID,
  message TEXT,
  is_anonymous BOOLEAN,
  hashtag_ids INT[],
  image_ids UUID[]
) RETURNS TABLE (kudos_id UUID) AS $$
BEGIN
  -- INSERT kudos row
  -- INSERT kudos_hashtags rows
  -- INSERT kudos_images rows
  -- INSERT kudos_mentions rows (from @mentions in message)
  -- RETURN kudos_id
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why not direct RLS policies on each table?**  
- Atomicity: if a hashtag insert fails mid-transaction, the kudos row is orphaned. The RPC wraps all writes in one transaction.
- Invariant enforcement: the `sender_id IS NULL` rule for anonymous kudos is unbypassable from the client. RLS can't express "if column X is true, column Y must be null"—only "user can see/edit row if condition holds."

**Trade-off**: The RPC is centralized (single point of failure for all kudos writes) but makes the write atomic and the anonymous constraint bulletproof. Chosen over the lighter RLS-only approach.

## What We Tried

The clarification loop itself was the "trying." We presented options at each step:

- Rich-text: Option A (TipTap), Option B (barebones textarea), Option C (Markdown). User picked A.
- Hashtags: Option A (predefined list), Option B (user-created), Option C (no tags). User picked A.
- Images: Option A (optional, with cap), Option B (required), Option C (forbidden). User picked A.
- Test runner: Option A (defer; user decides later), Option B (assume Vitest), Option C (assume Jest). User picked A, and we honored it—Phase 6 doesn't mandate a runner, just calls out it's missing.

No failed attempts—the loop ran hot, each answer informed the next question, and we converged.

## Root Cause Analysis

Not applicable—this was a planning success, not a failure. The session worked because:

1. We started with MoMorph design data, not ambiguous prose. The screens were there to reference.
2. We ran Clarification Protocol without skipping steps—fetched specs/test cases before asking the user anything.
3. We let the user answer one question at a time, not a batched wall of unknowns.
4. We pinned every ambiguity to a real trade-off (anonymous = no abuse tracing, rich-text = new dependency risk, etc.) rather than hiding it.

## Lessons Learned

1. **Clarification first, spec second, plan third.** The sequence matters. Specs written without user input are fantasy. We nailed the order here.

2. **Push DB-layer invariants as hard as possible.** The `sender_id IS NULL` rule enforced by CHECK is stronger than app-layer discipline or RLS policies. When an invariant is truly non-negotiable (and anonymous kudos is—we're not tracing anonymous senders), make it impossible to bypass at the source.

3. **Flag repo-wide decisions early.** We could have smuggled "add Jest" into Phase 6 as a hidden cost. Instead, we called it out as a repo decision. It's not our feature's responsibility to fix the testing infrastructure. That buys us credibility for when we ship and someone asks "why aren't there tests?"

4. **New dependencies need a fallback plan.** TipTap is a smart choice, but we haven't tested it with Next.js 16 + React 19 yet. The risk is real. When Phase 4 lands and TipTap chokes, we'll have a decision point: downgrade richness (go back to barebones textarea), or spend time fixing the integration. Flag it now so it doesn't blindside us.

5. **Spec-approved by the user is not the same as code-approved.** The user approved the SDD. That means the design intent is clear. It does NOT mean the code will be trivial or that the build will pass on the first try. The next 6 phases will teach us what the spec missed.

## Next Steps

1. **Immediate**: User to review and approve the plan at `/plans/260709-1726-kudos-write-feature/plan.md`. Plan is hydrated, all 6 phases laid out with blockedBy chains.

2. **Phase 1 (database)**: Execute via `/tkm:takumi plans/260709-1726-kudos-write-feature`. Implement schema, RPC, Supabase bucket, trigger on `auth.users`. No app code yet.

3. **Phase 2–5**: Backend data layer, component implementations, page wiring, i18n.

4. **Phase 6 (testing)**: Escalate the "no test runner" decision to the user. Either:
   - Defer testing until after MVP ships (risky, but fast).
   - Add Jest/Vitest to the repo now (slows down this feature, but locks in testing practice).
   - Accept "manual testing only" (honest risk).

5. **Post-implementation**: If TipTap integration hits friction during Phase 4, escalate immediately—don't guess a workaround.

## Risk Callouts

- **TipTap + Next.js 16 + React 19 compatibility**: Not validated yet. Low probability (TipTap is well-maintained), but will hit us mid-implementation if it fails.
- **Anonymous kudos, no audit trail**: Accepted trade-off. No abuse-prevention capability. If anon spam becomes a problem, we'll have no data to trace it.
- **No test infrastructure**: Phase 6 explicitly defers this decision. If the user chooses "no tests for this feature," we ship with zero coverage. Acceptable for MVP, painful for later.
- **Profiles table sync**: Trigger-based denormalization can drift if `auth.users` is edited outside the app. Not a blocker now, but something to monitor.

---

**Status:** DONE  
**Summary:** Kudos write feature planning complete. Spec approved, 6-phase plan hydrated, architecture locked down (atomic RPC for kudos writes, anonymous constraint enforced at DB level). Ready for implementation via `/tkm:takumi`.  
**Concerns:** TipTap integration untested with this Next.js/React version; test infrastructure decision deferred to Phase 6; anonymous kudos accepted trade-off (no audit/tracing capability).
