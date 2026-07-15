---
status: draft
authored_by: planner
created: 2026-07-12
lang: en
---

# Kudos Live Board

## Overview

The Live Board (`/kudos`) is the communal recognition feed for Sun* Annual Awards 2025. It reuses the
existing F001 kudos data model (kudos, hashtags, images, mentions, profiles) read-only and adds ONE new
write concept — likes/hearts — plus a set of read paths for aggregated feeds, spotlight nodes, and personal
stats. It also introduces two minimal read-only pages (Kudos Detail, Sunner Profile) and one shared toast.
Must not contradict F001 business rules (anonymous kudos never persist sender identity; all kudos writes go
through `create_kudos`).

## Polymorphic Behavior

The Kudos Card renders two variants driven by `is_anonymous`:
- **Identified**: sender block = real avatar + name + department + star badge.
- **Anonymous**: sender block = incognito avatar graphic + `anonymous_display_name` alias + "Người gửi ẩn danh"
  label (no department, no star badge). Recipient side is identical in both variants. The heart button is
  fully functional on anonymous cards; only heart *crediting* is skipped (no sender account to credit).

## Cross-Cutting Logic

### Functional Requirements

- **FR-001** — Banner (A): read-only hero, "Hệ thống ghi nhận lời cảm ơn" + SAA 2025 KUDOS logo.
- **FR-002** — Compose entry (A.1): pill-shaped input with pencil icon + placeholder "Hôm nay, bạn muốn gửi
  lời cảm ơn và ghi nhận đến ai?"; click opens the existing F001 KudosModal unchanged.
- **FR-003** — Highlight (B): show the top-5 kudos by heart count across the whole event (all-time, not
  date-scoped), each as a Kudos Card.
- **FR-004** — Filters (B.1): a Hashtag dropdown and a Department dropdown; a selection filters BOTH the
  Highlight and All Kudos sections (shared filter state) and resets the All Kudos feed to page 1.
- **FR-005** — Highlight carousel: prev/next arrows (disabled at first/last), an "n/5" position label, center
  card prominent, side cards faded/non-interactive.
- **FR-006** — Kudos Card field set: sender block, decorative arrow, recipient block, timestamp
  "HH:mm - MM/DD/YYYY", title badge (the `kudos.title`, distinct from #hashtags), content (line-clamped, 3
  lines in Highlight / 5 in All Kudos, ellipsis), up to 5 hashtag chips (1 line, ellipsis), heart count + like
  button, Copy Link button, "Xem chi tiết" link.
- **FR-007** — Star rating badge on sender & recipient blocks based on that profile's kudos-*received* count:
  1★ at ≥10, 2★ at ≥20, 3★ at ≥50; hover shows a tooltip explaining the threshold.
- **FR-008** — Heart/like toggle: any authenticated user may like/unlike any kudos except one they authored;
  liking is idempotent (one like per user per kudos); the card heart count reflects total likes; unliking
  reverses it.
- **FR-009** — Anonymous card variant per Polymorphic Behavior; like works, no heart credited.
- **FR-010** — Copy Link: copies the kudos detail URL (`{origin}/kudos/{id}`) to the clipboard and shows a
  toast "Link copied — ready to share!".
- **FR-011** — Spotlight board (B.6/B.7): header "{total kudos count} KUDOS" (real DB count), a Sunner search
  bar (placeholder "Tìm kiếm", max 100 chars), a pan/zoom toggle, and a canvas of scattered recipient names
  sized by kudos-received count; hover → tooltip (name + last-received timestamp); click node → the
  recipient's latest-received kudos detail. Loading / empty / interactive states.
- **FR-012** — All Kudos feed (C): infinite-scroll list of Kudos Cards (content clamp 5 lines); each card shows
  up to 5 attached image thumbnails in a horizontal row; clicking a thumbnail opens the full image.
- **FR-013** — Sidebar stats (D.1, REAL, scoped to current user): "Số Kudos bạn nhận được" (count where
  recipient_id = me), "Số Kudos bạn đã gửi" (count where sender_id = me), "Số tim bạn nhận được" (total likes
  on kudos where sender_id = me).
