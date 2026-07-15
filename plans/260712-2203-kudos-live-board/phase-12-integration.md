# Phase 12 — Integration (cross-track merge)

## Context Links

- Spec: [technical-spec.md](./spec/kudos-live-board/technical-spec.md) (all FR/BR), [edge-cases.md](./spec/kudos-live-board/edge-cases.md).
- Consumes Track B data layer (Phase 02) + all Track A components (Phases 03–11).

## Overview

- **Priority:** P1 · **Status:** Pending · **blockedBy:** ALL of Phases 01–11.
- The merge point (MoMorph two-track model): assemble the board shell, own the shared filter state, wire every
  presentational Track A section to the real Track B queries/mutations, compute star ratings, wire like/copy,
  and migrate all mock strings to next-intl catalogs. This is the ONLY phase that edits both the board shell
  and the message catalogs (single-owner to avoid parallel conflicts).

## Key Insights

- Track A shipped presentational components with mock props; Track B shipped data fns. Integration is glue —
  minimal new logic, mostly wiring + state ownership.
- Filter state (Hashtag + Department) is board-level: shared by Highlight + All Kudos; a change resets the feed
  hook to page 1 (BR-09).
- Star values are computed HERE via `starRating(receivedCount)` from the card's sender/recipient counts and
  passed to `star-badge` (keeps components pure).
- Like/copy handled HERE: `toggleKudosLike` + optimistic count update; copy builds `{origin}/kudos/{id}` +
  `useToast`.

## Requirements

- Fulfills the wiring for FR-002,003,004,005,006,007,008,009,010,011,012,013,015,016,017,018,019,020 and all SC.

## Architecture

**Data flow (assembled):**
```
app/kudos/page.tsx (server: Header/Footer)
  └─ kudos-page-client.tsx (board shell, "use client")
       ├─ filter state {hashtagId, department}  ← KudosFilters (Phase 06)
       ├─ KudosBanner + ComposeEntryBar           (Phase 05)
       ├─ HighlightSection  ← listHighlightKudos(filters)         (06 + 02)
       ├─ SpotlightBoard    ← getSpotlightData(filters)           (07 + 02)
       ├─ AllKudosSection   ← use-kudos-feed → listAllKudos(...)   (08 + 02)
       └─ KudosSidebar      ← getKudosStats(useAuth().user.id)     (09 + 02)
Like:  heart-button.onToggle → toggleKudosLike(id) → update count/liked
Copy:  copy-link-button → clipboard {origin}/kudos/{id} → useToast(t("copied"))
Nav:   onOpenProfile → /profile/[id] ; onOpenDetail → /kudos/[id]
Star:  starRating(sender/recipientReceivedCount) → star-badge
```

**Shell:** rewrite `app/kudos/page.tsx` (compose the board) and replace `components/kudos/kudos-page-client.tsx`
(button → board shell holding filter state + section composition). Existing `KudosModal` stays reused via
`ComposeEntryBar`.

**i18n:** add all Live-Board strings to `messages/en.json` + `messages/vi.json` under a `KudosLiveBoard`
namespace (Vietnamese from Figma; English translated); replace Track A mock strings with `useTranslations`.

## Related Code Files

- **Modify:** `app/kudos/page.tsx`, `components/kudos/kudos-page-client.tsx`, `messages/en.json`,
  `messages/vi.json`.
- **Modify (wire mock→real):** section containers from Phases 06/07/08/09/10/11 (swap injected mock fetchers
  for the Phase 02 queries; add star computation + like/copy callbacks). Temporal ownership — Integration runs
  AFTER Track A, so no parallel conflict.
- **Read:** all Phase 02 lib fns; `components/auth/auth-provider.tsx`.

## Related Spec IDs

FR-002..FR-020 (wiring); SC-01..SC-12.

## Implementation Steps

1. Rewrite `kudos-page-client.tsx` as the board shell: filter state + section layout + sidebar (2-column).
2. Wire Highlight, Spotlight, Sidebar to their Phase 02 queries (client-side `createClient`, matching existing
   compose fetch pattern).
3. Wire `use-kudos-feed` to `listAllKudos`; ensure filter change resets to page 1 (BR-09) and dedups (SC-06).
4. Wire like (optimistic + `toggleKudosLike`, self-disable via `useAuth`), copy-link (+ toast), and star
   computation into cards.
5. Wire navigation (`useRouter`) for profile/detail/node open; bind `getKudosDetail`/`getProfileById` +
   `notFound()` in Phases 10/11 pages.
6. Migrate all strings to `messages/{en,vi}.json`; replace mock copy with `useTranslations`.
7. `npm run lint` + build; manual walk of the full user journey (spec screens.md).

## Todo List

- [x] Board shell + shared filter state (reset feed on change)
- [x] Highlight / Spotlight / Sidebar wired to real queries
- [x] Infinite-scroll feed wired + dedup + filter reset
- [x] Like (optimistic + self-disable) + copy-link (+ toast) + star computation
- [x] Navigation + detail/profile pages bound (+ notFound)
- [x] i18n en/vi catalogs; no hardcoded JSX strings
- [x] Lint + build clean; journey walkthrough

## Success Criteria

- Full journey (screens.md steps 1–10) works end-to-end against real data (SC-01..SC-12).
- Filter change updates both sections + resets feed (SC-04); like persists (SC-01); copy + toast (SC-05).
- No hardcoded board copy remains (SC-12).

## Risk Assessment

- **Optimistic like desync (Med/Low):** UI count vs server. Mitigation: reconcile with the RPC's returned
  `heart_count`; revert on error.
- **Offset drift on concurrent insert (Low/Low):** possible dup/skip mid-scroll. Mitigation: dedup by id in
  the feed hook; keyset upgrade noted.
- **Contract mismatch (Med/Med):** Track A prop shapes vs Phase 02 types. Mitigation: `KudosCard` is the shared
  contract type from Phase 02 — Track A imports the type, Integration passes real instances.
- **Rollback:** revert shell + catalog edits; Track A/B artifacts are independently revertible (additive).

## Security Considerations

- Self-like enforced server-side (Phase 01) — client disable is UX only, not the guard.
- Copy-link builds a URL from `window.location.origin` — no injection surface.
- All pages remain behind existing auth middleware.

## Next Steps

- Hand off to Phase 13 (testing) once the journey passes manually.
