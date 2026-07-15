---
status: draft
authored_by: planner
created: 2026-07-12
lang: en
---

| Scenario | Input | Expected | Severity |
|----------|-------|----------|----------|
| Unauthenticated board access | Open `/kudos`, `/kudos/[id]`, or `/profile/[id]` with no session | Middleware redirects to `/login` | high |
| Like own kudos | Tap heart on a kudos where sender_id = me | Button disabled/no-op; RPC rejects self-like; count unchanged | high |
| Double-like (idempotent) | Tap like twice fast on the same kudos | Net state is a single toggle; composite PK prevents duplicate rows; count consistent after refetch | high |
| Like anonymous kudos | Tap heart on an anonymous card | Like recorded, card count +1; no user's "hearts received" changes (sender NULL) | high |
| Unlike | Tap heart on an already-liked kudos | Row deleted; count −1; button inactive; persists on reload | medium |
| Empty Highlight | No kudos exist (or none match filter) | "Hiện tại chưa có Kudos nào."; carousel hidden/empty | medium |
| Empty All Kudos | No kudos match the current filter | "Hiện tại chưa có Kudos nào."; no infinite-scroll requests fire | medium |
| Filter with no matches | Choose a hashtag/department with zero kudos | Both sections show the empty state; All Kudos offset reset to 0 | medium |
| Filter change mid-scroll | Change filter after loading page 3 of All Kudos | Feed resets to page 1 with the new filter; prior pages discarded | medium |
| Infinite-scroll tail | Scroll to the end of All Kudos | Last page loads; sentinel stops firing once a short/empty page returns; no dupes/gaps | high |
| Concurrent like by others | Another user likes a card I'm viewing | My view updates only on refetch/reload (no realtime) — accepted limitation | low |
| Copy link, no clipboard API | Copy Link in an insecure context / clipboard unavailable | Graceful fallback (e.g. select-and-prompt); no unhandled error | medium |
| Copy link success | Tap Copy Link | `{origin}/kudos/{id}` on clipboard; toast "Link copied — ready to share!"; toast auto-dismisses | low |
| Long content | Card content far exceeds the clamp | Clamped to 3 lines (Highlight) / 5 lines (All Kudos) with ellipsis; full text on detail page | low |
| >5 hashtags on a legacy card | Card with many hashtags | Chips clamped to 1 line with ellipsis (design shows up to 5) | low |
| Kudos with 0 images | All Kudos card with no attachments | No thumbnail row rendered; layout unaffected | low |
| Kudos with 5 images | All Kudos card with 5 images | 5 thumbnails in a horizontal row; each opens full-size on click | low |
| Broken image URL | `kudos_images.storage_path` resolves to a missing object | Broken-image fallback; no layout break | low |
| Star badge boundaries | Recipient with exactly 9 / 10 / 19 / 20 / 49 / 50 received | 0 / 1★ / 1★ / 2★ / 2★ / 3★ respectively | medium |
| Spotlight all-equal counts | Every recipient has the same received count | All nodes render at the min font size; layout still scatters | low |
| Spotlight single node | Only one recipient in the data | One centered node; pan/zoom still works | low |
| Spotlight overlap | Many nodes of similar large size | Spiral spacing minimizes overlap; minor overlap accepted (no collision lib) | low |
| Spotlight search 100+ chars | Type past 100 chars in the search bar | Input capped at 100 chars | low |
| Spotlight node click | Click a recipient node | Opens Kudos Detail of that recipient's latest-received kudos | medium |
| Profile / detail bad id | Open `/profile/[id]` or `/kudos/[id]` with a non-existent/invalid id | Page renders 404 / not-found state; no crash | high |
| Mock Secret Box "Mở quà" | Tap the mock "Mở quà" button | Coming-soon state shown; nothing persisted | low |
| Mock gift-list navigation | Tap a gift-list row avatar/name | Navigates to that Sunner's profile (real nav, mock list) | low |
| Self profile view | Open my own profile | Renders with "this is me" awareness; still read-only | low |
| Locale switch | Toggle EN/VI | All board strings re-render in the chosen catalog | medium |
