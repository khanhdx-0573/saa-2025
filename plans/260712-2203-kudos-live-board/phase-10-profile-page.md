# Phase 10 — Sunner profile page (Track A)

**Goal:** A NEW minimal, read-only Sunner profile route (`/profile/[id]`): avatar, name, department, star
rating, kudos stats (received/sent/hearts). "This is me" awareness via `useAuth`. No intra-track dep; NO Track
B link.

**Screen refs:** navigation target of card avatars/names (B.3.2/B.3.5) and sidebar gift rows (D.3.2) — no
dedicated frame; minimal layout by App Router convention already in repo (`app/<feature>/page.tsx` → Header/
Footer + client shell).

**Owns / creates:** `app/profile/[id]/page.tsx` (server component: Header/Footer + client shell; not-found on
bad id), `components/profile/profile-page-client.tsx` (client shell), `components/profile/profile-stats.tsx`
(stat rows). Reuses `star-badge.tsx` (Phase 04) for the rating.

**Integration contract:**
- Data passed/fetched via `lib/profile/getProfileById` + reused `lib/kudos/getKudosStats` (Phase 02). During
  build use mock `ProfileDetail`; Integration binds the real queries and the `notFound()` path.
- `blockedBy` note: uses `star-badge` from Phase 04 — treat as intra-Track-A soft dep (import the component;
  build with mock star value if 04 not yet merged).

**Out of scope:** editing/updating a profile (read-only), avatar upload, any org/department management. i18n
catalog (Integration).

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