- **FR-014** — Sidebar Secret Box block (D.1.6/7/8, MOCK): static "đã mở"/"chưa mở" numbers + "Mở quà" button
  that shows a coming-soon state on click. No backend.
- **FR-015** — Sidebar gift-recipients list (D.3, MOCK): static array of avatar+name+prize rows; clicking a
  row's avatar/name navigates to that Sunner's profile (real navigation, mock list data). Empty state
  "Chưa có dữ liệu".
- **FR-016** — Sunner Profile page (`/profile/[id]`, new, minimal, read-only): avatar, name, department, star
  rating, and kudos stats (received/sent/hearts) for the target profile; "this is me" awareness via useAuth.
- **FR-017** — Kudos Detail page (`/kudos/[id]`, new, minimal, read-only): a single full Kudos Card with all
  images, functional like and copy-link; 404 for a missing/invalid id.
- **FR-018** — Every async section shows a loading state while fetching and an empty state when there is no
  data ("Hiện tại chưa có Kudos nào." for feeds; "Chưa có dữ liệu" for the gift list).
- **FR-019** — Navigation: avatar/name (card sender/recipient, sidebar gift row) → Profile page; "Xem chi
  tiết"/card content → Kudos Detail; spotlight node → Kudos Detail of the recipient's latest kudos.
- **FR-020** — All user-facing strings go through next-intl (en.json + vi.json); no hardcoded copy in JSX
  after integration.

### Business Rules

- **BR-01** — Highlight set = the 5 kudos with the highest heart count, event-wide, re-derived on every load
  (and reflecting like changes). No separate "featured" flag or column.
- **BR-02** — A kudos' heart count is the number of `kudos_likes` rows for it (derived, no denormalized
  counter).
- **BR-03** — "Hearts received" for a user = total `kudos_likes` on kudos where `sender_id` = that user.
  Anonymous kudos (`sender_id` NULL) contribute to no one's total.
- **BR-04** — A user cannot like their own kudos (`sender_id` = auth.uid()); enforced server-side in the
  toggle RPC and reflected as a disabled/no-op heart button in the UI.
- **BR-05** — One like per user per kudos, enforced by a composite primary key `(kudos_id, user_id)`.
- **BR-06** — Star thresholds by kudos-received count: 1★ ≥ 10, 2★ ≥ 20, 3★ ≥ 50; below 10 = no star.
- **BR-07** — Secret Box block and gift-recipients list are display-only mock data; no tables, no persistence.
- **BR-08** — Department filter matches `profiles.department`; all rows currently default to 'CEV1' (no
  department source system yet) — a known data limitation, not a blocker (see F001 department migration).
- **BR-09** — Hashtag + Department filters are a single shared state across Highlight and All Kudos; any
  change resets All Kudos pagination to page 1.
- **BR-10** — Liking an anonymous kudos is a silent no-op on heart crediting (sender is NULL); the like itself
  is recorded normally and counts toward the card's heart count.

### Decision Logic

- Heart button state: shown active (filled) when the current user has a `kudos_likes` row for the kudos;
  disabled/non-interactive when `sender_id` = auth.uid() (own kudos).
- Carousel arrows: prev disabled at index 0; next disabled at the last of ≤5 highlight cards.
- Filter change: re-query Highlight with the new filter AND reset All-Kudos offset to 0 and re-query.
- Spotlight node size: font size scales linearly between a min and max bound over the min..max received-count
  range across visible nodes; all-equal counts fall back to the min size.

### State Machines

None. The board is a set of independent read sections plus a like-toggle. Like is a two-state toggle
(liked/unliked) per (user, kudos) with the count derived; no multi-step wizard.

### Algorithms

- **Star rating** — `stars(receivedCount) = receivedCount >= 50 ? 3 : receivedCount >= 20 ? 2 :
  receivedCount >= 10 ? 1 : 0`. Single source of truth in `lib/kudos/validation.ts`.
- **Spotlight layout** — deterministic scatter: sort recipients by received-count desc; place along an
  Archimedean/golden-angle spiral from the canvas center (largest nodes nearest center), spacing proportional
  to node size to reduce (not eliminate) overlap; positions seeded off `recipient_id` so they are stable
  across renders. No collision-detection library (custom SVG/CSS, no new deps).
