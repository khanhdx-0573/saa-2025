---
phase: 5
title: "Kudos Entry Page & i18n"
status: completed
effort: "0.25d"
---

# Phase 5: Kudos Entry Page & i18n

## Context Links

- Depends on: [Phase 4 — Write Kudos Modal](./phase-04-write-kudos-modal.md)
- Existing page pattern: `app/login/page.tsx` (Server Component page, `Header`/`Footer` layout,
  `useTranslations` for copy)
- Existing auth gate: `lib/supabase/middleware.ts` (already redirects unauthenticated requests to
  `/login` for any path not starting with `/login` or `/auth` — `/kudos` is already covered, no
  middleware change needed)

## Overview

**Priority:** P1
**Status:** Pending

Adds the minimal `/kudos` route: `Header` + `Footer` shell (matching `app/login/page.tsx`'s
structure) with a single "Viết Kudo" button that opens the Phase 4 modal. No feed/list of past
kudos in this phase's scope (per locked decision) — just the entry point.

## Key Insights

- `lib/supabase/middleware.ts` already redirects any unauthenticated request outside `/login`/`/auth`
  to `/login` — so `/kudos` is auth-gated for free, no new middleware logic needed. Verify this by
  reading the middleware once more before writing the page, not by assuming.
- The modal itself is a Client Component (`"use client"`, per Phase 4); the page can stay a Server
  Component and just mount the client modal + trigger button.

## Requirements

- FR: `/kudos` renders behind the existing auth gate.
- FR: a single "Viết Kudo" button opens the modal from Phase 4.
- FR: all new copy goes through `next-intl` (`en.json` + `vi.json`), consistent with the rest of the app.

## Architecture

```
app/kudos/page.tsx (Server Component)
  <Header /> <Footer />           -- reuse existing layout components
  <KudosPageClient />             -- "use client": owns open/close state, mounts <KudosModal>
```

## Related Code Files

**Create:**
- `app/kudos/page.tsx` — the route
- `components/kudos/kudos-page-client.tsx` — client wrapper owning modal open/close state + trigger button

**Modify:**
- `messages/en.json`, `messages/vi.json` — add a `"KudosPage"` namespace (button label, page heading if any)

**Read for context:** `app/login/page.tsx`, `components/layout/header.tsx`, `components/layout/footer.tsx`

## Implementation Steps

1. Re-read `lib/supabase/middleware.ts` to confirm `/kudos` is covered by the existing auth redirect
   (it checks `!pathname.startsWith('/login') && !pathname.startsWith('/auth')` — `/kudos` falls
   through to the redirect branch when unauthenticated). No change needed here; just confirm.
2. Create `components/kudos/kudos-page-client.tsx`:
   ```tsx
   "use client";
   import { useState } from "react";
   import { useTranslations } from "next-intl";
   import { KudosModal } from "./kudos-modal";

   export function KudosPageClient() {
     const t = useTranslations("KudosPage");
     const [open, setOpen] = useState(false);
     return (
       <>
         <button type="button" onClick={() => setOpen(true)} className="/* reuse existing button token pattern, e.g. bg-details-text-primary-1 like google-login-button.tsx */">
           {t("writeKudoButton")}
         </button>
         <KudosModal open={open} onClose={() => setOpen(false)} />
       </>
     );
   }
   ```
   Match the button's visual style to the existing `google-login-button.tsx` primary-button pattern
   (`bg-details-text-primary-1` + `text-details-text-primary-2`) unless the MoMorph design specifies
   a different style for this specific trigger — there is no MoMorph screen for `/kudos` itself
   (only the modal + picker), so this page's own chrome is NOT pixel-spec'd; keep it minimal and
   consistent with the existing design system tokens rather than inventing new ones.
3. Create `app/kudos/page.tsx`:
   ```tsx
   import { Header } from "@/components/layout/header";
   import { Footer } from "@/components/layout/footer";
   import { KudosPageClient } from "@/components/kudos/kudos-page-client";

   export default function KudosPage() {
     return (
       <div className="flex min-h-screen flex-col">
         <Header />
         <main className="flex flex-1 items-center justify-center">
           <KudosPageClient />
         </main>
         <Footer />
       </div>
     );
   }
   ```
4. Add `"KudosPage": { "writeKudoButton": "..." }` to both message files (English label for `en.json`,
   Vietnamese "Viết Kudo" for `vi.json`, matching the MoMorph copy exactly for `vi.json`).
5. Manually verify: visiting `/kudos` while logged out redirects to `/login`; while logged in, shows
   the button; clicking it opens the Phase 4 modal.

## Todo List

- [x] Confirmed `/kudos` is auth-gated via existing middleware (no middleware change made)
- [x] `app/kudos/page.tsx` created, reuses `Header`/`Footer`
- [x] `kudos-page-client.tsx` created, mounts `<KudosModal>`
- [x] i18n keys added to both `en.json` and `vi.json`

## Success Criteria

- [x] Logged-out visit to `/kudos` redirects to `/login`
- [x] Logged-in visit to `/kudos` shows the trigger button and opens the modal on click
- [x] `npm run lint` and `npm run build` pass

## Risk Assessment

- Low risk — this phase is thin glue code; the real complexity is entirely in Phase 3/4.

## Security Considerations

- Relies entirely on the existing, already-shipped middleware auth gate — no new security surface introduced.

## Next Steps

- Phase 6 covers testing across all prior phases.
