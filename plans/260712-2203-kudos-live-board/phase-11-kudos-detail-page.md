# Phase 11 — Kudos detail page (Track A)

**Goal:** A NEW minimal, read-only single-kudos route (`/kudos/[id]`): one full `KudosCard` with all images,
functional like + copy-link. `blockedBy` Phase 04 (renders `KudosCard`). Intra-Track-A only — NO Track B link.

**Screen refs:** navigation target of "Xem chi tiết" / card content / spotlight node — no dedicated frame;
reuses the shared card at full fidelity (all images, no content clamp) by App Router convention.

**Owns / creates:** `app/kudos/[id]/page.tsx` (server component: Header/Footer + client shell; `notFound()` on
missing id — NOTE: distinct route from existing `app/kudos/page.tsx`, no conflict), `components/kudos/kudos-
detail-page-client.tsx` (client shell rendering `<KudosCard contentLines={5} showImages />` for the single
kudos).

**Integration contract:**
- Data via `lib/kudos/getKudosDetail(id)` (Phase 02) + `toggleKudosLike` wiring. Build with a mock `KudosCard`;
  Integration binds the real query, like callback, copy-link url, and the `notFound()` path.

**Out of scope:** editing a kudos (read-only), comments/threads, related-kudos. i18n catalog (Integration).

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Anonymous card variant: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/p9vFVBE_tc
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
