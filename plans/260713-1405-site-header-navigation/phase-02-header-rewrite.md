# Phase 02 — Header Rewrite (auth-gated nav / bell / avatar + active-tab logic)

## Context Links
- Spec: `spec/site-header-navigation/technical-spec.md` (FR-001..FR-003, FR-006, FR-007, FR-008; Decision Logic)
- Edge cases: `spec/site-header-navigation/edge-cases.md` (active-tab rows)
- Reuse: `components/auth/auth-provider.tsx` (`useAuth()` → `{ user: { id, email } | null }`), `components/ui/language-switcher.tsx` (unchanged), `next/navigation` `usePathname()`
- Icons: phase-01 `components/layout/header-icons.tsx`
- Tokens: `app/globals.css` — `--details-text-primary-1 #ffea9e` (active gold), `--details-text-secondary-1 #ffffff` (inactive white), `--details-border #998c5f` (avatar square border)

## Overview
- **Priority:** P2 · **Status:** completed · **Effort:** 1.5h · **blockedBy:** phase-01
- Convert `header.tsx` from a server component to a client component that renders the minimal header when unauthenticated and the full nav chrome when authenticated.

## Key Insights
- `AuthProvider` wraps the whole tree in `app/layout.tsx`, so `useAuth()` is available on every page — no prop drilling.
- **No-regression contract:** when `user === null` the returned JSX must equal today's markup (logo + `<LanguageSwitcher/>`, same wrapper classes). `/login` renders this; e2e in phase-04 guards it.
- Active-tab source of truth = `usePathname()`. Match table: `/kudos` or `/kudos/*` → Kudos; `/about-saa-2025` → About; `/award-information` → Award; else (e.g. `/profile/*`) → none.
- Nav labels + aria strings come from the existing `Header` next-intl namespace (already consumed by `LanguageSwitcher`). Add keys there — do NOT create a new namespace for header chrome (DRY).
- **Bell semantics decision:** FR-006 says the bell performs no action. Rendering it as a `<button>`/interactive element with a "Notifications" `aria-label` would advertise an affordance that does nothing → misleading to AT. Decision: render bell as a non-interactive `<span>` with the SVG + red dot both `aria-hidden="true"`, no tab stop, no role. This deviates from the draft NFR (which suggested an aria-label) in favor of the authoritative FR-006 "decorative only". Recorded here as the settled call.

## Requirements
- FR-001: nav tabs + bell + avatar render iff session present; none render when absent.
- FR-002: active tab = gold text + underline; other two = white default.
- FR-003: "Sun* Kudos" → `/kudos`.
- FR-006: bell decorative, inert (see decision above).
- FR-007: avatar → `/profile/{user.id}` (own profile) via `<Link>`, translated `aria-label`.
- FR-008: `<LanguageSwitcher/>` unchanged, present in both states.
- NFR: nav items are real `<Link>`s with visible focus + `aria-current="page"` on active; no hardcoded strings (next-intl); no new deps; TS strict / zero `any`.

## Architecture
- **Input:** `useAuth().user`, `usePathname()`, `useTranslations("Header")`.
- **Transform:** derive `isAuthed = user !== null`; derive `activeTab` from pathname via a small pure helper (a `NAV_ITEMS` array of `{ key, href, matcher }`); map to link classes.
- **Output:** `<header>` with logo, then (authed only) nav `<Link>`s, decorative bell span, then `<LanguageSwitcher/>`, then avatar `<Link>`.
- **Data flow:** stateless render keyed off (auth, pathname). No local state, no effects.
- Keep the `NAV_ITEMS` config + active-matcher as a module-local const/helper so phase-04 can assert against the same shape; guard against oversized file (<200 lines) — extract the matcher helper if needed.

### Active-tab matcher (single source of truth)
- Kudos: `pathname === "/kudos" || pathname.startsWith("/kudos/")`
- About: `pathname === "/about-saa-2025"`
- Award: `pathname === "/award-information"`
- else: no active tab.

