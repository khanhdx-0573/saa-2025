---
status: implemented
authored_by: takumi
fcode: F003
created: 2026-07-13
lang: en
---

# F003_SiteHeaderNavigation

## Overview

Extend the shared app header (`components/layout/header.tsx`) so that once a Sunner is authenticated
it matches the full navigation design: primary nav tabs ("About SAA 2025", "Award Information",
"Sun* Kudos"), a decorative notifications bell, the existing language switcher, and an avatar icon
linking to the signed-in user's own profile. Unauthenticated pages (`/login`) keep today's minimal
header (logo + language switcher only). Adds two new lightweight, static "coming soon"-style pages
behind the "About SAA 2025" and "Award Information" tabs — no backend, no dynamic data.

## Polymorphic Behavior

Header rendering varies by auth state — this is the feature's only variant:
- **Authenticated**: logo, 3 nav tabs (active tab highlighted by current route), notification bell,
  language switcher, avatar link.
- **Unauthenticated** (`/login`, `/auth/*`): logo + language switcher only (unchanged from current
  behavior).

## Cross-Cutting Logic

### Requirements

- FR-001: The system must render the 3 nav tabs ("About SAA 2025", "Award Information", "Sun* Kudos")
  in the header whenever a session is present, and must render neither the nav tabs, the bell, nor the
  avatar when no session is present.
- FR-002: The system must highlight the nav tab matching the current route as active (gold text +
  underline); the other two tabs render in the default (white) style.
- FR-003: Clicking "Sun* Kudos" must navigate to `/kudos`.
- FR-004: Clicking "About SAA 2025" must navigate to a new `/about-saa-2025` route rendering static
  placeholder content (no live data, no backend).
- FR-005: Clicking "Award Information" must navigate to a new `/award-information` route rendering
  static placeholder content (no live data, no backend).
- FR-006: The notification bell renders with an unread-indicator dot as a decorative element only —
  clicking it performs no action (no notifications backend exists yet).
- FR-007: The avatar icon, when clicked, must navigate to the signed-in user's own profile page
  (`/profile/{currentUserId}`), reusing the existing F002 profile route.
- FR-008: The language switcher's existing behavior (locale toggle) is unchanged and continues to
  render in the header in both auth states.
- FR-009: `/about-saa-2025` and `/award-information` are ordinary app routes and therefore inherit the
  existing auth-gate (`proxy.ts` → `lib/supabase/middleware.ts`) automatically — unauthenticated access
  redirects to `/login`, same as every other non-`/login`/`/auth/*` route.

### Business Rules

- Nav tabs, bell, and avatar are gated purely on auth-session presence (`useAuth().user !== null`) —
  no role/permission distinction.
- "About SAA 2025" and "Award Information" pages carry no functional requirements beyond static,
  on-brand placeholder copy — explicitly out of scope for real content/backend per user instruction.

### Decision Logic

- Active-tab detection: derive from `usePathname()` — `/kudos` and `/kudos/*` → "Sun* Kudos" active;
  `/about-saa-2025` → "About SAA 2025" active; `/award-information` → "Award Information" active; any
  other authenticated route (e.g. `/profile/*`) → no tab active.

### State Machines

N/A — header is a stateless render keyed off auth state + current pathname; no multi-step flow.

### Algorithms

N/A.

### External Integrations

None — reuses the existing `useAuth()` context (`components/auth/auth-provider.tsx`) and Next.js
`usePathname()`; no new Supabase tables, RPCs, or storage.

## Non-Functional Requirements

- i18n: every new label goes through `next-intl` (`Header` namespace for nav/aria labels; new
  `AboutSaaPage`/`AwardInformationPage` namespaces for the two mock pages) — no hardcoded strings.
- Accessibility: nav tabs are real links (`<Link>`) with visible focus states; the bell is a
  non-interactive decorative `<span aria-hidden="true">` (FR-006 — no action, no accessible affordance
  implied); the avatar is a link with a translated `aria-label`; active tab exposes
  `aria-current="page"`.
- No new npm dependencies.

## Implementation Notes (post-forge)

- `components/layout/header.tsx` is now a client component (`useAuth()` + `usePathname()`); the
  unauthenticated branch is byte-for-byte identical to the pre-existing markup (verified by diff at
  review time) — no regression on `/login`.
- Bell decorative dot reuses the existing `--details-error` color token (no new color introduced).
- `app/about-saa-2025/page.tsx` and `app/award-information/page.tsx` are plain server components
  (no client component / no `components/<feature>/` folder) — static copy only, per YAGNI.
