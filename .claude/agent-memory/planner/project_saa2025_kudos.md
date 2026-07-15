---
name: project-saa2025-kudos
description: SAA-2025 Kudos app — stack, feature-folder convention, kudos data model, and the like/hearts design decision
metadata:
  type: project
---

Sun* Annual Awards 2025 Kudos app. Stack: Next.js 16 App Router, TS strict (zero `any`), Tailwind v4,
Supabase (Postgres/Auth/Storage), next-intl (all UI strings via en.json/vi.json — never hardcode), Tiptap,
Vitest + Playwright. Package manager: npm.

**Feature-folder convention (AGENTS.md, strict):** every feature mirrors `app/<feature>/`,
`components/<feature>/` (one file per field/section, split before ~150-200 lines, NEVER grouped by type),
`lib/<feature>/{types,queries,mutations,validation}.ts`, `e2e/<feature>.spec.ts`. Shared infra (used by >1
feature) lives OUTSIDE feature folders: `components/{layout,ui,auth}/`, `lib/supabase/`. `components/auth/`
(useAuth) is shared, not the login feature.

**Kudos data model (F001):** `profiles` (id, full_name, avatar_url, email, department — department defaults to
placeholder 'CEV1', no real org source yet), `hashtags` (admin-managed, 8 seeded), `kudos` (sender_id
NULLABLE — NULL iff is_anonymous, enforced by check constraint; recipient_id NOT NULL; title; content HTML),
`kudos_hashtags`/`kudos_images`/`kudos_mentions`. ALL kudos writes go through the `create_kudos()` SECURITY
DEFINER RPC — tables have select-only grants, no direct INSERT. Mirror this for any new write path.

**Testing is dual-suite mandatory:** Vitest unit (co-located *.test.ts) + Playwright e2e per feature. e2e runs
against a production build (`next build && next start`, NOT `next dev` — Next 16.2.x Turbopack HMR hydration
bug on non-localhost). Auth in e2e via Supabase Admin API storageState in global-setup, never real OAuth.

**Hard rules:** never new npm deps without approval (@tiptap/*, @playwright/test pre-approved). Never
commit/push unless asked. STOP and ask on ambiguous specs.

Related: [[project-saa2025-kudos-live-board-plan]].
