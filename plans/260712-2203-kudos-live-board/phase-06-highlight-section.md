# Phase 06 — Highlight section (Track A)

**Goal:** The HIGHLIGHT KUDOS section (B/B.1): header + two filter dropdowns (Hashtag, Phòng ban) + a carousel
of ≤5 kudos cards (center prominent, sides faded, prev/next arrows disabled at ends, "n/5" label). `blockedBy`
Phase 04 (renders `KudosCard`). Intra-Track-A only — NO Track B link.

**Screen refs:** B (`2940:13451` carousel), B.1 (`2940:13452` header + filters).

**Owns / creates (in `components/kudos/`):** `highlight-section.tsx` (section shell + empty/loading states),
`highlight-carousel.tsx` (slide nav, faded sides, position label), `kudos-filters.tsx` (Hashtag + Department
dropdowns — controlled: value + onChange props).

**Integration contract:**
- `<KudosFilters value={KudosFilters} hashtags department onChange />` — controlled; filter STATE is owned by
  the board shell (Integration) so it's shared with All Kudos and resets its pagination on change.
- `<HighlightSection cards={KudosCard[]} loading onLike onOpenDetail onOpenProfile />` — cards passed in
  (Integration calls `listHighlightKudos`). Empty state text via prop/mock now.

**Out of scope:** the `listHighlightKudos` call + filter state ownership (Integration). Star computation, like
wiring, i18n catalog (Integration). Build with mock `KudosCard[]`.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
