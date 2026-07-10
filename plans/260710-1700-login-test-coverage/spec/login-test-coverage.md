---
status: draft
authored_by: takumi
created: 2026-07-10
lang: en
---

## Why It Matters

The login feature (`feat: add login feature`) shipped without the unit + e2e test coverage AGENTS.md
mandates per feature. This closes that gap — no new behavior, just proving the existing behavior.

## Scope (existing, already-shipped behavior being tested)

- `app/login/page.tsx` — unauthenticated landing screen: headline copy + `GoogleLoginButton`.
- `components/auth/google-login-button.tsx` — on click, calls `supabase.auth.signInWithOAuth({ provider:
  "google", options: { redirectTo: "<origin>/auth/callback" } })`; renders `oauthError.message` inline on
  failure.
- `lib/supabase/middleware.ts` (via `proxy.ts`) — unauthenticated visitors to any route other than
  `/login` / `/auth/*` are redirected to `/login`.
- Real Google OAuth is configured locally (`GOOGLE_CLIENT_ID`/`SECRET` present in `.env`) but per
  AGENTS.md e2e rules, tests must never automate a real third-party login — only assert the click wires
  correctly (a request to Supabase's local `/auth/v1/authorize?provider=google` fires).

## Test Plan

**Unit** — `components/auth/google-login-button.test.tsx` (Vitest + Testing Library, mocks
`@/lib/supabase/client`):
1. Renders the translated headline/button label.
2. Click calls `signInWithOAuth` with `{ provider: "google", options: { redirectTo: `${origin}/auth/callback` } }`.
3. No error text renders when `signInWithOAuth` resolves without an error.
4. Renders `oauthError.message` inline when `signInWithOAuth` resolves with an error.

**E2E** — `e2e/login.spec.ts` (Playwright, `test.use({ storageState: { cookies: [], origins: [] } })` to
start unauthenticated, overriding the project's default authenticated `storageState`):
1. Visiting a protected route (`/kudos`) while unauthenticated redirects to `/login`.
2. `/login` renders the headline and the Google login button.
3. Clicking the Google button fires a request to `/auth/v1/authorize` with `provider=google` (captured via
   `page.waitForRequest`) — proves the wiring without following the real external OAuth redirect.

## Out of Scope
- `AuthProvider` (session-state propagation elsewhere in the app) and `app/auth/callback/route.ts` (the
  OAuth callback handler) — neither is part of the login *screen* the user asked for; can be a follow-up.
- Completing a real Google OAuth login end-to-end (explicitly forbidden by AGENTS.md).
