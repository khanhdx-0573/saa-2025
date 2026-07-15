# Phase 04 — Shared kudos card family (Track A)

**Goal:** ONE reusable, presentational Kudos Card component family used by Highlight (06), All Kudos (08), and
Detail (11). Props-only (no data fetching, no lib imports) so it's parallel-safe. `blockedBy` Phase 03 (copy-
link uses `useToast`). Intra-Track-A dep only — NO Track B link.

**Screen refs:** B.3/B.4/B.5 card fields; anonymous variant screen `p9vFVBE_tc` (incognito avatar + alias +
"Người gửi ẩn danh"). Design item group B, C card field set.

**Owns / creates (all in `components/kudos/`):** `kudos-card.tsx` (shell; prop `contentLines: 3 | 5`,
`showImages: boolean`), `kudos-card-party.tsx` (sender/recipient block; handles anonymous variant via
`isAnonymous`), `star-badge.tsx` (prop `stars: 0|1|2|3` + tooltip), `hashtag-chips.tsx` (display),
`heart-button.tsx` (props `count`, `liked`, `disabled`, `onToggle`), `copy-link-button.tsx` (prop `url`;
calls `useToast`), `kudos-image-gallery.tsx` (thumbnails + full-image viewer), `kudos-live-board-icons.tsx`
(card-scoped SVGs). Do NOT edit existing `kudos-icons.tsx` (F001-owned).

**Integration contract (consumed by 06/08/11/12):**
- `<KudosCard card={KudosCard} contentLines={3|5} showImages onLike onOpenDetail onOpenProfile />` — all data +
  callbacks passed in. Star values, like state, and URLs come from props (computed by containers at Integration).
- Anonymous handling lives inside `kudos-card-party` (driven by `card.isAnonymous`).
- Strings: use Vietnamese mock text now; Integration swaps to `useTranslations`.

**Out of scope:** data fetching, `toggleKudosLike` wiring, star computation, i18n catalog entries (all
Integration). Uses mock `KudosCard` data extracted from Figma.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Anonymous card variant: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/p9vFVBE_tc
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