- **Pan/zoom** — nodes wrapped in an SVG `<g transform="translate(panX,panY) scale(zoom)">`; pointer drag
  updates pan, wheel/buttons update zoom (clamped ~0.5–3), toggle icon switches pan mode / resets view.
- **Spotlight search** — client-side substring filter of already-loaded nodes (dim/hide non-matches);
  input capped at 100 chars.
- **Infinite scroll** — offset pagination (page size ~10) ordered by `created_at` desc; an IntersectionObserver
  sentinel at the feed tail loads the next page. (Keyset-by-`created_at` is the scaling upgrade — see risks.)

### External Integrations

- Supabase Auth (existing) — `/kudos`, `/profile/*`, `/kudos/*` are auth-gated by existing middleware.
- Supabase Postgres (existing tables read-only; ONE new table `kudos_likes` + new RPCs).
- Supabase Storage (existing `kudos-images` bucket) — read image URLs for galleries.

### Verification

Success is confirmed when: a `kudos_likes` row toggles on like/unlike; the card heart count and the sidebar
"hearts received" reflect the change on refetch; own-kudos likes are rejected; Highlight shows the true top-5
by count; filters constrain both sections and reset All-Kudos paging; copy-link places `/kudos/{id}` on the
clipboard with a toast; the Spotlight canvas renders sized nodes and navigates on click; profile and detail
pages load real data and 404 on bad ids; all strings resolve through en/vi catalogs.

**Client behavior:** see edge-cases.md.

## User Stories

- **US001 — View Highlight carousel.** As a Sunner I want to see the most-hearted kudos of the event so I can
  see standout recognition. AC: top-5 by heart count; arrows disable at ends; "n/5" label; empty state when
  none. (FR-003, FR-005, FR-018)
- **US002 — Like a kudos.** As a Sunner I want to heart a kudos to reward its author. AC: tapping toggles
  filled/unfilled and count ±1; I cannot like my own kudos; anonymous kudos like works but credits no one;
  state persists on reload. (FR-008, FR-009, BR-02..BR-05, BR-10)
- **US003 — Filter the board.** As a Sunner I want to filter by hashtag/department. AC: selection updates both
  Highlight and All Kudos and resets All Kudos to page 1. (FR-004, BR-09)
- **US004 — Browse All Kudos.** As a Sunner I want to scroll every kudos with images. AC: infinite scroll loads
  more without dupes/gaps; up to 5 thumbnails per card; thumbnail opens full image; empty state when none.
  (FR-012, FR-018)
- **US005 — Explore the Spotlight board.** As a Sunner I want to see who's recognized most. AC: nodes sized by
  received count; pan/zoom works; search filters; hover tooltip; click opens the recipient's latest kudos
  detail; total count shown. (FR-011)
- **US006 — See my stats.** As a Sunner I want my personal counts. AC: received/sent/hearts match DB for me;
  mock Secret Box + gift list render with mock data. (FR-013, FR-014, FR-015)
- **US007 — Copy a share link.** As a Sunner I want to share a kudos. AC: correct `/kudos/{id}` copied + toast.
  (FR-010)
- **US008 — View a Sunner profile.** As a Sunner I want to open someone's profile from an avatar/name. AC:
  minimal read-only profile with real data; 404 on bad id. (FR-016, FR-019)
- **US009 — View a kudos detail.** As a Sunner I want a shareable single-kudos page. AC: full card, all images,
  like + copy work; 404 on bad id. (FR-017, FR-019)
- **US010 — Anonymous card.** As a Sunner I want anonymous kudos shown without exposing the sender. AC:
  incognito avatar + alias + "Người gửi ẩn danh"; recipient unchanged; like works; no hearts credited.
  (FR-009, BR-10)

## Success Criteria

- **SC-01** — Like increments the card heart count by 1 and marks active; unlike reverses; both persist across
  reload. (US002)
