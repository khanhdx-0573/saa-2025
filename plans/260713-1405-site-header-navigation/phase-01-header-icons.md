# Phase 01 — Header Icons (bell + avatar/person SVGs)

## Context Links
- Spec: `spec/site-header-navigation/technical-spec.md` (FR-006, FR-007)
- Design ref: authenticated-header screenshot (white outline bell + red unread dot; bordered-square avatar with person-outline glyph)
- Convention example: `components/kudos/kudos-live-board-icons.tsx` (inline-SVG, `{ className }` prop, `aria-hidden`)

## Overview
- **Priority:** P2 · **Status:** completed · **Effort:** 0.5h
- Create `components/layout/header-icons.tsx` holding the two SVG glyphs the header needs. Shared chrome → icons live in `components/layout/`, NOT a feature folder (per AGENTS.md icon convention for shared components).

## Key Insights
- Existing icon files export named functions with a `{ className }: { className?: string }` prop and set `aria-hidden="true"` on the `<svg>`; `stroke="currentColor"` / `fill="currentColor"` so color is driven by Tailwind text-color utility on a parent. Mirror this exactly (DRY with the established pattern).
- The red unread-dot is NOT part of the bell path — it is a separate small element the header composes (positioned absolutely). Keep the bell SVG dot-free so the icon stays reusable; the dot is markup in phase-02.

## Requirements
- FR-006: bell glyph (decorative).
- FR-007: person/avatar glyph (inside the bordered-square link).

## Architecture
- **Input:** optional `className` (Tailwind color/size).
- **Transform:** none — pure presentational SVG.
- **Output:** `<svg>` element inheriting `currentColor`.
- Two exports: `BellIcon`, `AvatarPersonIcon`. No red dot, no border square here (composition happens in header.tsx).

## Related Code Files
- **Create:** `components/layout/header-icons.tsx`
- **Read for pattern:** `components/kudos/kudos-live-board-icons.tsx`

## Implementation Steps
1. Create `components/layout/header-icons.tsx` with a file-header comment (why it lives in `layout/`, mirroring the kudos-icons doc comment).
2. Export `BellIcon({ className })` — outline bell, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth` matching design, `aria-hidden="true"`.
3. Export `AvatarPersonIcon({ className })` — person/head-and-shoulders outline, same conventions.
4. Match stroke weight / proportions to the screenshot; do not hardcode hex — color comes from parent text-color class.
5. Keep the file well under 200 lines.

## Todo List
- [x] Create `header-icons.tsx` with doc comment
- [x] `BellIcon` export (aria-hidden, currentColor)
- [x] `AvatarPersonIcon` export (aria-hidden, currentColor)
- [x] `npm run lint` clean; TS strict, zero `any`

## Success Criteria
- Both icons importable, render valid SVG, respect `className`, no TS/lint errors.
- No red dot / no border baked into the SVGs (composition deferred to phase-02).

## Risk Assessment
- **Icon proportions off vs design** — Likelihood Med / Impact Low. Countermove: phase-04 visual/e2e presence check + eyeball against screenshot; icons are swappable in isolation.

## Security Considerations
- None — static presentational SVG, no data, no user input.

## Next Steps
- Unblocks phase-02 (header composes these two icons).
