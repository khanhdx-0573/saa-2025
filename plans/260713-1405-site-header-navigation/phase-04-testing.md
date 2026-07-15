# Phase 04 — Testing (unit + e2e + regression)

## Context Links
- Spec: `spec/site-header-navigation/technical-spec.md` (all FRs), `edge-cases.md` (test matrix source)
- Unit pattern: `components/auth/google-login-button.test.tsx` (inline `vi.mock("next-intl", ...)`, key-as-label)
- e2e patterns: `e2e/kudos-live-board.spec.ts` (`test.use({ storageState: "e2e/.auth/user.json" })`, Unauthenticated `describe` with empty storageState), `e2e/login.spec.ts`
- Config: `vitest.config.ts` (jsdom, `components/**/*.test.tsx`); `npm run test`, `npm run test:e2e`

## Overview
- **Priority:** P2 · **Status:** completed · **Effort:** 1.5h · **blockedBy:** phase-02, phase-03
- Prove header behavior (unit) and end-to-end navigation/auth-gating (e2e), plus a regression scan of the existing shared-chrome specs.

## Key Insights
- Header is a client component using `useAuth`, `usePathname`, `useTranslations`, and it renders `<LanguageSwitcher/>`. Unit test must mock: `@/components/auth/auth-provider` (`useAuth`), `next/navigation` (`usePathname`), `next-intl` (`useTranslations` → key-as-label, matching existing tests). Stub `@/components/ui/language-switcher` to a trivial element so its `useLocale`/i18n-config/`next/image` deps don't pull into the header test. `next/link`/`next/image` render fine in jsdom, else mock to plain `<a>`/`<img>`.
- e2e reuses the existing authenticated `storageState` (`e2e/.auth/user.json`) minted by `e2e/global-setup.ts`; unauthenticated cases use `{ cookies: [], origins: [] }` — mirror `kudos-live-board.spec.ts`'s "Unauthenticated" block.
- **Blast-radius / regression:** header is on every page. Before finishing, scan `login.spec.ts` and `kudos*.spec.ts` for assertions that the new nav could break — chiefly accessible-name collisions (a new `<Link name="Sun* Kudos">` or avatar/`aria-current` colliding with an existing `getByRole("link"/"button")` or `getByText`). Do NOT edit those specs to force green; if a real collision surfaces, fix the header (e.g. tighter selectors/labels) and re-run. Report any unavoidable spec change to the lead.

## Requirements (traceability → edge-cases table)
- Unauthenticated header (high): `/login` → logo + switcher only, no nav/bell/avatar. (FR-001)
- Unauthenticated direct nav (high): `/about-saa-2025`, `/award-information` → redirect `/login`. (FR-009)
- Active tab `/kudos` + `/kudos/[id]` (medium): Kudos tab active. (FR-002)
- No tab active `/profile/[id]` (low): none active. (FR-002)
- Avatar navigation (high): → own `/profile/{id}`, not another user's. (FR-007)
- Bell click (low): no navigation / no error. (FR-006)
- Language switch persists nav (low): labels re-render, active tab stays. (FR-002, FR-008)

## Architecture (test layering)
- **Unit (`header.test.tsx`, Vitest + Testing Library):** pure render logic — auth branches + active-tab matcher across the 5 pathname cases + `aria-current` correctness + avatar href uses mocked user id + bell is non-interactive (no button role / not focusable).
- **e2e (`site-navigation.spec.ts`, Playwright):** real browser, real routes, real middleware — navigation, active state, avatar → own profile, unauth redirects.
- **Regression:** re-run existing `login.spec.ts` + `kudos.spec.ts` (+ `kudos-live-board.spec.ts`) unchanged; full `npm run test` + `npm run test:e2e` must pass.

## Related Code Files
- **Create:** `components/layout/header.test.tsx`
- **Create:** `e2e/site-navigation.spec.ts`
- **Read (do NOT edit):** `e2e/login.spec.ts`, `e2e/kudos.spec.ts`, `e2e/kudos-live-board.spec.ts`, `e2e/global-setup.ts`, `components/layout/header.tsx`

