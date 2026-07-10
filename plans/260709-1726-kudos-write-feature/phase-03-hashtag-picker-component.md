---
phase: 3
title: "Hashtag Picker Component"
status: completed
effort: "0.5d"
---

# Phase 3: Hashtag Picker Component

## Context Links

- Depends on: [Phase 2 — Backend Data Layer](./phase-02-backend-data-layer.md) (`listHashtags`)
- MoMorph screen: "Dropdown list hashtag" — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/p9zO-c4a4x
- Spec: [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md) → US002
- Existing component pattern: `components/ui/language-switcher.tsx` (only existing dropdown-style
  component in the repo — check its structure for the project's dropdown conventions before writing this)

## Overview

**Priority:** P1
**Status:** Pending

Builds the hashtag picker dropdown: a list of managed hashtags, each row toggleable, selected rows
show a check icon + dark background, unselected rows disable once 5 are already selected. This is a
standalone component consumed by the Write Kudos Modal (Phase 4) — build and visually verify it in
isolation first since it has its own MoMorph screen and test surface.

## Key Insights

- This is NOT a free-text combobox — it's a fixed managed list with toggle-select semantics only
  (per locked decision: no free-text hashtag creation).
- Max-5 enforcement lives in TWO places: this component disables further selection at the UI level
  (fast feedback), and the Phase 1 RPC re-validates count/validity server-side (defense in depth).
- Design tokens: reuse the existing `--details-*` CSS variables in `app/globals.css` / Tailwind
  `@theme inline` block (e.g. `bg-details-dropdown-list-selected` already exists for the selected-row
  background per the language-switcher pattern) — do NOT hardcode hex values per AGENTS.md.

## Requirements

- FR: render every active hashtag as a row with a check icon that shows/hides based on selection.
- FR: clicking a row toggles selection; hovering highlights the row background subtly.
- FR: once 5 hashtags are selected, every unselected row becomes non-interactive (disabled, no hover/click).
- FR: selection state is controlled by the parent (Write Kudos Modal) — this component is presentational + emits changes, it does not own the "committed" chip list.

## Architecture

```
<HashtagPicker
  hashtags={Hashtag[]}       // from listHashtags()
  selectedIds={number[]}     // controlled by parent
  onToggle={(id: number) => void}
  maxSelected={5}
/>
  -> <HashtagPickerRow> per hashtag (selected | unselected | disabled)
```

## Related Code Files

**Create:**
- `components/kudos/hashtag-picker.tsx` — the dropdown list + row rendering
- `components/kudos/hashtag-picker-row.tsx` — single row (keeps `hashtag-picker.tsx` under 200 lines
  per development-rules.md file-size guidance)

**Read for context:** `components/ui/language-switcher.tsx`, `app/globals.css`

## Implementation Steps

1. Read `components/ui/language-switcher.tsx` in full first — reuse its dropdown positioning/open-close
   pattern (likely `useState` + click-outside handling) rather than inventing a new one.
2. Check `app/globals.css` for a selected-row background token (`--details-dropdown-list-selected` is
   already defined there for the language dropdown) — reuse it for the selected hashtag row background
   instead of introducing a new token, unless the MoMorph design specifies a visually distinct color
   (compare against the screen image/spec before deciding; if distinct, add a new named token to
   `globals.css` following the existing `--details-*` naming convention — never a raw hex in the component).
3. Build `HashtagPickerRow` (single row):
   - Props: `hashtag: Hashtag`, `selected: boolean`, `disabled: boolean`, `onToggle: () => void`.
   - Renders `#{hashtag.name}` (left) + a 24x24px check-icon slot (right) that's either the check
     icon (selected) or an empty spacer (unselected) — per spec, the spacer must reserve the same
     24x24px so the row doesn't shift width when toggled.
   - `disabled` rows: no `onClick`, no hover background change, reduced-opacity or muted text per
     design (verify exact disabled styling against the MoMorph screenshot/spec before hardcoding).
4. Build `HashtagPicker` (list container):
   - Computes `disabled = selectedIds.length >= maxSelected && !selectedIds.includes(hashtag.id)`
     per row — this is the ONLY place the max-5 rule is evaluated in this component.
   - Renders one `HashtagPickerRow` per hashtag from `listHashtags()` (fetched by the parent and
     passed down as `hashtags` prop — keep this component free of data-fetching per the existing
     pattern where `google-login-button.tsx` does its own fetch but simple presentational lists
     don't; parent-fetches-once is simpler here since the modal already needs the list for chip labels).
5. Add i18n keys for any static copy (dropdown has no static text per the design — labels are all
   hashtag names from the DB — but add an empty-state string, e.g. "No hashtags available", to
   `messages/en.json` / `messages/vi.json` under a new `"KudosModal"` namespace, shared with Phase 4/5).

## Todo List

- [x] `HashtagPickerRow` — check-icon slot reserves space, no layout shift on toggle
- [x] `HashtagPicker` — max-5 disable logic computed per-row, not globally frozen
- [x] Reuses existing `--details-*` design tokens, no hardcoded hex/px magic values beyond what
      Tailwind arbitrary values are already used for elsewhere in the repo
- [x] Visually compare against the MoMorph screenshot for screen `p9zO-c4a4x` before marking done

## Success Criteria

- [x] Selecting a 6th hashtag is impossible via this component alone (disabled rows don't fire `onToggle`)
- [x] Deselecting one hashtag when at 5/5 immediately re-enables all previously-disabled rows
- [x] Hover state only applies to enabled rows
- [x] `npm run lint` passes; component files stay under ~150 lines each

## Risk Assessment

- **Disabled-row styling ambiguity**: the spec text describes disabled behavior functionally
  ("không phản hồi click") but the exact visual treatment (opacity/color) isn't pixel-specified in
  the text spec — pull the MoMorph screenshot/design tokens via `get_frame_image`/`get_screenshot`
  before finalizing, rather than guessing.

## Security Considerations

None — this component only reads a public, pre-filtered (`is_active`) hashtag list; no user input
is persisted here.

## Next Steps

- Phase 4 (Write Kudos Modal) mounts `<HashtagPicker>` inside the "+ Hashtag" popover/dropdown and
  owns the committed chip list + selected-ids state.
