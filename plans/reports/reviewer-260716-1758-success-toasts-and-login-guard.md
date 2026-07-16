# Review: success toasts + login guard (feat/success-toasts-and-login-guard vs main)

## Scope
- Diff: `git diff main` (18 files, +216/-93) + untracked `components/auth/login-toast-listener.tsx`
- Verified: `npx tsc --noEmit` (clean), `npm run build` (succeeds), `npm run lint` (3 pre-existing errors, unchanged vs main), `npx vitest run` (171 passed / **6 failed**, all in `header.test.tsx`)

## CRITICAL

### 1. `header.test.tsx` — 6 of 8 tests fail on this branch (was already broken on main, differently)
Ran `npx vitest run` on the branch: **6 failed / 2 passed** in `components/layout/header/header.test.tsx`. Ran the same on `main` (stash): **8 failed / 0 passed** (crash: `useRouter` mock missing). The task description frames the `useRouter` mock addition (`header.test.tsx:13`) as "fixing a pre-existing test bug" — it does fix the crash, but unmasks a second, deeper pre-existing bug that keeps 6 tests red:

`getByRole("link", { name: "navKudos" })` (and `navAboutSaa`/`navAwardInfo`) throws `Found multiple elements` because `Header` (`components/layout/header/header.tsx:105-123` desktop nav, `:159-179` mobile nav) always renders BOTH nav lists in the DOM — visibility is CSS-only (`hidden xl:flex` / `xl:hidden`), which jsdom doesn't apply. Every test that queries by role+name for a nav link matches two `<a>` elements.

Failing: `header.test.tsx:55-57,87,99` (5 nav-tab assertions) — 6 test cases total once `it.each` is expanded.

This is a **regression from "broken and visibly red" to "differently broken and still red"** — not fixed by this PR despite the framing, and it directly contradicts AGENTS.md Definition of Done ("All tests pass ... none skipped to fake a green build") and this task's own instruction not to declare done with failing tests. **This must be fixed before push/PR** — either scope queries to the desktop `<nav>` container (`within(...)`) or use `getAllByRole` and assert on the visible/desktop one specifically.

## Informational / Non-blocking

