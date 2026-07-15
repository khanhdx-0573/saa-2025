# Phase 03 — Mock Pages + i18n Namespaces

## Context Links
- Spec: `spec/site-header-navigation/technical-spec.md` (FR-004, FR-005, FR-009; business-context "mock vào cho đẹp thôi")
- Screens: `spec/site-header-navigation/screens.md`
- Pattern to mirror: `app/login/page.tsx` (server component; `Header` + `<main>` + `Footer`; strings via `useTranslations`)
- Shared: `components/layout/header.tsx` (phase-02), `components/layout/footer.tsx`, `messages/en.json`, `messages/vi.json`

## Overview
- **Priority:** P2 · **Status:** completed · **Effort:** 1h · **blockedBy:** phase-02
- Add two static, on-brand "coming soon"-style routes rendered by the (now-complete) header's tabs. No client interactivity, no backend, no `components/<feature>/` folder (YAGNI for static copy).

## Key Insights
- Both routes inherit the existing auth-gate automatically (`proxy.ts` → `lib/supabase/middleware.ts`) — zero gating code (FR-009).
- Plain server components: `Header` + a `<main>` with translated headings/paragraphs + `Footer`. Reuse login page's layout scaffolding (dark bg, `px-6 lg:px-36` rhythm) so pages feel native without new design tokens.
- **blockedBy phase-02** specifically because both phases edit `messages/en.json` + `messages/vi.json`; serializing avoids a shared-file write clash. This phase adds only the two NEW top-level namespaces — it must not touch phase-02's `Header` keys.

## Requirements
- FR-004: `/about-saa-2025` renders static placeholder ("About Sun* Annual Awards 2025"), no live data.
- FR-005: `/award-information` renders static placeholder, no live data.
- FR-009: unauthenticated direct nav → redirect to `/login` (inherited middleware).
- NFR: all copy via next-intl (`AboutSaaPage`, `AwardInformationPage` namespaces) in BOTH locales; no hardcoded strings; no new deps.

## Architecture
- **Input:** none (static) — locale resolved by next-intl server context.
- **Transform:** none.
- **Output:** full-page HTML (`Header` + `<main>` copy + `Footer`).
- **Data flow:** none. Each page reads only its own namespace.

## Related Code Files
- **Create:** `app/about-saa-2025/page.tsx` (server component)
- **Create:** `app/award-information/page.tsx` (server component)
- **Modify:** `messages/en.json` + `messages/vi.json` — add top-level `AboutSaaPage` + `AwardInformationPage` namespaces (heading + intro paragraph(s) + a few feature/bullet strings; keys driven by the actual copy written).
- **Read:** `app/login/page.tsx`, `components/layout/footer.tsx`

## Implementation Steps
1. Write EN + VN copy for both namespaces in `messages/en.json` / `messages/vi.json` (add AFTER phase-02's Header keys landed; keep both files in lockstep, identical key sets).
2. Create `app/about-saa-2025/page.tsx`: server component, `useTranslations("AboutSaaPage")`, layout mirroring `app/login/page.tsx` (Header + `<main>` tasteful heading + 2-3 paragraphs / bullets + Footer). No `"use client"`.
3. Create `app/award-information/page.tsx`: same shape, `useTranslations("AwardInformationPage")`.
4. Verify tab→route wiring: clicking "About SAA 2025" / "Award Information" in the header lands here and the correct tab shows active (validated in phase-04).
5. `npm run lint` + typecheck/build clean.

## Todo List
- [x] `AboutSaaPage` namespace in en.json + vi.json (identical keys)
- [x] `AwardInformationPage` namespace in en.json + vi.json (identical keys)
- [x] `app/about-saa-2025/page.tsx` (server, Header/main/Footer, next-intl)
- [x] `app/award-information/page.tsx` (server, Header/main/Footer, next-intl)
- [x] Both pages render on-brand, no hardcoded strings, no client code
- [x] lint + build clean

## Success Criteria
- Both routes render tasteful static content in EN and VN.
- Authenticated nav to each shows the matching tab active (gold+underline).
- Unauthenticated direct nav redirects to `/login` (no extra code, middleware-inherited).
- No new deps; TS strict; lint clean.

## Risk Assessment
- **Shared-file clash on `messages/*.json` with phase-02** — Likelihood Med / Impact Med. Countermove: strict sequencing (blockedBy 02) + disjoint namespaces (`AboutSaaPage`/`AwardInformationPage` vs `Header`).
- **EN/VN key drift** (one locale missing a key → runtime MISSING_MESSAGE) — Likelihood Med / Impact Low. Countermove: add keys to both files in the same edit; phase-04 e2e loads a page in the default locale.
- **Route path typo vs header hrefs** — Likelihood Low / Impact Med. Countermove: phase-04 e2e clicks each tab and asserts URL.

## Rollback
- Delete the two `app/*/page.tsx` route folders and drop the two added namespaces. Purely additive (new routes + new JSON keys) → clean revert, no impact on existing routes.

## Security Considerations
- Static content only; no data access, no user input. Routes remain auth-gated by existing middleware (FR-009).

## Next Steps
- Feeds phase-04 (navigation + active-tab + unauth-redirect e2e).