- **SC-02** — A user's own kudos heart button is disabled/no-op; the toggle RPC rejects self-likes. (BR-04)
- **SC-03** — Highlight always shows ≤5 highest-hearted kudos; order updates after like changes. (BR-01)
- **SC-04** — A filter change updates both sections and resets All-Kudos to page 1. (BR-09)
- **SC-05** — Copy Link places the correct `/kudos/{id}` URL on the clipboard and a toast appears. (FR-010)
- **SC-06** — Infinite scroll loads further pages with no duplicated or skipped cards. (FR-012)
- **SC-07** — Spotlight node sizes correlate with received counts; clicking a node opens the correct detail.
  (FR-011)
- **SC-08** — Sidebar received/sent/hearts equal the DB counts for the current user. (FR-013, BR-03)
- **SC-09** — Star badge count matches the 10/20/50 thresholds. (BR-06)
- **SC-10** — Anonymous card hides the sender identity, like works, and no user's "hearts received" changes.
  (US010, BR-10)
- **SC-11** — Profile and Detail pages render real data read-only and return 404 on a missing id. (FR-016,
  FR-017)
- **SC-12** — After integration, all board strings resolve through en/vi catalogs; no hardcoded JSX copy.
  (FR-020)

## Key Entities

- **kudos_likes** (NEW) — one row per (user, kudos) like: `kudos_id` (uuid, FK → kudos, on delete cascade),
  `user_id` (uuid, FK → profiles, on delete cascade), `created_at` (timestamptz); composite PK
  `(kudos_id, user_id)` (enforces one-like-per-user, BR-05). RLS: select for authenticated (true); NO direct
  insert/update/delete grant — all writes via `toggle_kudos_like` RPC.
- **kudos / kudos_hashtags / kudos_images / kudos_mentions / hashtags / profiles** — existing F001 tables,
  read-only here. `profiles.department` used by the department filter (all 'CEV1' currently).

## New RPCs (contract)

All SECURITY DEFINER unless noted; granted to `authenticated`; follow the `create_kudos` template
(`supabase/migrations/20260709120845_kudos_rpc.sql`). Read RPCs may be `language sql stable` (invoker) since
RLS already permits authenticated select-all; `auth.uid()` still resolves for `liked_by_me`.

- `toggle_kudos_like(p_kudos_id uuid) returns jsonb` → `{ liked: boolean, heart_count: int }`. Rejects
  self-like (sender_id = auth.uid()); inserts or deletes the `kudos_likes` row idempotently; returns the new
  state + fresh count.
- `get_kudos_feed(p_hashtag_id bigint, p_department text, p_limit int, p_offset int) returns jsonb` → ordered
  (created_at desc) array of card objects, each with sender/recipient profile (or anonymous alias), title,
  content, created_at, is_anonymous, hashtags[], images[], heart_count, liked_by_me, sender_received_count,
  recipient_received_count. NULL filter params = no filter.
- `get_highlight_kudos(p_hashtag_id bigint, p_department text) returns jsonb` → same card shape, top-5 by
  heart_count desc.
- `get_spotlight_nodes(p_hashtag_id bigint, p_department text) returns jsonb` → `{ total_kudos: int,
  nodes: [{ recipient_id, full_name, avatar_url, received_count, last_received_at, last_kudos_id }] }`.
- `get_kudos_detail(p_kudos_id uuid) returns jsonb` → one card object (all images, full content) or null.
- `get_kudos_stats(p_user_id uuid) returns jsonb` → `{ received: int, sent: int, hearts: int }` (hearts per
  BR-03).

## Assumptions

- Heart counts and stats are derived from `kudos_likes` at query time (KISS/DRY, no denormalized counters) —
  acceptable at single-event data volume; a denormalized counter is the scaling upgrade (see risks).
- Card hashtags/images are aggregated inside the read RPCs via `json_agg` to keep each feed page one round-trip.
- Vietnamese is the primary UI locale (design copy); strings live in en.json + vi.json.

## Source Code References

- Reuse: `lib/kudos/{types,queries,mutations,validation}.ts`, `lib/supabase/*`, `components/auth/auth-provider.tsx`
  (`useAuth`), `components/kudos/kudos-modal.tsx` (compose, unchanged), `app/kudos/page.tsx`.
- New migrations after `20260710105300_profiles_department.sql`.

## Unresolved Questions

See plan.md "Open Risks / Judgment Calls".
