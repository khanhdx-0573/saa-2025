# Phase 08 — All Kudos feed (Track A)

**Goal:** The ALL KUDOS section (C): infinite-scroll feed of kudos cards (content clamp 5 lines, up to 5 image
thumbnails, thumbnail → full image). Same shared filters as Highlight. `blockedBy` Phase 04 (renders
`KudosCard` with `contentLines={5}` `showImages`). Intra-Track-A only — NO Track B link.

**Screen refs:** C (ALL KUDOS feed). Image gallery reuses `kudos-image-gallery.tsx` from Phase 04.

**Owns / creates (in `components/kudos/`):** `all-kudos-section.tsx` (section shell + empty/loading states +
IntersectionObserver sentinel), `use-kudos-feed.ts` (infinite-scroll hook: pages, offset, loading, hasMore,
dedup by id, `loadMore()`).

**Integration contract:**
- `<AllKudosSection filters={KudosFilters} onLike onOpenDetail onOpenProfile />` OR pages passed in — but the
  fetch loop lives in `use-kudos-feed.ts`, which at Integration is pointed at `listAllKudos(filters, limit,
  offset)`. During build the hook uses a mock page-fetcher injected via prop/default so the section is
  parallel-safe. Filter changes reset the hook to page 1.

**Out of scope:** the real `listAllKudos` binding + shared filter state ownership (Integration). Star/like
wiring, i18n catalog (Integration). Pagination = offset (page ~10) per spec; keyset is the noted upgrade.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