## Implementation Steps
1. **Unit** `components/layout/header.test.tsx`:
   - Mock `next-intl` (key-as-label), `@/components/auth/auth-provider` (`useAuth` returns configurable user), `next/navigation` (`usePathname` returns configurable path); stub `LanguageSwitcher`.
   - Case: `user=null` → assert nav labels/bell/avatar absent, logo + switcher stub present.
   - Case: `user={id,email}` + `usePathname="/kudos"` → all 3 nav links present, Kudos link has `aria-current="page"`, others don't; avatar link `href="/profile/{id}"`.
   - Active-tab cases: `/kudos/abc` → Kudos active; `/about-saa-2025` → About active; `/award-information` → Award active; `/profile/abc` → none active.
   - Bell: query for it and assert it is not a `button`/`link` role and not in tab order.
2. **e2e** `e2e/site-navigation.spec.ts`:
   - Authenticated `describe` (`storageState: "e2e/.auth/user.json"`): header shows 3 tabs + bell + avatar; click each tab → assert URL + active state; click avatar → URL matches `/profile/{signed-in id}` (derive expected id from the session, not hardcoded to a stranger).
   - Unauthenticated `describe` (`{ cookies: [], origins: [] }`): `/login` shows only logo + switcher (no nav); `/about-saa-2025` and `/award-information` → redirect `/login`.
3. **Regression scan + run:** grep the existing specs for role/text queries that the new nav could shadow; run full `npm run test` and `npm run test:e2e`.
4. Fix failures at the source (header, not the specs); loop until green. Hand to `tester` agent per workflow.

## Todo List
- [x] `header.test.tsx`: unauth branch assertions
- [x] `header.test.tsx`: authed branch + avatar href
- [x] `header.test.tsx`: 5 active-tab / aria-current cases
- [x] `header.test.tsx`: bell non-interactive assertion
- [x] `site-navigation.spec.ts`: authed nav + active + avatar-own-profile
- [x] `site-navigation.spec.ts`: unauth login header minimal + 2 redirect cases
- [x] Regression scan of login/kudos specs (accessible-name collisions)
- [x] `npm run test` green (all suites)
- [x] `npm run test:e2e` green (all suites, incl. existing)

## Success Criteria
- Every edge-cases-table row has a passing unit and/or e2e assertion.
- Existing `login.spec.ts` + `kudos*.spec.ts` pass unchanged (or documented, lead-approved change if a genuine collision).
- Full `npm run test` and `npm run test:e2e` green; no skipped/faked assertions.

## Risk Assessment
- **Accessible-name collision breaks existing specs** — Likelihood Med / Impact High. Countermove: regression scan step 3; fix in header markup, never by masking spec assertions.
- **e2e avatar test hardcoding a stranger's id** — Likelihood Med / Impact Med. Countermove: derive expected profile id from the session/storageState, assert URL contains own id (FR-007 explicitly: own profile, not another user's).
- **Unit test brittle to next/image or LanguageSwitcher internals** — Likelihood Med / Impact Low. Countermove: stub `LanguageSwitcher`; mock `next/image`/`next/link` only if jsdom errors.
- **e2e flake on nav timing** — Likelihood Low / Impact Low. Countermove: use `waitForURL` (existing spec convention).

## Rollback
- Delete both new test files. Tests are additive and touch no production code — zero rollback risk. (If a real header fix was needed, that reverts with phase-02.)

## Security Considerations
- Avatar test confirms navigation targets the signed-in user's own profile only (FR-007) — a guardrail against an id-injection regression. No secrets in specs; auth uses the existing `e2e/.auth/user.json` bootstrap, no real OAuth.

## Next Steps
- On green: feature complete. Hand to `reviewer`; update `docs/project-changelog.md` (new routes + header behavior) per documentation-management rules.
