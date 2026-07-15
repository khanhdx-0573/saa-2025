# Feature List

## Feature Hierarchy

| # | Feature | Priority | Type | Status |
|---|---------|----------|------|--------|
| 1 | F001 | Send Kudos | P2 | mixed | implemented |
| 2 | F002 | Kudos Live Board | P1 | mixed | implemented |
| 3 | F003 | Site Header Navigation | P2 | frontend | implemented |

## Feature Details

### F001 — Send Kudos

**Priority:** P2 | **Type:** mixed | **Status:** implemented | **Slug:** F001_SendKudos

Authenticated user composes and submits a peer-recognition kudos (thank-you note) to one
recipient, tagged with 1-5 managed hashtags, with optional images and optional anonymity.

**Related:** screens: — | routes: — | models: —

### F002 — Kudos Live Board

**Priority:** P1 | **Type:** mixed | **Status:** implemented | **Slug:** F002_KudosLiveBoard

Communal recognition feed for Sun* Annual Awards 2025 — Highlight carousel, Spotlight word-cloud
board, infinite-scroll All Kudos feed, likes/hearts, sidebar stats, and minimal profile +
kudos-detail pages.

**Related:** screens: — | routes: /kudos, /kudos/[id], /profile/[id] | models: kudos_likes

### F003 — Site Header Navigation

**Priority:** P2 | **Type:** frontend | **Status:** implemented | **Slug:** F003_SiteHeaderNavigation

Completes the shared authenticated app header: nav tabs (About SAA 2025, Award Information, Sun*
Kudos), decorative notification bell, and an avatar link to the signed-in user's own profile. Adds
two static/mock informational pages behind two of the tabs.

**Related:** screens: — | routes: /about-saa-2025, /award-information | models: —
