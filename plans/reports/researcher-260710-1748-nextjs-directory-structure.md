# Study Report: Best Next.js Directory Structure — Applied to saa-2025

Date: 2026-07-10 · Level: medium (5 WebSearch + 1 official-docs deep fetch)

## Summary

Checked the official Next.js docs (v16.2.10, updated 2026-06-23) plus community consensus
(bulletproof-react, Feature-Sliced Design, several 2026 "Next.js structure" guides). Then audited
saa-2025's actual `app/`, `components/`, `lib/` trees against that guidance.

**Verdict: the app code itself is not messy.** It already matches the official "store project files
outside `app`" strategy plus community feature-folder grouping (`components/<feature>/`,
`lib/<feature>/`) — the same convention just written into `AGENTS.md` this session. The one real
Next.js-relevant gap is that saa-2025 doesn't yet use **route groups**, which matters once more routes
arrive (currently only 4 routes, so this wasn't biting yet). The one concrete piece of root-level clutter
found is `release-manifest.json` — it's a `.claude/`-tooling-kit manifest (paths like
`skills/clio-generate/SKILL.md` inside it), not a Next.js file, sitting loose at the project root next to
real config files (`next.config.ts`, `tsconfig.json`) — that's the kind of thing that reads as "lộn xộn"
even though it's harmless.

If the feeling of clutter/hard-to-find persists, it's most likely coming from the volume of
`.claude/`/`plans/`/`docs/` tooling artifacts cohabiting the repo root with the actual app, not from the
Next.js code layout — worth separating those two concerns before reorganizing app code further.

## Study Methodology
- Sources: 5 WebSearch queries + 1 deep fetch of the official Next.js project-structure docs page
- Key terms: "App Router project structure 2026", "colocation route groups private folders",
  "bulletproof-react / Feature-Sliced Design Next.js", "src directory vs root", "enterprise-scale example"

## Key Findings

### 1. Official Next.js conventions (authoritative, from nextjs.org/docs/app/getting-started/project-structure)

- **Colocation is safe by default.** A route segment is only publicly reachable once it has a `page.tsx`
  or `route.ts` — "project files can be safely colocated inside route segments in the `app` directory
  without accidentally being routable." No underscore needed just to avoid accidental routing.
- **Private folders** (`_folderName`) opt a folder + all subfolders out of routing entirely. Not required
  for colocation safety — they exist for: separating UI logic from routing logic, consistent
  cross-project sorting, and avoiding future naming collisions with Next.js file conventions.
- **Route groups** (`(folderName)`) organize routes without adding to the URL. Two concrete uses: (a)
  group by section/team/intent (marketing vs shop vs admin), (b) give a subset of routes their own
  layout/loading state at the same URL level, or even their own root `<html>`/`<body>` layout.
- **`src/` folder is optional** — purely separates app code from root config files. If used, `app` (and
  everything else) moves under it; partial adoption isn't supported (Next.js ignores `src/app` if a
  root-level `app/` also exists).
- **Three named top-level strategies, explicitly "unopinionated" among them** — Next.js docs state
  outright: *"choose a strategy that works for you and your team and be consistent."*
  1. Store all project files **outside** `app/` (root-level `components/`, `lib/`, etc.) — `app/` stays
     pure routing.
  2. Store project files **inside `app/`'s root** (still shared, just co-located with routes).
  3. **Split by feature/route** — globally shared code at `app/` root, feature-specific code pushed down
     into the route segment that uses it (uses private folders like `app/blog/_components/`).

### 2. Community layer on top (bulletproof-react, Feature-Sliced Design)

- Consensus: **group by feature/domain, not by type** (`components/kudos/` not
  `components/buttons/ + components/modals/ + ...`) once the app has more than a couple of screens.
  "Keep `app/` strictly for routing, move business logic into a `features/`-style directory based on
  actual domains" — same idea as strategy 3 above, just implemented as sibling folders instead of nested
  under `app/`.
- FSD's specific advice for Next.js: keep route composition thin — routes assemble features, they don't
  implement domain logic in the route file itself.
- No community consensus on exactly where global/shared `components/ui` boilerplate should sit
  (root `components/ui/` vs `_components` private folders) — pick one, matches what saa-2025 already
  does (`components/ui/`, `components/layout/`).

### 3. Gap analysis — saa-2025 today vs. the above