### 2. `lib/supabase/middleware.ts` — auth logic reviewed, no bypass/open-redirect/loop found
Read the full file (not just the diff hunk). The new `user && pathname === '/login'` branch (lines 52-76):
- Referer redirect is same-origin gated (`refererUrl.origin === request.nextUrl.origin`) before use — no open redirect to an external host even with a spoofed `Referer` (spoofing is not browser-reachable anyway; a raw HTTP client could set it, but the target stays same-origin, so worst case is bouncing an already-authenticated user to another page they're already authorized for — not a privilege escalation).
- Referer excludes `/login` and `/auth/*` as bounce targets, and the fallback (`/kudos`) is a fixed same-origin path — no loop: after either redirect, the destination pathname is never `/login` again, so the branch can't re-trigger.
- Malformed `Referer` (`new URL()` throws) falls through to the `/kudos` default via try/catch — handled.
- Interaction with the pre-existing `!user` → `/login` rule: mutually exclusive conditions (`!user` vs `user`), no shared state, no way to hit both in one request.
- Did not find a path where an unauthenticated request reaches a protected resource without valid claims.

One adjacent, **pre-existing** (not introduced by this diff) latent issue worth flagging since this diff touches the neighboring code: `app/auth/callback/route.ts:8` — `next.startsWith("/")` accepts protocol-relative URLs like `//evil.com/x` (also starts with `/`), which `NextResponse.redirect` will happily follow to an external host. Currently unreachable in practice because `components/auth/google-login-button.tsx:17` always sets `redirectTo` to `${origin}/auth/callback` with no `next` param, so `next` defaults to `/kudos` on every real login. Not this PR's bug, but flagging since it's a stone's throw from the code you touched.

### 3. `app/layout.tsx` — `<Toaster/>` before `{children}` reasoning is sound
React fires passive effects in commit-tree order: earlier JSX siblings' effect subtrees fully flush before later siblings' start. `<Toaster/>` as the first child of `<body>` means its internal subscription effect runs before any effect in `<NextIntlClientProvider>{children}</NextIntlClientProvider>`'s subtree, including `LoginToastListener`'s mount effect — so the race the comment describes (`app/layout.tsx:44-51`) is real and the fix is correct.
No layout impact: sonner's `Toaster` is rendered as a `position: fixed` container (removed from normal flow) — it will not participate in `<body className="min-h-full flex flex-col">`'s flex layout regardless of DOM position. (Verified by reasoning about sonner's known behavior; direct source inspection was sandboxed out via `node_modules` deny-list in this environment — worth a 30-second visual smoke check if that matters to you.)

### 4. `login=success` round-trip — one real (very low severity, currently unreachable) edge case
- Double-fire: guarded — `LoginToastListener` (`components/auth/login-toast-listener.tsx:20-28`) strips the param via synchronous `history.replaceState` right after `toast.success`, so even React 18 Strict Mode's double-invoke can't double-fire (2nd invocation reads the already-stripped URL).
- Never-fire: if `next` ever equalled `/login` (e.g. `/auth/callback?code=...&next=/login`), the middleware's new authenticated-redirect-away-from-`/login` rule (finding #2) would immediately 302 away before the client-side listener ever mounts, silently swallowing the toast. **Currently unreachable** through this app's own UI — `GoogleLoginButton` never sets `next`, and the unauthenticated-redirect rule in middleware also never sets `next` when bouncing a protected-route visitor to `/login`. Not a bug today, just a landmine if `next` preservation is added later without revisiting this interaction.
- Listener is correctly scoped — only rendered in `Header`'s authenticated branch (`header.tsx:88-90`), never in the unauthenticated branch (`header.tsx:71-86`) or on `/login` itself, so it can't fire pre-login.
- History/bookmark leak: `replaceState` removes the param from the current entry immediately; no lingering bookmark risk beyond an unlikely mid-flight copy of the URL bar.

### 5. Dead code / cleanup — clean
No stray references to the deleted `components/ui/toast.tsx` or `useToast`/`ToastProvider` anywhere in the tree (grepped `.ts(x)`). `profile-dropdown.test.tsx` wasn't touched and didn't need to be — it never had a `ToastProvider` wrapper (the toast call there is new in this diff, sonner needs no wrapper, so no test breakage). No `console.log`, no `any`, no raw `fetch()` introduced by the diff.

### 6. Test coverage gaps (not blocking, but worth logging)
- No e2e test covers the new "authenticated user hitting `/login` gets bounced" behavior — `e2e/login.spec.ts` only covers the unauthenticated path. Given this is the P1-flagged auth/security change in the diff, an e2e case (sign in once via existing storageState, `page.goto("/login")`, assert redirected away) would close the loop.
- No unit test asserts the new `toast.success(...)` calls in `kudos-modal.tsx` / `kudos-edit-modal.tsx` (neither component has a test file at all — pre-existing gap, not a regression).

### 7. Scope note
`README.md` (+120 lines, Vietnamese deploy/Vercel runbook) is bundled into this diff but isn't part of the toast/login-guard feature described in the task. No secrets in it, but it's unrelated scope riding along — flag for the author, not a quality issue.

## Positive observations
- `getClaimsSafely()` wraps `getClaims()` in try/catch (pre-existing, unmodified, but noted as good defensive practice already in place).
- The referer-redirect branch is properly defensive: origin check, path exclusions, try/catch around `new URL()`, safe fallback.
- i18n keys (`loginSuccess`, `logoutSuccess`, `submitSuccess`, `saveSuccess`) added correctly to both `en.json`/`vi.json` under the right namespaces.
- `tsc --noEmit` clean, `next build` succeeds, no new lint violations vs. `main`.

## Unresolved Questions
- None for the author to answer before fixing #1 — the failure is deterministic and reproducible (`npx vitest run components/layout/header/header.test.tsx`).
