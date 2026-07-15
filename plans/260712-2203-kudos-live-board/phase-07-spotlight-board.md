# Phase 07 — Spotlight board (Track A)

**Goal:** The interactive SPOTLIGHT BOARD (B.6/B.7): header "{total} KUDOS" + search bar (placeholder "Tìm
kiếm", max 100 chars) + pan/zoom toggle + a custom SVG/CSS word-cloud of recipient nodes sized by received
count. Hover → tooltip (name + last received); click node → recipient's latest kudos detail. Bespoke — does
NOT use `KudosCard`, so NO intra-track dep; NO Track B link.

**Screen refs:** B.6/B.7 spotlight canvas. Custom SVG/CSS, NO new npm dependency (locked decision).

**Owns / creates (in `components/kudos/`):** `spotlight-board.tsx` (canvas shell + header + search + states),
`spotlight-node.tsx` (single sized/positioned name + tooltip), `use-pan-zoom.ts` (drag-pan + wheel/button-zoom
hook, clamp ~0.5–3), `spotlight-layout.ts` (deterministic golden-angle spiral placement + font-size scaling —
pure fn, unit-testable).

**Integration contract:**
- `<SpotlightBoard data={SpotlightData} loading onOpenDetail(lastKudosId) />` — data (`totalKudos` + `nodes[]`)
  passed in (Integration calls `getSpotlightData` with the shared filters). Search filters loaded nodes client-
  side. Node click calls `onOpenDetail(node.lastKudosId)`.

**Out of scope:** the `getSpotlightData` call + filter wiring (Integration). Layout algorithm detail + pan/zoom
are IN scope (bespoke, not covered by `momorph-implement-design`). Build with mock `SpotlightData`.

**Judgment calls (see plan.md risks):** spiral scatter w/ minor-overlap-accepted; node → latest-received-kudos
detail.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
