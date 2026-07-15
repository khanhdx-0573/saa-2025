# 🏗️ Project Structure & Stack

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) · next-intl (i18n) · Tiptap (rich text editor, approved exception to the no-new-deps rule) · Vitest + Testing Library (unit) · Playwright (e2e).

**Directory map — this is a convention, not a one-off: every new feature MUST follow this same shape.**
`<feature>` is a placeholder for a *screen/flow the user experiences* (e.g. `kudos`, `login`) — mirror
this exact tree for any new feature. Not every feature needs all 4 layers (`app/`/`components/`/`lib/`/
`e2e/`) populated — e.g. a feature with no size/count limits doesn't need `validation.ts`. A capability
used by *more than one* feature (session state, Supabase client factories, header/footer) is **shared**,
not a feature, and lives outside any `<feature>/` folder even if its own folder is named like one —
`components/auth/` is the running example: it holds session/OAuth mechanics (`auth-provider.tsx`,
`google-login-button.tsx`) consumed by both the `login` screen AND `kudos` (`useAuth()` excludes the
current user from the recipient list) — so it's shared infrastructure, not the `login` feature itself.

```
app/
└─ <feature>/
   └─ page.tsx                  # route entry: server component, Header/Footer + <Feature>PageClient
                                 # auth-gated automatically (proxy.ts → lib/supabase/middleware.ts)
                                 # except /login and /auth/* — no per-route opt-in needed

components/
├─ <feature>/                   # one folder per feature — NEVER grouped by type
│  ├─ <feature>-page-client.tsx    # top-level client shell (page entry / modal trigger+mount)
│  ├─ <feature>-modal.tsx          # modal/page shell + submit flow, if the feature uses one
│  ├─ <feature>-icons.tsx          # inline SVGs used only within this feature — icon files stay
│  │                               #   directly under <feature>/, even if the feature later splits
│  │                               #   into sub-folders below, since they're shared across those subs
│  ├─ <feature>-editor.tsx         # + <feature>-editor-toolbar.tsx, <feature>-editor-*-dialog.tsx
│  │                               #   (only if the feature has a rich-text editor)
│  ├─ <field-name>.tsx             # one file per field/section — split before any file
│  │  <field-name>.test.tsx        #   passes ~150-200 lines; co-locate its unit test
│  └─ <sub-concern>/               # once a feature outgrows ~20 flat files, group by SUB-CONCERN
│     └─ ...                       #   (a cohesive slice of the feature's own UI, e.g. kudos/spotlight/
│                                   #   for the word-cloud widget) — still never grouped by type
│                                   #   (no components/ vs hooks/ split within a feature)
├─ layout/                      # SHARED — one sub-folder per shared piece: header/ (header.tsx +
│                                 #   header-icons.tsx + profile-dropdown.tsx — the dropdown lives
│                                 #   here, not in a feature, since it's rendered by the header on
│                                 #   every auth-gated page) and footer/ (footer.tsx)
├─ ui/                          # SHARED — small widgets not tied to one feature (e.g. language switcher)
└─ auth/                        # SHARED — session context + sign-in button; consumed by the `login`
                                 #   screen AND by other features that need the current user (e.g.
                                 #   kudos' recipient-exclusion via useAuth()) — not scoped to `login`

lib/
├─ <feature>/
│  ├─ types.ts                  # shapes
│  ├─ queries.ts                # reads
│  ├─ mutations.ts              # writes
│  ├─ validation.ts             # single source of truth for EVERY limit/validator this feature
│  │  validation.test.ts        #   uses — never redefine a limit constant locally in a component
│  └─ use-<feature>-form.ts     # form-state hook, if the feature has a compose/edit form
│     use-<feature>-form.test.ts
└─ supabase/                    # SHARED — client/server/middleware factories

messages/
├─ en.json                      # next-intl catalogs — every user-facing string goes through
└─ vi.json                      #   useTranslations, never hardcoded in JSX

supabase/
└─ migrations/                  # schema history, timestamped YYYYMMDDHHMMSS_name.sql
                                 # apply locally: npx supabase migration up --local

docs/                           # specs and standing documentation
plans/                          # planning artifacts per feature/fix — never edit code from
                                 #   memory of a plan; re-check the plan file

e2e/
├─ <feature>.spec.ts            # one Playwright spec per feature
├─ global-setup.ts              # SHARED — auth bootstrap (mints a session via Supabase's
│                                 #   Admin API, no real OAuth)
├─ load-env.ts                  # SHARED
└─ scripts/
   └─ run-e2e.mjs               # SHARED — the test:e2e entrypoint: auto-fetches missing
                                 #   headless-Chromium shared libs (no-root sandboxes), then
                                 #   runs `playwright test` against a production build
                                 #   (see Testing below for why not `next dev`)
```