| Area | Official/community guidance | saa-2025 today | Verdict |
|---|---|---|---|
| Top-level strategy | Pick 1 of 3, be consistent | Strategy 1 (outside `app/`): `components/`, `lib/` at root | ✅ Matches, consistently applied |
| Feature grouping | Group by domain, not type | `components/kudos/`, `lib/kudos/`, `components/auth/` (shared), `lib/supabase/` (shared) | ✅ Matches — already documented as a MUST convention in `AGENTS.md` (this session) |
| Colocated tests | Safe, common practice | `*.test.ts(x)` next to source everywhere | ✅ Matches |
| Route groups `(group)` | Use once routes need shared-but-different layouts, or to organize by section | Not used — 4 routes total (`/`, `/kudos`, `/login`, `/auth/*`) | ⚪ Not wrong, just not needed yet at this route count — see recommendation below |
| Private folders `_folder` | Optional; for opting out of routing + editor sorting | Not used; not needed since nothing is colocated *inside* a route segment (all feature code lives at root under `components/`/`lib/`, strategy 1) | ⚪ N/A for this project's chosen strategy |
| `src/` folder | Optional, all-or-nothing | Not used — root has `app/`, `components/`, `lib/` etc. directly | ⚪ Fine either way; switching now would be a large, low-value diff |
| Root-level clutter | Only Next.js/config files at root | `release-manifest.json` (a `.claude/`-kit manifest, unrelated to the Next.js app) sits at repo root alongside `next.config.ts`/`tsconfig.json` | ❌ Real clutter — misleading to anyone scanning root config files |

### 4. Root cause of the "messy/hard to find" feeling

Two independent code reviews this session (one by me, one by an independent `reviewer` subagent) found
**zero misplaced files** inside `app/`, `components/`, `lib/` for the kudos and login features — the app
code is clean. The repo root, however, mixes:
- real Next.js/app config (`next.config.ts`, `tsconfig.json`, `package.json`, ...)
- a large tooling/skills kit under `.claude/` (hooks, skills, rules)
- planning artifacts under `plans/` (per-feature dirs with `spec/`, `evidence/`, `phase-*.md`)
- standing docs under `docs/` (`features/`, `journals/`)
- the stray `release-manifest.json`

None of that is "Next.js structure" — it's a different, tooling-oriented information architecture living
in the same repo. That volume is very likely the actual source of "khó tìm, chưa clean," not the app code
itself.

## Recommendations

### Keep as-is (already correct, don't touch)
- `app/`, `components/<feature>/`, `lib/<feature>/`, shared `components/{layout,ui,auth}/`,
  `lib/supabase/` — matches official strategy 1 + community feature-grouping. Confirmed clean twice.
- No `src/` migration — 4 top-level app folders, no config-file collision problem to solve.

### Worth doing now (small, concrete)
1. **Move or remove `release-manifest.json` from the repo root.** It's unrelated to the Next.js app —
   relocate under wherever the `.claude/` kit's own manifests live, or exclude if it's a build artifact
   that shouldn't be committed at all. (Didn't move it — flagging only, since this is a research
   deliverable; confirm intent before touching tooling-kit files.)

### Worth adopting once the route count grows (not urgent — 4 routes today)
2. **Route groups**, e.g. `app/(public)/login/`, `app/(public)/auth/` vs `app/(app)/kudos/` — costs
   nothing (no URL change), and pays off the moment there's a second authenticated route needing to share
   a layout that `/login` shouldn't have, or a third public route. Doing this preemptively now (2 routes
   per group) would be YAGNI; revisit when route count roughly doubles.
3. If a *third* feature ever needs a hook/type used by 2+ features (like `components/auth/` already is
   for session state), give it the same "shared, not a feature" treatment already documented in
   `AGENTS.md` rather than duplicating it per-feature.

### Explicitly not recommended
- Don't adopt private folders (`_components`) — saa-2025's strategy (all feature code at root, not
  nested inside route segments) never colocates anything *inside* a route segment, so there's nothing to
  opt out of routing. Private folders solve a problem this repo's chosen strategy doesn't have.
- Don't restructure `components/`/`lib/` into a deeper FSD-style layer system (`entities/`, `widgets/`,
  `features/`, `shared/`) — at 2 features this is premature abstraction; the current flat `<feature>/`
  convention already gives 90% of the benefit with far less ceremony.

## Sources & References

### Official Documentation
- [Next.js — Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure) (fetched directly, v16.2.10, updated 2026-06-23)
- [Next.js — `src` folder convention](https://nextjs.org/docs/app/api-reference/file-conventions/src-folder)

### Recommended Reading
- [bulletproof-react — project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [Feature-Sliced Design — The Ultimate Next.js App Router Architecture](https://feature-sliced.design/blog/nextjs-app-router-guide)
- [Feature-Sliced Design — Usage with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)

### Community Resources
- [Next.js 16 App Router Folder Structure Best Practices — dharmsy.com](https://www.dharmsy.com/blog/nextjs-16-app-router-folder-structure)
- [GitHub Discussion — Next.js Modular and Scalable Project Structure](https://github.com/orgs/community/discussions/190342)

## Unresolved Questions
- Was `release-manifest.json` intentionally left at repo root, or is it a stray build artifact from the
  `.claude/` kit that should be gitignored instead? Needs a decision before anyone moves/deletes it.
- Is the volume of `plans/`/`docs/`/`.claude/` tooling content (vs. the small actual app) the real thing
  driving the "messy" feeling, separate from Next.js code structure? If so, that's an information-
  architecture question for the tooling setup, not a Next.js refactor — worth clarifying before spending
  effort reorganizing `app/`/`components/`/`lib/` further, since both reviews found those already clean.
