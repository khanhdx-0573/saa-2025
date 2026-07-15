---
title: "Site Header Navigation"
description: "Complete the authenticated app header (nav tabs, bell, avatar) + two static mock pages"
status: completed
priority: P2
effort: 4.5h
branch: feat/add_kudos
tags: [frontend, header, navigation, i18n, next-intl]
blockedBy: []
blocks: []
work_type: feature
spec: docs/features/F003_SiteHeaderNavigation/
created: 2026-07-13
---

# Site Header Navigation

Extend the shared header (`components/layout/header.tsx`) so authenticated Sunners get the full
navigation chrome (3 nav tabs, decorative bell, language switcher, avatar → own profile), while
`/login` keeps today's minimal header. Adds two static mock routes behind two of the tabs.

**Spec (authoritative):** `spec/site-header-navigation/` — FR-001..FR-009, edge-cases table, screens.
**Design ref:** authenticated header screenshot (logo · 3 tabs, active=gold `#ffea9e`+underline ·
bell+red dot · VN switcher · bordered-square avatar).

## Key Decisions (settled)

- Header becomes a **client component** (`"use client"`) — needs `useAuth()` + `usePathname()`.
- `useAuth().user === null` → render **byte-for-byte today's output** (logo + `<LanguageSwitcher/>`), no regression on `/login`.
- Bell = **non-interactive** decorative `<span>`, SVG + red dot `aria-hidden` (FR-006 "no action" wins over the draft NFR's aria-label suggestion — see phase-02 rationale).
- Avatar = real `<Link href={/profile/${user.id}}>` with translated `aria-label` (FR-007).
- Mock pages = **plain server components**, no `components/<feature>/` folder (YAGNI — static copy only).
- Both locales (`en.json` + `vi.json`) updated in lockstep.

## Phases

| # | Phase | Status | Effort | blockedBy | Owns (files) |
|---|-------|--------|--------|-----------|--------------|
| 01 | [Header icons (bell + avatar SVGs)](phase-01-header-icons.md) | completed | 0.5h | — | `components/layout/header-icons.tsx` |
| 02 | [Header rewrite (auth-gated nav/bell/avatar + active tab)](phase-02-header-rewrite.md) | completed | 1.5h | 01 | `components/layout/header.tsx`, `messages/*.json` (Header ns) |
| 03 | [Mock pages + i18n namespaces](phase-03-mock-pages-i18n.md) | completed | 1h | 02 | `app/about-saa-2025/`, `app/award-information/`, `messages/*.json` (page ns) |
| 04 | [Testing (unit + e2e + regression)](phase-04-testing.md) | completed | 1.5h | 02, 03 | `components/layout/header.test.tsx`, `e2e/site-navigation.spec.ts` |

## Dependency Graph

```
01 icons ──▶ 02 header ──▶ 03 pages ──▶ 04 tests
                            (03 blockedBy 02: both edit messages/*.json — serialize)
                                          04 blockedBy 02 AND 03
```

Linear chain by design. 02 and 03 both edit the two `messages/*.json` files, so they are
**deliberately sequential** (no parallel write on shared files). 04 reads (never edits) the
existing `login.spec.ts` / `kudos*.spec.ts` for the regression scan.

## Blast-Radius Note

`header.tsx` is shared chrome on **every** page. The regression risk (accessible-name collisions
with existing `getByRole`/`getByText` assertions in `login.spec.ts` and `kudos*.spec.ts`) is
handled explicitly in phase-04. Full unit + e2e suites must pass before "done".

## Success Criteria (feature-level)

- `/login` (unauth) header visually unchanged; authenticated pages show full header.
- 3 tabs navigate correctly; active tab shows gold+underline+`aria-current="page"` per edge-cases table.
- Avatar → signed-in user's own `/profile/{id}`; bell inert.
- `npm run lint`, `npm run test`, `npm run test:e2e` all green (incl. existing specs).