## Related Code Files
- **Modify:** `components/layout/header.tsx` (add `"use client"`, rewrite)
- **Modify:** `messages/en.json` + `messages/vi.json` — add under `Header`: nav labels (`navAboutSaa`, `navAwardInfo`, `navKudos`), `avatarAriaLabel`. (Bell has no label per decision; add none — or a comment key only if lint requires — keep minimal.)
- **Read:** `components/layout/header-icons.tsx`, `components/auth/auth-provider.tsx`, `components/ui/language-switcher.tsx`

## Implementation Steps
1. Add `"use client"`; import `useAuth`, `usePathname`, `useTranslations`, `Link`, `Image`, `LanguageSwitcher`, `BellIcon`, `AvatarPersonIcon`.
2. Preserve the existing `<header>` wrapper classes + logo `<Image>` exactly.
3. Early path: if `!user` → return logo + `<LanguageSwitcher/>` (today's markup verbatim).
4. Authed path: render logo → nav (`NAV_ITEMS.map` → `<Link>` with active gold+underline vs white, `aria-current="page"` when active) → decorative bell span (icon + absolutely-positioned red dot, both `aria-hidden`) → `<LanguageSwitcher/>` → avatar `<Link href={`/profile/${user.id}`}>` styled bordered square (`border-details-border`) wrapping `AvatarPersonIcon`.
5. Add the new `Header` keys to BOTH `messages/en.json` and `messages/vi.json` (VN copy: "Giới thiệu SAA 2025", "Thông tin giải thưởng", "Sun* Kudos"; EN as designed).
6. `npm run lint` + `npx tsc --noEmit` (or build) clean.

## Todo List
- [x] `"use client"` + imports
- [x] Unauthenticated branch = byte-equal to current markup
- [x] `NAV_ITEMS` config + pure active-matcher helper
- [x] Nav `<Link>`s with active/inactive classes + `aria-current`
- [x] Decorative bell span (aria-hidden icon + red dot)
- [x] Avatar `<Link>` → `/profile/${user.id}`, bordered square, translated aria-label
- [x] `<LanguageSwitcher/>` untouched, in both branches
- [x] Header namespace keys added to en.json AND vi.json
- [x] lint + typecheck clean, file <200 lines

## Success Criteria
- Unauth render === current header (login page unchanged).
- Authed render shows 3 tabs + bell + avatar; active tab gold+underline+`aria-current` matches pathname per edge-cases table.
- Avatar href = `/profile/{signed-in id}`; bell has no interactive role / no tab stop.
- All strings resolved via next-intl in both locales; no `any`, lint clean.

## Risk Assessment
- **Regression on `/login` header** — Likelihood Med / Impact High. Countermove: unauth branch returns unchanged markup; phase-04 e2e asserts login header = logo+switcher only.
- **Shared-file edit clash on `messages/*.json`** — Likelihood Med / Impact Med. Countermove: phase-02 owns only the `Header` namespace additions; phase-03 (page namespaces) is sequenced AFTER 02 — never parallel. Distinct JSON keys, no overlap.
- **Accessible-name collision** (new nav links/`aria-current` breaking existing `getByRole`/`getByText` in login/kudos specs) — Likelihood Med / Impact Med. Countermove: phase-04 regression scan + full suite run.
- **Client-component conversion side effects** (header now `"use client"` inside server-component pages) — Likelihood Low / Impact Low. Countermove: server pages may render client children; no server-only APIs used in header.

## Rollback
- Revert `header.tsx` to the prior server-component version and drop the added `Header` JSON keys. Single-file + additive-JSON change → clean revert, no data/schema impact.

## Security Considerations
- Avatar link uses `user.id` from the authenticated session context only (no external/user-supplied id) → cannot be steered to another user's profile. No new data access; routes remain auth-gated by existing middleware.

## Next Steps
- Unblocks phase-03 (pages + page-namespace i18n; must edit the same JSON files after this phase).
- Feeds phase-04 assertions (active-matcher shape, aria-current, bell inertness).
