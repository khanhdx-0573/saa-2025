# 🚨 CRITICAL: NEXT.JS VERSION ALERT
This project uses a modern/custom version of Next.js with breaking changes. APIs, file structures, and conventions WILL differ from your pre-trained data.
- **Mandatory:** Always read the relevant documentation in `node_modules/next/dist/docs/` before writing or modifying any Next.js-related code.
- **Strict adherence:** Strictly follow deprecation notices found in the codebase or logs. Do not guess APIs.

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
│  ├─ <feature>-icons.tsx          # inline SVGs used only within this feature
│  ├─ <feature>-editor.tsx         # + <feature>-editor-toolbar.tsx, <feature>-editor-*-dialog.tsx
│  │                               #   (only if the feature has a rich-text editor)
│  └─ <field-name>.tsx             # one file per field/section — split before any file
│     <field-name>.test.tsx        #   passes ~150-200 lines; co-locate its unit test
├─ layout/                      # SHARED — header, footer
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
- `kudos` — a full feature with all 4 layers under one name: `app/kudos/`, `components/kudos/`, `lib/kudos/`, `e2e/kudos.spec.ts`.
- `login` — a feature with no `lib/login/` (its logic is thin enough to call `lib/supabase/client` directly, no queries/mutations/validation of its own): `app/login/` (screen) + `app/auth/*` (OAuth callback routes) + `e2e/login.spec.ts` — consuming the **shared** `components/auth/` module above for session state and the sign-in button.

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

---

## 🚫 Absolute Constraints (Hard Blocks)

- **Git Control:** **NEVER** stage, commit, or push code unless explicitly requested by the user.
- **Ambiguity Protocol:** If a requirement, Figma spec, or API contract is ambiguous or missing information, **STOP IMMEDIATELY**. Ask the user for clarification before writing any code. Do not make assumptions.
