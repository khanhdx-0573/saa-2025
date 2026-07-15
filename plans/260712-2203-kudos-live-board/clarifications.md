# Clarifications — Sun* Kudos - Live Board

MoMorph screen: Sun* Kudos - Live board — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ

## Session 2026-07-12

- Q: The Spotlight word-cloud board (B.7) needs pan/zoom, hover tooltips, and click-to-detail on scattered Sunner names. How should it be built? → A: Custom SVG/CSS, no new deps — hand-built pan/zoom + node layout (simple scatter/grid sized by kudos count) using plain SVG and CSS transforms, no new dependency.
- Q: Liking a kudos on a special admin-configured day credits +2 hearts instead of +1. Build that for real this pass? → A: Skip for now (1 heart always) — standard 1-heart-per-like only; 2x special-day bonus is a backlog item, no new table this pass.
- Q: Anonymous kudos have no sender_id. When someone likes an anonymous kudos, who gets the heart credit? → A: No one gets credited — anonymous senders forgo heart rewards, consistent with the existing "no identity persisted for anonymous kudos" decision from Send Kudos (F001). Confirmed via screenshot of MoMorph screen `p9vFVBE_tc` ("Ẩn danh", node 2099:9148 in file 9ypp4enmFmdK3YAFJLIu6C): heart button is fully active/visible on anonymous kudos cards (shows count, red filled icon when liked) — the like mechanic itself is unaffected, only heart *crediting* is skipped since there's no sender account to credit.
- Q: Avatars/names and "Xem chi tiết" link to a Sunner profile page and a Kudos detail page — neither exists yet. Build them in this plan? → A: Build both (minimal) — minimal read-only profile page (name, avatar, department, kudos stats) and minimal kudos-detail page, both in scope for this plan.
- Q: The sidebar description mentions a "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" (rank-up) leaderboard with no individual design items and not visible in the frame capture. Include it? → A: Omit it — only build the "Nhận quà mới nhất" (gift recipients) list that's actually visible in this frame.

## Pre-existing user instruction (given before formal clarification)

- Secret Box stats (D.1.6 "Số Secret Box bạn đã mở", D.1.7 "Số Secret Box chưa mở") and the "Mở quà" button (D.1.8): Secret Box feature does not exist yet — display only, with mock/static data. No backend implementation.
- "10 SUNNER NHẬN QUÀ MỚI NHẤT" list (D.3): feature does not exist yet — display only, with mock/static data. No backend implementation.
