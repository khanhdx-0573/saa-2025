# Screen Notes — Sun* Kudos - Live Board

MoMorph screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ (screen_id `MaZUn5xHXZ`, design/spec status: done)

## Layout (top → bottom)

1. **A — Banner**: "Hệ thống ghi nhận lời cảm ơn" + "SAA 2025 KUDOS" logo, decorative background. Readonly.
2. **A.1 — Compose entry bar**: pill-shaped input, pencil icon left, placeholder "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?". Click opens the existing "Viết Kudo" compose modal (`components/kudos/kudos-modal.tsx`, already built in F001_SendKudos). Note: current `/kudos` page renders this as a big button, not a pill input — needs restyling to match this screen's pill input, same click behavior (open `KudosModal`).
3. **B — HIGHLIGHT KUDOS**: subtitle "Sun* Annual Awards 2025", title "HIGHLIGHT KUDOS", two filter dropdowns (Hashtag, Phòng ban/Department — apply to BOTH Highlight and All Kudos sections, reset pagination to page 1 on change), carousel of top-5-most-liked kudos ever (all-time, not date-scoped) with prev/next arrows (disabled at ends) + "n/5" pagination label. Center card is prominent, side cards faded/non-interactive.
4. **Highlight card fields**: sender avatar+name+department+star-rating badge, arrow icon (decorative), recipient avatar+name+department+star-rating badge, timestamp "HH:mm - MM/DD/YYYY", kudos "title" shown as a badge/tag (e.g. "IDOL GIỚI TRẺ" — this is the `kudos.title` column, distinct from #hashtags), content (max 3 lines, ellipsis), up to 5 #hashtags (max 1 line, ellipsis), heart count + like button, Copy Link button, "Xem chi tiết"/View Details button. Empty state: "Hiện tại chưa có Kudos nào."
   - **Star rating badge logic** (hover tooltip): 1 star = recipient has received 10 kudos; 2 stars = 20 kudos; 3 stars = 50 kudos. Applies to both sender and recipient badges (based on kudos *received* count for that profile).
5. **B.6/B.7 — SPOTLIGHT BOARD**: header "Sun* Annual Awards 2025 — SPOTLIGHT BOARD", then an interactive word-cloud/canvas: header shows "{total kudos count} KUDOS" (real count from DB) + a small Sunner search bar (placeholder "Tìm kiếm", max 100 chars), a Pan/Zoom toggle icon, and a canvas of scattered recipient names (sized/weighted by kudos-received count, per decision: custom SVG/CSS, no new deps). Hover → tooltip with name + last-received timestamp. Click node → kudos detail page. Supports loading/empty/interactive states.
6. **C — ALL KUDOS**: subtitle "Sun* Annual Awards 2025", title "ALL KUDOS". Infinite-scroll feed of kudos cards (same field set as Highlight cards, but content truncates at 5 lines not 3, and shows up to 5 attached images in a horizontal thumbnail row — click thumbnail opens full image). Same hashtag/department filters apply here too (shared filter state with Highlight section). Empty state: "Hiện tại chưa có Kudos nào."
7. **D — Sidebar** (independent scroll):
   - **D.1 stats block** (all REAL data, scoped to current authenticated user): "Số Kudos bạn nhận được: N" (kudos.recipient_id = me, count), "Số Kudos bạn đã gửi: N" (kudos.sender_id = me, count — anonymous sends by me aren't counted since sender_id is null for those), divider, "Số tim bạn nhận được: N" (sum of hearts credited to me as a kudos SENDER, per the like business rule — hearts reward whoever wrote a kudos that got liked, not the recipient of that kudos).
   - **D.1.6/D.1.7/D.1.8 — Secret Box block (MOCK ONLY, per explicit user instruction)**: "Số Secret Box bạn đã mở: N", "Số Secret Box chưa mở: N", "Mở quà" button. Secret Box feature doesn't exist — render static/mock numbers, button can show a simple "coming soon" state on click. No backend.
   - **D.3 — "10 SUNNER NHẬN QUÀ MỚI NHẤT" (MOCK ONLY, per explicit user instruction)**: vertical list, avatar + name + short prize description per row (e.g. "Huỳnh Dương Xuân" / "Nhận được 1 áo phông SAA"), 6 sample rows in the design. Click avatar/name → profile page (real navigation even though the list data itself is mock). Empty state: "Chưa có dữ liệu". No backend — static mock array in the component.
   - **Rank-up list ("10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT")**: mentioned only in the parent section's prose description, no individual design items, not present in the actual frame capture → OMITTED per clarification (not building it).

## Anonymous kudos card variant

Reference: Figma node `2099:9148` ("Ẩn danh"), tracked in MoMorph as screen_id `p9vFVBE_tc` (design in_progress, no spec/image synced — viewed via user-provided screenshot instead).

- Sender side shows an incognito-style avatar icon (hat + glasses placeholder graphic) instead of a real avatar, with a whimsical alias display name (e.g. "Anh Hùng Xạ Điêu" — this is the existing `kudos.anonymous_display_name` column) and a small "Người gửi ẩn danh" label instead of department/star badge.
- Recipient side is unchanged (real avatar, name, department, badge).
- **Heart/like button is fully functional and visible on anonymous cards** (screenshot shows "1.000" hearts, filled/active red icon) — liking an anonymous kudos works exactly like any other kudos from the liker's point of view.
- Per clarification: no heart credit is applied to any account when an anonymous kudos is liked (sender_id is null, nothing to credit against) — this is a silent no-op on the credit side only, not a UI restriction.

## Locked scope decisions

See `../../clarifications.md` in the plan root for the full Q&A. Summary:
- Spotlight board: custom SVG/CSS pan-zoom, no new npm dependency.
- Like system: standard +1 heart per like only; no special-day 2x bonus this pass (backlog).
- Anonymous kudos likes: no heart credited to anyone.
- Profile page + Kudos detail page: both built (minimal, read-only) as part of this plan.
- Rank-up leaderboard: omitted (only the gift-recipients mock list ships).
- Secret Box stats/button + gift-recipients list: mock/static data, no backend.
