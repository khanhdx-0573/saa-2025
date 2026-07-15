---
status: implemented
authored_by: takumi
fcode: F003
created: 2026-07-13
lang: en
---

## Screen List

| Screen | Type | Purpose |
|--------|------|---------|
| App Header (authenticated variant) | Shared chrome | Logo, 3 nav tabs, notification bell, language switcher, avatar → own profile |
| About SAA 2025 | Static/mock page | Placeholder "About Sun* Annual Awards 2025" content behind the nav tab |
| Award Information | Static/mock page | Placeholder award-information content behind the nav tab |

## User Journey

1. Sunner signs in and lands on `/kudos` — header now shows the full nav (previously bare).
2. Sunner clicks "About SAA 2025" → navigates to the new static page; tab highlights gold+underline.
3. Sunner clicks "Award Information" → navigates to the new static page; tab highlights.
4. Sunner clicks "Sun* Kudos" from either mock page → returns to `/kudos`; tab highlights.
5. Sunner clicks the avatar icon from any authenticated page → navigates to their own `/profile/{id}`.
6. Sunner clicks the bell → nothing happens (decorative only).