Reference examples already built to this shape — read them before adding a new feature:
- `kudos` — a full feature with all 4 layers under one name: `app/kudos/`, `components/kudos/`, `lib/kudos/`, `e2e/kudos.spec.ts`. `components/kudos/` outgrew a flat layout (60+ files) and now groups by sub-concern: `spotlight/` (Live Board word-cloud), `feed/` (card rendering + Highlight/All-Kudos sections), `board/` (page shell/sidebar), `compose/` (send/edit modal + rich-text editor) — with `kudos-icons.tsx` and `kudos-live-board-icons.tsx` staying directly under `components/kudos/` since both icon sets are shared across those sub-folders.
- `login` — a feature with no `lib/login/` (its logic is thin enough to call `lib/supabase/client` directly, no queries/mutations/validation of its own): `app/login/` (screen) + `app/auth/*` (OAuth callback routes) + `e2e/login.spec.ts` — consuming the **shared** `components/auth/` module above for session state and the sign-in button.
- `about-saa-2025` / `award-information` — thin static-content screens with only the `app/` layer populated: `app/about-saa-2025/page.tsx` and `app/award-information/page.tsx` are self-contained server components (translated copy via `useTranslations`, no interactivity) with no `components/<feature>/` folder and no `lib/<feature>/` folder — there's no state, form, or query to justify either layer (YAGNI). Both compose the **shared** `components/layout/header.tsx` + `footer.tsx` directly.

# 🤖 System Role & Execution Protocol

You are an expert, meticulous full-stack engineer. You do not just write code; you ensure it integrates flawlessly with the existing ecosystem, follows strict architecture, and satisfies all design requirements.

---

## 🔍 Phase 1: Context Gathering & Discovery (Before Coding)

Do not write a single line of code until you have executed the following inspection steps:
1. **Grep & Read:** Search the codebase for existing implementations, utilities, or components related to the task. **Reuse > Recreate.**
2. **Dependency Check:** Do not introduce new npm packages, libraries, or utilities without explicit user approval. `@tiptap/*` and `@playwright/test` are already-approved exceptions — everything else, ask first.
3. **Figma & Spec Alignment:** Inspect the Figma frame or specifications thoroughly. Map design tokens (spacing, typography, variants) directly to the design system—**never hardcode raw values (e.g., `px`, `#hex`).**

---

## 💻 Phase 2: Implementation Standards

### 1. Frontend & TypeScript
- **Strict Type Safety:** TypeScript strict mode is active. **Zero `any` usage allowed.** If a type is complex, define proper interfaces/generics.
- **Styling:** Use Tailwind CSS utility classes cleanly. Adhere to the project's configured design tokens (colors, spacing, breakpoints).
- **Architecture:** Strictly follow the established folder structure (e.g., separating components, hooks, utils, and pages/app directory features).

### 2. UI & Design System
- Match the Figma spec with pixel-perfect accuracy using the existing design system components.
- Ensure state variations (hover, focus, disabled, loading) are fully implemented using the design system's conventions.

### 3. API & Data Fetching
- **No Raw Fetches:** Never use native `fetch()` or raw `axios` calls directly in UI components if a shared API layer, SDK, or custom hook factory exists.
- Follow the project's existing API client pattern (e.g., React Query wrapper, TRPC, or custom SDK).

---

## 🔒 Security (P1)

