# Review: kudos-modal validation style fix + e2e test-infra hardening

Scope: `components/kudos/kudos-modal.tsx` (style-only diff on the validation `<p role="alert">`), `playwright.config.ts` (`webServer.reuseExistingServer`), `e2e/scripts/run-e2e.mjs` (new `freePort()` step).

## Change 1 — kudos-modal.tsx validation banner style

**No findings — clean.**

`className="text-center font-montserrat text-base font-bold leading-6 tracking-[0.15px] text-details-error"` on line 142:
- `font-montserrat` → font-family Montserrat ✓
- `font-bold` → weight 700 ✓
- `text-base` → 16px (project has no override for `text-base` in `app/globals.css`, so Tailwind v4 default `1rem` applies) ✓
- `leading-6` → 24px (`1.5rem`, no override) ✓
- `tracking-[0.15px]` → exact arbitrary match ✓
- `text-center` → text-align center ✓
- `text-details-error` → resolves to `--details-error: #d4271d` (`app/globals.css:26`), a red — correct color, and it sits on the modal's own `bg-details-modal-background` (`#fff8e1`, cream) via the parent `<div>` since the `<p>` itself carries no `bg-*` class ✓

No stray `bg-*`, `p-*`/`px-*`/`py-*`, or `rounded-*` classes remain from the earlier pill version — the full className list was checked token-by-token and every token maps to something in the target spec. Nothing left over.

(File is untracked in git — `git diff` produced no history to compare the "before" pill version against; reviewed the current state against the stated spec directly instead.)

## Change 2 — Playwright webServer + freePort hardening

### `playwright.config.ts` — `reuseExistingServer: false` (unconditional)
No finding — correct call, not just a local convenience regression. In a genuine CI runner (fresh VM per job) `reuseExistingServer` was already effectively `false` under the old `!process.env.CI` expression, so this change is a no-op for real CI. The only behavior change is local/sandbox: previously-true (silently reused whatever was on :3000, which is exactly the confirmed bug — stale/dev-mode bundle serving with zero hydration). Trade-off is a slower local iteration loop (rebuild+restart every `test:e2e` run) — acceptable and called out in the inline comment.

### `e2e/scripts/run-e2e.mjs` — `ensureBrowserLibs()` vs `freePort()`
No conflict/duplication — independent, order-insensitive (no shared state, sequential calls at lines 114-115). `ensureBrowserLibs()` only touches `LD_LIBRARY_PATH`/apt cache; `freePort()` only touches PIDs on :3000.

### Finding 1 (Warning) — `freePort()` kills unconditionally by port, not by process identity
`freePort()` (lines 96-112) does `lsof -i :3000 -sTCP:LISTEN -t` and SIGKILLs every PID returned, with no check that the process is actually a stale `next`/`node` process belonging to this project. Two real risks:
- **Kills unrelated services.** Anything else a developer has bound to :3000 (another app, a Docker port mapping, etc.) gets silently SIGKILLed. This is a shared, well-known port — collisions with non-Next processes are plausible, not hypothetical.
- **Kills a developer's intentionally-running `next dev` used for manual testing in a parallel terminal.** The task brief's assumption ("a developer wouldn't run test:e2e while using port 3000 for something else") is optimistic — running `next dev` in one terminal while running `npm run test:e2e` in another to cross-check behavior is a normal workflow, not an edge case. There's a console log after the kill (`⚒ Killed stale process on :3000 (pid ...)`) but no confirmation prompt and no way to opt out.

Recommend: before killing, verify the process is actually Next.js (e.g., read `/proc/<pid>/cmdline` and check for `next`/the project's `node_modules/.bin/next` path) and skip/warn instead of kill if it doesn't match. At minimum, log the process's command name (`ps -p <pid> -o comm=`) alongside the PID so the kill is legible, not just a bare number.

### Finding 2 (Suggestion) — SIGKILL with no escalation, ironically risks corrupting `.next`
No SIGTERM-first-then-wait-then-SIGKILL escalation. If the killed process happens to be mid-`next build`/webpack write to `.next/`, an unconditional SIGKILL can leave a torn/partial build output — the same class of "stale/corrupt build served" symptom this whole hardening effort was chasing (per the `BUILD_ID` mtime finding cited in the task brief). Low probability (freePort runs once at script start, before this run's own build begins) but non-zero if a previous run's process is still flushing when this one starts. A `SIGTERM` + short grace period (e.g. 1-2s) before `SIGKILL` would be safer and is the conventional pattern for "make sure this dies" scripts.

### Finding 3 (Suggestion) — no verification the port is actually released before proceeding
`process.kill(pid, "SIGKILL")` sends the signal and returns immediately; it does not confirm the process has exited or that the listening socket has been released. The script then falls straight through to `spawnSync("npx", ["playwright", "test", ...])` with no poll/wait. In practice this is low-risk here because the `webServer.command` is `npm run build && npm run start` — the `npm run build` phase burns real wall-clock time before anything tries to bind :3000 again, giving the OS ample time to reclaim the socket. But the safety currently comes from incidental build duration, not from the script itself. A short poll loop (re-run `lsof -i :3000 -t` until empty, with a timeout) after the kill would make this deterministic instead of timing-dependent, and would also protect a future change that shortens or removes the build step.

### Note — hardening only applies via the wrapper script
`freePort()` and `reuseExistingServer: false` only combine safely when tests are run through `npm run test:e2e` (→ `run-e2e.mjs`). Anyone invoking `npx playwright test` directly (IDE test runner, ad hoc CLI) bypasses `freePort()` and will hit the new hard "port already in use" failure with no auto-recovery. Worth a one-line comment in `playwright.config.ts` or a project README pointer so this isn't rediscovered as a mystery failure later. Not a defect, just a documentation gap.

## Summary

| # | Severity | Item |
|---|----------|------|
| 1 | Warning | `freePort()` kills any PID on :3000 with no check it's actually a stale Next.js process — risks killing unrelated services or a developer's intentional parallel `next dev` |
| 2 | Suggestion | SIGKILL-only, no SIGTERM+grace escalation — small risk of corrupting `.next` mid-write, ironically reproducing the bug class being fixed |
| 3 | Suggestion | No post-kill verification that the port is actually free — currently safe only because `npm run build` provides incidental delay |
| — | Note | Hardening is wrapper-script-only; raw `npx playwright test` bypasses `freePort()` |

Change 1 (kudos-modal.tsx style fix): no findings, fully correct, no leftover pill styling.

**Status:** DONE_WITH_CONCERNS
**Summary:** Style fix (Change 1) is clean and spec-correct, no leftover pill classes. e2e hardening (Change 2) is functionally sound and the `reuseExistingServer: false` change is well-justified with no CI downside, but `freePort()`'s blind, identity-unaware SIGKILL is a real (if narrow) risk to unrelated processes or a developer's parallel manual dev server — worth a process-identity check before merge, not launch-blocking.
**Concerns/Blockers:** freePort() process-identity gap (Finding 1) is the one item worth fixing before relying on this in a shared/team sandbox; Findings 2-3 are minor hardening suggestions, not correctness bugs.
