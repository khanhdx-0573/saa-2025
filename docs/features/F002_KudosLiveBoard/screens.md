---
status: draft
authored_by: planner
created: 2026-07-12
lang: en
---

## Screen List

| Screen | Type | Purpose |
|--------|------|---------|
| Live Board (`/kudos`) | Composite page | Full recognition feed: banner, compose entry + Sunner profile search box, Highlight carousel, Spotlight board, All Kudos feed, sidebar. Design item groups A / A.1 / B / B.1 / B.6–B.7 / C / D. |
| Kudos Card | Reusable component | Field set shared by Highlight, All Kudos, and Kudos Detail: sender & recipient blocks (+ star badges), title badge, timestamp, content (clamped), hashtag chips, heart/like, copy-link, view-details. Has an anonymous variant. |
| Spotlight Board | Bespoke canvas | Interactive pan/zoom word-cloud of recipient names sized by kudos-received count; total-count header, search bar, hover tooltip, click → kudos detail. |
| Kudos Detail (`/kudos/[id]`) | Page (new) | Minimal read-only single-kudos view: full card, all images, like, copy-link. |
| Sunner Profile (`/profile/[id]`) | Page (new) | Minimal read-only profile: avatar, name, department, star rating, kudos stats. |

## User Journey

1. Authenticated Sunner opens `/kudos` (middleware redirects unauthenticated users to `/login`).
2. Banner (A) and compose entry pill (A.1) render at top; clicking the pill opens the existing F001 "Viết Kudo" modal. Next to it, a "Tìm kiếm profile Sunner" search box looks up a colleague by name and navigates to their profile on selection — separate from the Spotlight board's own search.
3. Sunner reads the Highlight carousel (B) — top-5 most-hearted kudos of the event; prev/next arrows (disabled at ends), "n/5" label, center card prominent, side cards faded.
4. Sunner opens the Hashtag or Department dropdown (B.1); the selection filters BOTH Highlight and All Kudos and resets the All Kudos feed to page 1.
5. Sunner explores the Spotlight board (B.6/B.7): pans/zooms the canvas, searches a name, hovers a node for a tooltip (name + last received), clicks a node to open that recipient's latest kudos detail.
6. Sunner scrolls the All Kudos feed (C); more cards load on scroll (infinite scroll); image thumbnails open full-size on click.
7. On any card: Sunner taps the heart to like/unlike (own kudos cannot be liked), taps Copy Link (toast "Link copied — ready to share!"), or taps "Xem chi tiết" / content to open Kudos Detail.
8. Sunner taps any avatar/name (card sender/recipient, or sidebar gift-list row) to open that Sunner's Profile page.
9. Sidebar (D): the viewer sees their own real counts (kudos received, kudos sent, hearts received), a mock Secret Box block ("Mở quà" → coming-soon), and a mock "10 SUNNER NHẬN QUÀ MỚI NHẤT" list.
10. Empty states render "Hiện tại chưa có Kudos nào." (feeds) / "Chưa có dữ liệu" (gift list); each async section shows a loading state while fetching.
