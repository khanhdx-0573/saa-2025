# Study Report: Best E2E Testing Strategy for saa-2025 (Next.js 16 + React 19 + Supabase Auth)

Date: 2026-07-10

## Summary

Root cause of the "React doesn't hydrate in Playwright" blocker found: this is a **known upstream Next.js
16.2.x dev-mode bug**, not an environment/sandbox problem. In dev mode with Turbopack, the RSC client runtime
waits on **two** streams before calling `createRoot()`/hydrating — the RSC payload stream and a `debugChannel`
stream fed by `REACT_DEBUG_CHUNK` messages over the HMR WebSocket. If that WebSocket fails to connect (which
happens routinely for non-`localhost` access — container/sandbox IPs, `127.0.0.1`, reverse proxies, remote
dev servers), the debug channel's writer never closes, so `await initialServerResponse` hangs forever and
`createRoot().render()` is **never called** — a permanently blank/inert page with 0 attached React renderers.
This is an exact match for what we observed (`reactPropsKeys: []`, `rendererCount: 0`, HTML present but
nothing clickable, reproduced across completely unrelated components). Production builds are **unaffected**
(`debugChannel` is dev-only), so the fix is: **run e2e tests against `next build && next start`, not `next dev`**.

Separately, the auth-bootstrap approach already built (Admin API → `generate_link` → `/auth/v1/verify` →
hand-built `sb-*-auth-token` cookie → `storageState`) matches the community-recommended pattern for Supabase +
Playwright: skip real OAuth/magic-link browser flows entirely, mint a session via the Admin/REST API, and
inject it via `storageState` in `globalSetup`. Keep that part as-is — it was verified working (middleware let
`/kudos` through without redirect). Only the **webServer target** needs to change.

## Study Methodology
- Sources consulted: 5 WebSearch queries + 1 direct GitHub discussion fetch (`gh api`)
- Date range: discussion opened against Next.js 16.2.0/16.2.1 (current project pins `next@16.2.10` — same
  code path, no fix landed as of this writing)
- Key search terms: "Playwright Next.js App Router authenticated e2e storageState", "Supabase Auth Playwright
  global setup", "Playwright headless Chromium React not hydrating WSL", "playwright install-deps missing
  dependencies", "Next.js Turbopack Playwright webServer hydration HMR"

## Key Findings

### 1. Root cause: Next.js dev-mode `debugChannel` + HMR WebSocket deadlock

