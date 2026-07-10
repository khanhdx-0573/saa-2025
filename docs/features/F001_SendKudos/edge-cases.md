---
status: draft
authored_by: takumi
created: 2026-07-09
lang: en
---

| Scenario | Input | Expected | Severity |
|----------|-------|----------|----------|
| Unauthenticated access | Open `/kudos` or the compose action without a session | Redirected to login; modal never opens | high |
| Empty recipient on submit | Submit with no recipient selected | Validation-summary banner shown at the bottom of the modal; no red border or per-field error text on the recipient field; submit blocked | high |
| Empty title on submit | Submit with "Danh hiệu" (title) field blank | Validation-summary banner shown; no per-field error text on the title field; submit blocked | high |
| Empty content on submit | Submit with content field blank | Validation-summary banner shown; no per-field error text on the content field; submit blocked | high |
| Zero hashtags on submit | Submit with 0 hashtags selected | Validation-summary banner shown; no per-field error text on the hashtag field; submit blocked | high |
| 6th hashtag selection attempt | Select a 6th hashtag when 5 are already chosen | Selection blocked with "Tối đa 5 hashtag" message; unselected rows become non-clickable at 5 | medium |
| All required fields empty on submit | Submit with recipient, title, content, and hashtags all empty | Only the single validation-summary banner ("Bạn cần điền đủ Người nhận, Danh hiệu, Lời nhắn gửi và Hashtag để gửi Kudos!") is shown; no red borders or per-field error text anywhere; submit blocked | high |
| 6th image attach attempt | Attempt to add a 6th image when 5 are already attached | "+ Image" button is hidden once 5 images are present; no 6th image can be added | medium |
| Invalid file type upload | Select a .pdf, .mp4, or .txt file via "+ Image" | File is rejected with a visible error; no thumbnail added | medium |
| Valid image upload | Select a .jpg or .png file under 5MB | Thumbnail added; image counts toward the 5-image limit | low |
| Oversized image upload | Select a valid-type file over 5MB | File is rejected with a visible error; no thumbnail added | medium |
| Anonymous toggle on | Toggle "Gửi lời cám ơn và ghi nhận ẩn danh" to on | Anonymous display-name text field appears; default state was off | medium |
| Anonymous toggle off after on | Toggle anonymous off after having turned it on | Anonymous display-name field hides again; entered value discarded | low |
| Anonymous submit persists no identity | Submit with anonymous toggle on and a display name entered | Resulting kudos row has no recoverable link to the real sender's account | high |
| Cancel discards data | Click "Hủy" after partially filling the form | Modal closes immediately; no confirmation prompt; no data persisted | low |
| @mention suggestion match | Type "@" followed by a partial colleague name | Suggestion list filters by substring match against Sunners directory | low |
| Recipient search special characters | Type special characters (e.g. emoji, symbols) into the recipient search | Search returns empty/no results gracefully, no error thrown | low |