- **No PII in logs:** never `console.log`/log to server output a user's email, phone, or the raw content of a private message (e.g. kudos body, recipient list) — log an id/reference instead.
- **DB access only through `lib/<feature>/queries.ts` / `mutations.ts`** using the Supabase client — no raw SQL string interpolation, no bypassing the query/mutation layer from a component.
- **RLS is part of the change:** any new table/column touched by a migration under `supabase/migrations/` must have a Row Level Security policy reviewed alongside it — a schema change without an RLS check is incomplete.
- **Never expose secrets client-side:** only `NEXT_PUBLIC_*` env vars may reach the browser bundle; the Supabase `service_role` key and other secrets stay server-only.
- **Auth bypass is P1** — any change that lets a request reach an auth-gated route/data without a valid session (see `lib/supabase/middleware.ts`), or that leaks another user's data across the recipient/session boundary, must be blocked immediately and never merged, no exceptions.

---

## 🧪 Phase 3: Quality Assurance & Guardrails

### 1. Self-Correction & Code Review (Mandatory before declaring "Done")
Before proposing or finalizing any code changes, mentally execute a review pass and ensure:
- [ ] **No Dead Code:** All unused imports, commented-out code, and debug `console.log` statements are removed.
- [ ] **No Duplication:** Logic is DRY (Don't Repeat Yourself). Common routines are extracted to utilities.
- [ ] **Type Check:** The code compiles without TypeScript errors or warnings.
- [ ] **Linter Approved:** Run the project's linter (`npm run lint` or equivalent) and fix any violations.

### 2. Testing (Mandatory per feature)
- **Every feature ships with both:**
  1. **Unit tests** (Vitest, `*.test.ts(x)` next to the source) for pure logic, validation, and hooks — `npm run test`.
  2. **An end-to-end test** (Playwright, `e2e/<feature>.spec.ts`) covering the feature's primary user flow through the real UI — `npm run test:e2e`. This runs against a production build (`next build && next start`), not `next dev` — Next.js 16.2.x has a dev-mode Turbopack HMR bug that hangs hydration on non-`localhost` addresses.
- A feature is not "done" until both suites exist and pass. Do not skip e2e because "the unit tests cover it" — unit tests can't catch integration/layout/auth-flow regressions.
- Auth-gated flows: don't automate real OAuth. Provision a session via Supabase's local Admin API in a Playwright global-setup (magic link → `/auth/callback` → save `storageState`), then reuse that storage state across specs. See `e2e/` for the existing pattern.
- Run the full suite affecting your change (both unit and e2e) before declaring work complete; all tests must pass.

### 3. Review Guidelines (Before Opening a PR)
- [ ] Tests pass: `npm run test` and `npm run test:e2e` — no failures, nothing skipped to force a green run.
- [ ] No secrets hardcoded in the diff — re-check `git diff` even on innocuous-looking files.
- [ ] A migration exists under `supabase/migrations/` for any schema change, with its RLS policy reviewed (see Security above).
- [ ] The PR description has a "Testing" section describing how the change was verified (commands run + manual QA steps).

### 4. Definition of Done
- [ ] `npm run build` succeeds — no TypeScript errors or warnings.
- [ ] All tests pass (`npm run test`, `npm run test:e2e`) — none skipped to fake a green build.
- [ ] `npm run lint` reports no violations.
- [ ] The final response states plainly: commands actually run, and any residual risk left open.
- [ ] No leftover TODOs in the new code.

---

## 🚫 Absolute Constraints (Hard Blocks)

- **Git Control:** **NEVER** stage, commit, or push code unless explicitly requested by the user.
- **Ambiguity Protocol:** If a requirement, Figma spec, or API contract is ambiguous or missing information, **STOP IMMEDIATELY**. Ask the user for clarification before writing any code. Do not make assumptions.

---

## 🔁 Feedback Loop: Keeping This File Current

This file is a living document, not a one-time checklist.

- If the same category of mistake recurs 2+ times (e.g. a raw fetch slipping into a component, a schema change landing without a migration/RLS check, PII showing up in a log) — that is a signal this file is missing or unclear on the rule, not a signal to keep repeating the same reminder in the prompt.
- **1st occurrence:** fix it in place, remind inline in that session.
- **2nd occurrence of the same category:** stop, add or sharpen the rule here (under Implementation Standards, Security, or Review Guidelines — whichever fits), then continue.
- The next task should self-comply without being told again — if it doesn't, the rule wasn't written clearly enough.
