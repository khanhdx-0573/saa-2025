---
title: "Kudos Live Board"
description: "Communal recognition feed for Sun* Annual Awards 2025 — Highlight, Spotlight, All Kudos, likes, sidebar stats, profile + detail pages."
status: completed
priority: P1
effort: 38h
branch: feat/add_kudos
tags: [feature, frontend, backend, database, api]
blockedBy: []
blocks: []
work_type: feature
spec: docs/features/F002_KudosLiveBoard/
created: 2026-07-12
---

# Kudos Live Board

## Overview

Build the `/kudos` Live Board: banner + compose entry (reusing F001 modal), Highlight carousel (top-5 most-
hearted), interactive Spotlight word-cloud board, infinite-scroll All Kudos feed with image galleries, and a
sidebar (real stats + mock Secret Box / gift list). Adds ONE new write concept — likes/hearts (`kudos_likes`
+ `toggle_kudos_like` RPC) — plus read RPCs for feeds/spotlight/stats, and two new minimal read-only pages
(Kudos Detail, Sunner Profile) and a shared toast. Full requirements: see spec draft (FR/BR/SC/US IDs).

## MoMorph refs

- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Anonymous kudos card variant: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/p9vFVBE_tc
- Clarifications: [clarifications.md](./clarifications.md) · Spec draft: [spec/kudos-live-board/](./spec/kudos-live-board/)

## Track model (MoMorph two-track)

**Track B (backend/logic, chained):** phases 01→02. **Track A (UI, one screen-area per phase, parallel-
runnable):** phases 03–11 (only intra-Track-A shared-component deps). **NO blockedBy/blocks between Track A
and Track B** — both are parallel-runnable when `/tkm:takumi` executes; they meet at the Integration phase.

## Phases

| Phase | Name | Track | Status |
|-------|------|-------|--------|
| 1 | [Likes schema + RPCs](./phase-01-db-likes-and-read-rpcs.md) | B | Completed |
| 2 | [Data layer (types/queries/mutations/validation)](./phase-02-data-layer.md) | B | Completed |
| 3 | [Shared toast component](./phase-03-shared-toast.md) | A | Completed |
| 4 | [Shared kudos card family](./phase-04-shared-kudos-card.md) | A | Completed |
| 5 | [Banner + compose entry pill](./phase-05-banner-and-compose-entry.md) | A | Completed |
| 6 | [Highlight section](./phase-06-highlight-section.md) | A | Completed |
| 7 | [Spotlight board](./phase-07-spotlight-board.md) | A | Completed |
| 8 | [All Kudos feed](./phase-08-all-kudos-feed.md) | A | Completed |
| 9 | [Sidebar](./phase-09-sidebar.md) | A | Completed |
| 10 | [Sunner profile page](./phase-10-profile-page.md) | A | Completed |
| 11 | [Kudos detail page](./phase-11-kudos-detail-page.md) | A | Completed |
| 12 | [Integration](./phase-12-integration.md) | — | Completed |
| 13 | [Testing (unit + e2e)](./phase-13-testing.md) | — | Completed |

## Dependency graph

- Track B: 01 → 02.
- Track A: 03 (toast) → 04 (card, needs toast for copy-link); 04 → 06, 08, 11 (they render the card).
  05, 07, 09, 10 have no intra-track deps.
- Integration (12) blockedBy ALL of 01–11. Testing (13) blockedBy 12.

## Key dependencies

- Existing F001 schema/RPC (`create_kudos`) and data layer (`lib/kudos/*`) — extended, not modified in a
  breaking way. Existing `KudosModal` reused unchanged.
- `components/auth/auth-provider.tsx` `useAuth()` — current user for like self-disable + "this is me".
- Supabase local: apply new migrations with `npx supabase migration up --local`.

## Open Risks / Judgment Calls

1. **Spotlight layout** — deterministic golden-angle spiral scatter, spacing ∝ node size; minor overlap
   accepted (no collision lib, no new dep). Revisit if overlap is visually poor.
2. **Pagination** — offset (page ~10) chosen for KISS; keyset-by-`created_at` is the scaling upgrade (avoids
   drift on concurrent inserts).
3. **Heart counts derived** (no denormalized counter) — DRY/KISS; denormalized `heart_count` column is the
   scaling upgrade if feed aggregation gets slow.
4. **Star badges need sender+recipient received counts per card** → extra subqueries in the feed RPC; fine at
   event scale, flagged for perf.
5. **Spotlight node click target** — opens the recipient's latest-received kudos detail (node ≠ a single
   kudos). Confirm with design if a different target is wanted.
6. **Department filter** currently meaningless (all 'CEV1') — known data limitation, not a blocker (BR-08).
7. **No realtime** — likes/feed reflect on refetch/reload only.
