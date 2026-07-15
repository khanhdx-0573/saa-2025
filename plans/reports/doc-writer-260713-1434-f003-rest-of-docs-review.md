# F003 Site Header Navigation — rest-of-docs review

Scope: everything in `./docs` NOT already handled by spec-promote (fcodes registry +
feature-list.md were already updated, out of scope per instructions).

## Findings

1. **AGENTS.md directory map — updated.** Added a third reference-example bullet after `kudos`
   and `login`:
   > `about-saa-2025` / `award-information` — thin static-content screens with only the `app/`
   > layer populated ... no `components/<feature>/` folder and no `lib/<feature>/` folder ...
   > YAGNI ... compose the shared `components/layout/header.tsx` + `footer.tsx` directly.

   Rationale: verified both pages (`app/about-saa-2025/page.tsx`, `app/award-information/page.tsx`,
   36 lines each) are plain server components with translated static copy, no components/lib dirs
   created (confirmed via `ls`). The existing two examples (`kudos` = all 4 layers, `login` =
   missing `lib/` only) don't cover "app/-only, nothing else" — genuinely new combination of which
   layers are populated, worth the one-line addition per AGENTS.md's own instruction to read these
   examples "before adding a new feature."
   - `header-icons.tsx` and `header.tsx` staying under `components/layout/` needed **no edit** —
     that folder is already documented as SHARED (header, footer) and the new file follows the
     already-documented `<feature>-icons.tsx` naming convention; no new pattern introduced.

2. **docs/project-changelog.md, docs/development-roadmap.md, docs/code-standards.md, docs/system/*
   — none exist in this repo.** Confirmed via directory listing: `docs/` only contains
   `_canonical-fcodes.json`, `_source-to-fcode.json`, `features/`, `generated/`, `journals/`. This
   repo has never adopted the general narrative-docs layer (confirmed pattern from F001/F002 passes
   too) — nothing to update, nothing to create (out of scope to invent them unprompted).

3. **docs/generated/screen-list.md** is a stub (title only, zero rows) — but this is true for
   *all three* shipped features (F001/F002/F003 all show `screens: —` in feature-list.md), not a
   regression introduced by F003. Left untouched — pre-existing repo-wide gap, not this task's scope.

4. No other docs found stale. `docs/features/F003_SiteHeaderNavigation/*` (technical-spec,
   business-context, screens, edge-cases) already reflects the shipped behavior per the plan's
   "Key Decisions (settled)" section (bell decorative, avatar real link, mock pages YAGNI'd) —
   spot-checked `screens.md`, matches the implementation.

## Files changed

- `/home/khanh/sun/aidd/saa-2025/AGENTS.md` — added one reference-example bullet (see #1).

No other files touched.

## Unresolved questions

None.

**Status:** DONE
**Summary:** Only AGENTS.md needed an update — added a third reference-example bullet documenting the new "app/-only, no components/lib layer" pattern used by the two static mock pages. No changelog/roadmap/code-standards/docs-system files exist in this repo (confirmed absent, third time running), so nothing to touch there; screen-list.md's empty state is a pre-existing repo-wide gap unrelated to F003, left as-is.
