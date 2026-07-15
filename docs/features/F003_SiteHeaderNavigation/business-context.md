---
status: implemented
authored_by: takumi
fcode: F003
created: 2026-07-13
lang: en
---

## Why It Matters

The header is the primary cross-app navigation surface. Today it only carries the logo and language
switcher — visually identical whether a Sunner is logged in or looking at the public login screen.
That flattens the authenticated experience and hides two navigation destinations ("About SAA 2025",
"Award Information") the event design calls for, and leaves no way back to one's own profile from the
header. Completing the header brings the live app in line with the approved design and gives every
authenticated screen a consistent, complete chrome.

## Who Uses It

Every authenticated Sunner, on every authenticated page (Kudos Live Board, Kudos Detail, Profile) —
the header is shared chrome, not a standalone screen. Unauthenticated visitors (the `/login` screen)
are unaffected.

## What They Do

A signed-in Sunner sees the full header on any authenticated page: they can jump straight to the
Kudos Live Board, or explore the (mocked) "About SAA 2025" and "Award Information" destinations,
switch language, and tap their own avatar to jump to their profile. The notification bell is present
for visual completeness only — no notification content exists yet.
