---
status: draft
authored_by: planner
created: 2026-07-12
lang: en
---

## Why It Matters

The Live Board is the public face of Sun* Annual Awards 2025 Kudos — the shared screen where the whole
company sees recognition happening in real time. Where Send Kudos (F001) is the private act of writing a
thank-you, the Live Board turns those notes into a communal feed: it surfaces the most-celebrated kudos
(Highlight), lets anyone browse every kudos ever sent (All Kudos), visualizes who is being recognized most
(Spotlight word-cloud board), and gives each Sunner a personal scoreboard (sidebar stats). "Hearts" (likes)
add a lightweight social loop — Sunners reward the *authors* of kudos they find moving, which reinforces the
behaviour of writing recognition, not just receiving it.

## Who Uses It

Any authenticated employee ("Sunner"). No special role. Every viewer can: read all kudos, like any kudos
except their own, copy a share link, filter by hashtag/department, explore the Spotlight board, open any
Sunner's profile, open any kudos' detail, and see their own personal stats in the sidebar. The compose entry
bar (A.1) reuses the existing F001 "Viết Kudo" modal unchanged.

## What They Do

A Sunner lands on `/kudos` (auth-gated by existing middleware). They read the Highlight carousel of the
top-5 most-hearted kudos of the whole event, optionally narrow both Highlight and All Kudos with the
Hashtag / Department filters, scroll the infinite All Kudos feed (with image galleries), and explore the
Spotlight board — an interactive pan/zoom canvas of recipient names sized by how many kudos each has
received. On any card they can tap the heart to like/unlike (crediting the kudos' author, never themselves),
copy a share link (toast confirms), or open the kudos detail. Tapping an avatar/name opens that Sunner's
minimal read-only profile. The sidebar shows the viewer's own real counts (kudos received, kudos sent, hearts
received) plus two mock-only blocks (Secret Box, latest gift recipients) that are display-only placeholders
for features not yet built.

## Out of Scope (this plan)

- Special-day 2× heart bonus (backlog; no `special_days` table this pass).
- Rank-up leaderboard ("10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT") — omitted (no design item / not in frame).
- Real Secret Box mechanics and real gift-recipient data — mock/static only.
- Editing profiles or kudos — both new pages are read-only.
- Real-time push updates — likes/feed reflect on refetch/reload, no live subscription.
