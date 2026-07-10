---
status: draft
authored_by: takumi
created: 2026-07-09
lang: en
---

## Screen List

| Screen | Type | Purpose |
|--------|------|---------|
| Write Kudos Modal ("Viết Kudo") | Composite (modal) | Compose form for recipient, title ("Danh hiệu"), rich-text content with @mentions, hashtags, images, and anonymous toggle; Cancel/Submit footer. |
| Hashtag Picker Dropdown | Composite (nested picker) | Opened from the compose modal via "+ Hashtag"; lets the sender select 1-5 hashtags from the managed list, disabling further selection once 5 are chosen. |

## User Journey

1. Authenticated Sunner navigates to `/kudos`.
2. Sunner clicks the "Viết Kudo" trigger button; the compose modal opens (unauthenticated users are redirected to login instead).
3. Sunner searches for and selects exactly one recipient from the Sunners autocomplete.
4. Sunner enters a required "Danh hiệu" (title) — the headline dedicated to the recipient.
5. Sunner writes the thank-you note in the rich-text field, optionally applying formatting (bold/italic/strikethrough/link/quote/ordered-list) and optionally inserting an "@name" mention of another colleague.
6. Sunner clicks "+ Hashtag", which opens the Hashtag Picker Dropdown; selects 1-5 hashtags (rows toggle selection, disabled once 5 are chosen), then returns to the compose modal with the chosen hashtags shown as removable chips.
7. Sunner optionally clicks "+ Image" to attach up to 5 jpg/png images (invalid types/oversized files are rejected inline).
8. Sunner optionally toggles "send anonymously" and enters a custom display name.
9. Once recipient, title, content, and hashtags are all valid, Sunner clicks "Gửi" (Submit); a loading state shows, the kudos is persisted, and the modal closes on success. (Clicking "Hủy" at any point discards all data and closes the modal without confirmation.)