GitHub discussion [vercel/next.js#91770](https://github.com/vercel/next.js/discussions/91770) documents
precisely this failure mode:

- Reproduced on Next.js 16.2.0/16.2.1, React 19.2.3, Turbopack, inside Docker — i.e. any time the browser
  reaches the dev server via a **non-`localhost` address**.
- Console shows `WebSocket connection to 'ws://<host>:3000/_next/webpack-hmr?id=...' failed`.
- `createFromReadableStream(readable, { debugChannel, ... })` in
  `react-server-dom-turbopack-client.browser.development.js` requires **both** `startReadingFromStream` (RSC
  payload) and `startReadingFromUniversalStream` (debug channel) to signal done before `close(response)` is
  called. The debug channel only closes when `REACT_DEBUG_CHUNK` arrives over the HMR socket — which never
  happens if that socket can't connect.
- Confirmed by the reporter with a source patch: setting `debugChannel: undefined` makes the page render
  correctly even with the WebSocket still failing — proving the debug channel is the blocker, not anything
  else in the render path.
- **"Production builds are unaffected because `debugChannel` is a dev-only feature."**

This matches our case exactly: `baseURL: "http://127.0.0.1:3000"` in `playwright.config.ts`, a manually
unpacked headless Chromium in a sandbox with no normal browser-launch privileges — a textbook "non-localhost /
constrained environment" setup where the HMR WebSocket handshake is exactly the kind of thing that fails
silently. It also explains why the failure was **identical across totally unrelated components** (Kudos
modal, language switcher): nothing React-owned had mounted at all, because `hydrateRoot`/`createRoot` was
never reached.

### 2. Supabase Auth + Playwright: current approach is the documented best practice

Cross-checked against multiple sources ([Playwright auth docs](https://playwright.dev/docs/auth),
[mokkapps.de](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test),
[bekapod.dev](https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/)):

- Recommended pattern: **one `globalSetup`/setup-project that authenticates once via API, then
  `storageState` reused across all tests** — not a UI login per test.
- For Supabase specifically: since session state lives in `@supabase/ssr` cookies (not React
  state/localStorage on the server side), the correct move is exactly what's already implemented — mint a
  session server-side (Admin API `generate_link` + `/auth/v1/verify`) and write the cookie directly into
  `storageState`, skipping the browser-based magic-link/OAuth redirect dance entirely.
- Community guidance also flags: **regenerate the session in CI/setup rather than committing a static token**
  (JWT signing keys rotate, schema migrates) — current `global-setup.ts` already creates/reuses a dedicated
  `e2e-test@example.com` user per run, which satisfies this.
- Nothing to change here. This part was already correctly designed and previously verified (middleware let
  `/kudos` through with no redirect).

### 3. Environment/dependency checklist (secondary, likely NOT the actual cause here)

From [Playwright missing-deps issues](https://github.com/microsoft/playwright/issues/38334) and
[bstefanski.com](https://www.bstefanski.com/blog/playwright-missing-dependencies): headless Chromium commonly
needs `libnss3`, `libnspr4`, `libasound2`/`libasound2t64`, `libglib-2.0.so.0`, `libgobject-2.0.so.0` etc. The
session already self-extracted several of these via `.deb` + `LD_LIBRARY_PATH`, and the browser did launch,
navigate, and receive correct server-rendered HTML with 0 failed/4xx network requests — so the browser
environment itself was not the blocker. This checklist is worth keeping handy only if a *new* symptom (browser
fails to launch at all, or `pageerror` on navigation) appears later; it does not explain the hydration hang,
which is fully accounted for by finding #1.

### 4. Turbopack HMR is independently fragile under proxies/non-standard hosts

Multiple open Next.js issues confirm Turbopack's dev HMR (WebSocket-based) is known to break under
reverse proxies, container IPs, and non-`localhost` hosts even outside the specific debugChannel bug above
(e.g. [turborepo#2496](https://github.com/vercel/turborepo/issues/2496)). This reinforces: **don't fight dev-mode
HMR for e2e** — production mode has no HMR/WebSocket dependency at all, removing this whole failure class.

## Comparative Analysis: `next dev` vs `next build && next start` for e2e

| | `next dev` (current) | `next build && next start` (recommended) |
|---|---|---|
| HMR/WebSocket dependency | Yes — exact cause of the hang | None |
| debugChannel hydration blocker | Present (dev-only) | Absent |
| Startup time per test run | Faster to boot, but was hanging forever anyway | Slightly slower (build step), but deterministic |
| Fidelity to production behavior | Lower (dev-only codepaths, extra checks) | Higher — what actually ships |
| Turbopack proxy/non-localhost fragility | Yes | N/A |

Given the app is auth-gated and e2e is specifically about verifying real user flows, testing against a
production build is also generally considered better practice regardless of this bug — dev mode ships extra
warnings/overlays/Fast Refresh machinery that isn't representative of what users hit.

## Recommendations

### Getting Started — concrete change to make

1. Add a build-and-serve script and point Playwright's `webServer` at it instead of `dev`:

```json
// package.json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:build": "next build"
}
```

```ts
// playwright.config.ts
webServer: {
  command: "npm run build && npm run start",
  url: "http://127.0.0.1:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000, // build takes longer than dev boot
},
```

   (Keep `next dev` for interactive/manual browsing; only the Playwright-driven server needs to be a
   production build.)

2. Re-run `npx playwright test` against this config. Expect hydration to succeed since `debugChannel` doesn't
   exist in production builds — this should unblock `e2e/kudos.spec.ts` without touching any app code.

3. Leave `e2e/global-setup.ts`'s Supabase Admin-API cookie-minting approach untouched — it's already aligned
   with best practice and was independently verified working.

4. If a production-build run *still* fails to hydrate (would indicate a different, unrelated bug), fall back
   to the dependency checklist in Finding #3, and re-check `proxy.ts`'s matcher (already patched to exclude
   `_next/webpack-hmr`, which is irrelevant once HMR is gone entirely in prod mode).

### Common Mistakes to avoid
- Don't keep chasing this as an environment/sandbox problem — the GitHub discussion reproduces the identical
  symptom in plain Docker on a normal host, with no exotic sandboxing involved. It's a Next.js bug, not a
  "this machine is missing some `.so` file" problem.
- Don't try to patch `node_modules/next` directly to unblock this (the discussion's `debugChannel: undefined`
  patch is a proof-of-concept, not a supported fix) — switching to a production build sidesteps it cleanly
  with zero patching.
- Don't add `dotenv` or other new deps for the `.env` parsing in `e2e/load-env.ts` — the hand-rolled parser
  already satisfies AGENTS.md's dependency-approval rule.

## Sources & References

### Official Documentation
- [Playwright — Authentication](https://playwright.dev/docs/auth)

### Recommended Reading
- [vercel/next.js discussion #91770 — Dev mode: blank page when SSR error + HMR WebSocket fails](https://github.com/vercel/next.js/discussions/91770) (root cause, read in full via `gh api`)
- [Login at Supabase via REST API in Playwright E2E Test — mokkapps.de](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test)
- [Testing Supabase Magic Login in CI with Playwright — bekapod.dev](https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/)
- [Playwright E2E Testing for Next.js: Auth Setup, Stripe Checkout, CI — dev.to](https://dev.to/whoffagents/playwright-e2e-testing-for-nextjs-auth-setup-stripe-checkout-and-ci-integration-4ndg)

### Community Resources
- [microsoft/playwright#38334 — missing dependencies installing Chromium on Debian 12](https://github.com/microsoft/playwright/issues/38334)
- [vercel/turborepo#2496 — Turbopack HMR WebSocket failures](https://github.com/vercel/turborepo/issues/2496)

## Appendix: Unresolved Questions
- Next.js has not shipped a fix for #91770 as of `next@16.2.10` (current project version) — worth watching the
  discussion/changelog; if Anthropic/Vercel patches it, dev-mode e2e becomes viable again, but there's no
  reason to wait for that given prod-mode sidesteps it today.
- Not yet re-verified empirically in this repo (build + start + playwright run) — that's the immediate next
  action, separate from this research deliverable.
