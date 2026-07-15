---
name: project-saa2025-docs-state
description: saa-2025 repo doc layout — what exists, what's boilerplate, precedent for scope decisions
metadata:
  type: project
---

Repo `/home/khanh/sun/aidd/saa-2025` is very early-stage (2nd feature, Send Kudos F001, shipped
2026-07-09, after an initial Google-OAuth login feature). Of the general docs listed in doc-writer's
task template (README.md, docs/project-overview-pdr.md, codebase-summary.md, code-standards.md,
system-architecture.md, project-roadmap.md, deployment-guide.md, design-guidelines.md) — only
README.md exists, and it is still the unmodified `create-next-app` boilerplate. The login feature
(the only prior feature) did not touch it either.

**Why:** confirms a real precedent, not an oversight to fix — this project has not yet adopted the
general narrative-docs layer at all.

**How to apply:** when asked to update docs for a new feature here, expect "no update needed" for
all seven general docs unless the feature specifically demands one (e.g. a breaking env var). Only
`docs/generated/feature-list.md`, `docs/generated/screen-list.md`, and `docs/features/{slug}/*`
(the layered spec artifacts) are live in this repo. Don't invent the missing general docs — out of
scope per explicit task instructions.

Layered spec note: `docs/features/F001_SendKudos/technical-spec.md` was authored pre-implementation
and promoted (status flipped to `implemented`) without its `## Source Code References` /
`## Artifact References` prose sections being refreshed — found and fixed this staleness surgically
(added real file list, corrected feature-list.md registration note) during the post-implementation
doc-writer pass. Worth checking these two sections specifically on future promoted specs in this repo.

**Login feature has no layered spec at all.** `docs/features/` contains only `F001_SendKudos/` —
the login/Google-OAuth feature (shipped before F001, commit `35afdc0`) was never run through the
spec pipeline, so there's no `docs/features/{login-slug}/` dir and `feature-list.md`/`screen-list.md`
don't mention it. Confirmed 2026-07-10 when backfilling unit + e2e test coverage for the login
screen (test-only change, no behavior/architecture change): verdict was "no docs update needed" —
the generated inventories don't track test-coverage status at all, so adding tests never touches
`docs/generated/*`. Second data point reinforcing the precedent above: this repo's docs surface
is genuinely minimal, and "no update needed" is the common, correct verdict here, not a shortcut.

**Counter-example (2026-07-10): F001 UX bug fix DID require a spec update.** Kudos compose modal's
Submit button changed from "disabled until valid" to "always clickable, shows validation-summary
banner on invalid click" (`components/kudos/kudos-modal.tsx`). Because `business-context.md` and
`technical-spec.md` (Requirements, Decision Logic, US001 ACs) explicitly documented the old
disabled-button mechanism at that level of detail, the docs were now factually wrong, not just
vague — patched all three surgically. Lesson: "no update needed" only holds when docs don't
describe the specific mechanism that changed. Always grep the feature's spec files for the exact
old behavior (e.g. "disabled") before concluding a UI-feedback tweak is undocumented-therefore-skippable.

**Second correction on the SAME mechanism (2026-07-10, later same day): per-field errors removed.**
An earlier doc-writer pass on this same validation-banner change over-documented it — added
per-field "Không được để trống" errors (red border + text on Recipient/Title/Content/Hashtag) as
if they showed *alongside* the summary banner. User checked the actual Figma reference screen: only
the banner ever shows, never per-field indicators. Code was corrected to match (removed `showError`
props from `recipient-field.tsx`/`title-field.tsx`/`anonymous-toggle.tsx`, removed inline error
paragraphs in `kudos-modal.tsx`, dropped the now-dead `KudosModal.requiredError` i18n key). Docs
patched to match: `technical-spec.md` US001 ACs + US002 AC, `edge-cases.md` all empty-field rows —
explicitly state "no per-field borders/text, only the banner." `business-context.md`/`screens.md`
never mentioned per-field errors, so needed no change (confirms the standing "no update needed"
precedent still holds for docs that never described the wrong mechanism in the first place).
Lesson: when documenting UI validation feedback, don't infer/assume per-field indicators exist just
because that's the common pattern elsewhere — verify the actual screen/screenshot for the specific
mechanism (banner-only vs. banner+per-field is a real, easy-to-get-wrong distinction).

