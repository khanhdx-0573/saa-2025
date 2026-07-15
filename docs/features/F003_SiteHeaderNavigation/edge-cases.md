---
status: implemented
authored_by: takumi
fcode: F003
created: 2026-07-13
lang: en
---

| Scenario | Input | Expected | Severity |
|----------|-------|----------|----------|
| Unauthenticated header | Load `/login` | Header shows logo + language switcher only; no nav tabs, bell, or avatar | high |
| Unauthenticated direct nav | Load `/about-saa-2025` or `/award-information` with no session | Redirected to `/login` (existing middleware gate), same as any other authenticated route | high |
| Active tab on /kudos | Load `/kudos` while authenticated | "Sun* Kudos" tab shows gold+underline; other two tabs default style | medium |
| Active tab on /kudos/[id] | Load a kudos detail page | "Sun* Kudos" tab still highlighted (nested route) | medium |
| No tab active on /profile/[id] | Load a profile page | None of the 3 tabs show the active state | low |
| Avatar navigation | Click avatar while authenticated | Navigates to `/profile/{own id}`, not another user's profile | high |
| Bell click | Click the notification bell | No navigation, no error, no visible state change | low |
| Language switch persists nav | Toggle EN/VN while on an authenticated page | Nav tab labels re-render in the new locale; active tab stays correctly highlighted | low |
