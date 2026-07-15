# Phase 09 — Sidebar (Track A)

**Goal:** The right sidebar (D): a REAL stats block (kudos received / sent / hearts received — current user), a
MOCK Secret Box block, and a MOCK "10 SUNNER NHẬN QUÀ MỚI NHẤT" gift-recipients list. Independent scroll. No
intra-track dep; NO Track B link.

**Screen refs:** D.1 stats (real), D.1.6/7/8 Secret Box (mock), D.3 gift list (mock).

**Owns / creates (in `components/kudos/`):** `kudos-sidebar.tsx` (shell + independent scroll), `sidebar-stats.tsx`
(3 real counts — values passed in as props), `secret-box-block.tsx` (static numbers + "Mở quà" → coming-soon
state; no backend), `gift-recipients-list.tsx` (static mock array of avatar+name+prize rows; avatar/name →
profile nav; empty state "Chưa có dữ liệu").

**Integration contract:**
- `<SidebarStats stats={KudosStats} />` — real values passed in (Integration calls `getKudosStats(currentUserId)`
  via `useAuth`).
- Secret Box + gift list hold their OWN mock/static data inside the component (locked decision) — Integration
  does not wire them to any backend; only the gift-row profile navigation is real.

**Out of scope:** `getKudosStats` call + `useAuth` binding (Integration). Any real Secret Box / gift backend
(explicitly mock). i18n catalog (Integration).

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