**Recurring gap in spec-promote: `feature-list.md` Status column lags the technical-spec.md flip
(2026-07-13, F002 Kudos Live Board).** Confirmed convention (both F001 and F002): only
`technical-spec.md` frontmatter flips `draft` → `implemented` on promotion; `business-context.md`,
`screens.md`, `edge-cases.md` intentionally stay `draft` (editorial/prose status, not implementation
status — NOT a bug, don't "fix" those three). But `docs/generated/feature-list.md`'s per-feature
Status column (both the hierarchy table row AND the "Feature Details" summary line) is supposed to
mirror `technical-spec.md`'s status and didn't get updated for F002 — still said `draft` post-promotion
while F001's row correctly said `implemented`. Fixed by editing feature-list.md directly (in scope:
`docs/generated/*` is a MAY-edit inventory path). **How to apply:** on every post-implementation doc
review, diff the feature's `technical-spec.md` status against its `feature-list.md` row/detail-line
status — don't assume the promote step kept them in sync, check every time.

**Fix-bug pass on F002 (2026-07-13) — a "bug fix" can smuggle in a genuine spec gap; check all three
layered artifacts, not just technical-spec.md.** Pass included: banner `aspect-[1440/512]` CSS fix (no
doc change, pure CSS matching already-documented design), Highlight carousel internals restructured to
equal-width + `scale()` (no doc change, implementation detail), `app/globals.css` dark-theme fix (no doc
change, infra-level). But two items DID need doc updates: (1) a NEW top-level "Tìm kiếm profile Sunner"
search box (`components/kudos/sunner-search-bar.tsx`) next to the compose entry bar, distinct from the
already-documented Spotlight in-canvas search — original F002 authoring only captured the Spotlight
search under FR-011 and missed this second search box entirely (real MoMorph-design gap, not scope
creep). Added FR-021 + US011 + SC-13 to `technical-spec.md`, patched FR-011 to disambiguate, and updated
`screens.md` (Screen List row + User Journey step 2) and `business-context.md` ("Who Uses It" section) —
all three layered files described the compose-entry area without this element, so all three needed the
same patch. (2) `kudos.content` is Tiptap-authored HTML, and the original F002 delivery never actually
rendered it as HTML (escaped as literal text) — a real correctness bug now fixed by
`lib/kudos/sanitize-content-html.ts`; added a one-sentence correction to FR-006 (content field description)
since the spec previously implied plain-text content with no mention of HTML/sanitization.
**Lesson:** when a task says "bug fix / design correction pass," don't assume it's docs-inert by default —
check each changed item individually against the specific mechanism documented (or undocumented) in
technical-spec.md AND screens.md AND business-context.md; CSS-only / infra-only items are the ones that
skip docs, not the whole pass.

**AGENTS.md directory-map DOES get edited when a feature introduces a genuinely new structural pattern
(2026-07-13, F003 Site Header Navigation).** F003 added `app/about-saa-2025/` and `app/award-information/`
— single-file server-component pages with ONLY the `app/` layer populated (no `components/<feature>/`,
no `lib/<feature>/`; they compose the shared `components/layout/header.tsx`/`footer.tsx` directly). The
existing "Reference examples" list at the bottom of AGENTS.md's directory-map section only had `kudos`
(all 4 layers) and `login` (missing `lib/`) — neither covers "app/-only, nothing else," so this was a new
data point worth a 1-line addition, not just an example restating an existing rule. Added a third bullet.
Contrast: `header-icons.tsx` (new file in the already-documented shared `components/layout/` folder) did
NOT need a mention — same folder, same role as the existing `<feature>-icons.tsx` convention, no new
pattern. **How to apply:** when a feature's file layout is a novel combination of "which of the 4 layers
are populated," add one reference-example bullet; when it's just a new file inside an already-documented
folder using an already-documented naming convention, don't touch AGENTS.md.

**Third confirmation: no docs/system, docs/code-standards.md, docs/project-changelog.md, or
docs/development-roadmap.md exist anywhere in this repo (checked again 2026-07-13 for F003).** Also
`docs/generated/screen-list.md` is a stub (title only, no rows) for ALL THREE shipped features
(F001/F002/F003 all show `screens: —` in feature-list.md's Related line) — this is a standing, pre-existing
gap across the whole repo, not something any single feature regressed. Don't populate it as a side-effect
of an unrelated feature's doc-review pass unless explicitly asked; it isn't in scope for "check if this
feature's docs need updating."
