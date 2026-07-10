---
phase: 2
title: "Backend Data Layer"
status: completed
effort: "0.5d"
---

# Phase 2: Backend Data Layer

## Context Links

- Depends on: [Phase 1 — Database Schema & Supabase Setup](./phase-01-database-schema-supabase-setup.md)
- Spec: [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md) → `## Cross-Cutting Logic > ### Algorithms`
- Existing pattern: `lib/supabase/server.ts`, `lib/supabase/client.ts` (async `createClient()` per-request, no globals)

## Overview

**Priority:** P0 (UI phases 3-4 call these functions directly, no separate API route layer exists in this repo)
**Status:** Pending

Thin typed wrapper functions around Supabase queries: search profiles (recipient/@mention),
list active hashtags, upload/validate images, and call `create_kudos`. Per AGENTS.md this repo has
no existing API-client abstraction (no React Query/tRPC) — these are plain async functions called
from Client/Server Components, following the same pattern as `google-login-button.tsx` calling
`createClient()` directly.

## Key Insights

- No existing `lib/kudos/` module — this is the first non-auth data module in the codebase.
- Image validation (type + 5MB size) must run client-side (fast UX feedback) AND here (defense in
  depth — never trust the browser alone).
- `create_kudos` already re-validates hashtag cardinality server-side (Phase 1) — this layer still
  checks image count (≤5) since that's not enforced by the RPC.

## Requirements

- FR: search profiles by name substring, case-insensitive, excluding no one (recipient can be
  anyone in the directory, including — per spec Assumptions — the sender; no self-kudos block).
- FR: list active hashtags for the picker.
- FR: upload 0-5 validated images to `kudos-images/{uid}/...` before calling `create_kudos`.
- FR: submit a kudos via `create_kudos`, passing uploaded image paths + hashtag ids + mention ids.

## Architecture

```
components (Phase 3/4)
   -> lib/kudos/queries.ts   (searchProfiles, listHashtags)
   -> lib/kudos/mutations.ts (uploadKudosImages, createKudos)
   -> lib/kudos/validation.ts (image type/size guards, hashtag count guard)
   -> lib/supabase/client.ts / server.ts (existing)
```

## Related Code Files

**Create:**
- `lib/kudos/queries.ts` — `searchProfiles(query: string)`, `listHashtags()`
- `lib/kudos/mutations.ts` — `uploadKudosImages(files: File[])`, `createKudos(input: CreateKudosInput)`
- `lib/kudos/validation.ts` — `isValidKudosImage(file: File)`, `MAX_KUDOS_IMAGES`, `MAX_KUDOS_IMAGE_BYTES`
- `lib/kudos/types.ts` — `Profile`, `Hashtag`, `CreateKudosInput`

**Read for context:** `lib/supabase/client.ts`, `lib/supabase/server.ts`

## Implementation Steps

1. **`lib/kudos/types.ts`** — shared types, no `any`:
   ```ts
   export type Profile = { id: string; full_name: string | null; avatar_url: string | null };
   export type Hashtag = { id: number; name: string };
   export type CreateKudosInput = {
     recipientId: string;
     content: string;
     isAnonymous: boolean;
     anonymousDisplayName: string | null;
     hashtagIds: number[];
     imagePaths: string[];
     mentionedProfileIds: string[];
   };
   ```

2. **`lib/kudos/validation.ts`**:
   ```ts
   export const MAX_KUDOS_IMAGES = 5;
   export const MAX_KUDOS_IMAGE_BYTES = 5 * 1024 * 1024;
   const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

   export function isValidKudosImage(file: File): boolean {
     return ALLOWED_MIME_TYPES.has(file.type) && file.size <= MAX_KUDOS_IMAGE_BYTES;
   }
   ```

3. **`lib/kudos/queries.ts`** (client-side; uses `createClient` from `lib/supabase/client.ts`
   since search happens interactively while the modal is open):
   ```ts
   import { createClient } from "@/lib/supabase/client";
   import type { Profile, Hashtag } from "./types";

   export async function searchProfiles(query: string): Promise<Profile[]> {
     const supabase = createClient();
     const trimmed = query.trim();
     if (trimmed.length === 0) return [];
     const { data, error } = await supabase
       .from("profiles")
       .select("id, full_name, avatar_url")
       .ilike("full_name", `%${trimmed}%`)
       .limit(10);
     if (error) throw error;
     return data ?? [];
   }

   export async function listHashtags(): Promise<Hashtag[]> {
     const supabase = createClient();
     const { data, error } = await supabase
       .from("hashtags")
       .select("id, name")
       .order("name");
     if (error) throw error;
     return data ?? [];
   }
   ```
   RLS already filters `is_active` server-side (Phase 1 policy) — no extra `.eq("is_active", true)` needed.

4. **`lib/kudos/mutations.ts`**:
   ```ts
   import { createClient } from "@/lib/supabase/client";
   import { isValidKudosImage, MAX_KUDOS_IMAGES } from "./validation";
   import type { CreateKudosInput } from "./types";

   export async function uploadKudosImages(files: File[]): Promise<string[]> {
     if (files.length > MAX_KUDOS_IMAGES) {
       throw new Error(`Maximum ${MAX_KUDOS_IMAGES} images allowed`);
     }
     const supabase = createClient();
     const { data: userData, error: userError } = await supabase.auth.getUser();
     if (userError || !userData.user) throw new Error("Not authenticated");

     const paths: string[] = [];
     for (const file of files) {
       if (!isValidKudosImage(file)) {
         throw new Error(`Invalid file: ${file.name} (type or size not allowed)`);
       }
       const ext = file.name.split(".").pop() ?? "bin";
       const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;
       const { error } = await supabase.storage.from("kudos-images").upload(path, file);
       if (error) throw error;
       paths.push(path);
     }
     return paths;
   }

   export async function createKudos(input: CreateKudosInput): Promise<string> {
     const supabase = createClient();
     const { data, error } = await supabase.rpc("create_kudos", {
       p_recipient_id: input.recipientId,
       p_content: input.content,
       p_is_anonymous: input.isAnonymous,
       p_anonymous_display_name: input.anonymousDisplayName,
       p_hashtag_ids: input.hashtagIds,
       p_image_paths: input.imagePaths,
       p_mentioned_profile_ids: input.mentionedProfileIds,
     });
     if (error) throw error;
     return data as string;
   }
   ```

5. Verify TypeScript compiles (`npx tsc --noEmit` or `npm run build` once components consume these
   — no standalone build step exists yet at this phase, so defer full verification to Phase 4/6, but
   run `npx tsc --noEmit lib/kudos/*.ts` as a quick sanity check now if the project's `tsconfig.json`
   supports single-file checks; otherwise wait for Phase 4 wiring.

## Todo List

- [x] `lib/kudos/types.ts` with `Profile`, `Hashtag`, `CreateKudosInput`
- [x] `lib/kudos/validation.ts` with image type/size guard + constants
- [x] `lib/kudos/queries.ts` with `searchProfiles`, `listHashtags`
- [x] `lib/kudos/mutations.ts` with `uploadKudosImages`, `createKudos`
- [x] No `any` types; all Supabase errors thrown (not swallowed)

## Success Criteria

- [x] `searchProfiles("")` returns `[]` without hitting the network (empty-query guard)
- [x] `uploadKudosImages` rejects a 6th file and any non-jpg/png/oversized file before any network call
- [x] `createKudos` returns the new kudos id on success and rethrows the RPC error on failure (e.g. 0 hashtags)
- [x] `npm run lint` passes with zero new warnings in `lib/kudos/`

## Risk Assessment

- **RPC param name typos**: Postgres RPC named-parameter calls fail silently-ish with a clear error
  if a `p_*` key is misspelled — verify against the exact signature from Phase 1 Step 4 before wiring
  the UI, ideally with one manual `supabase.rpc(...)` call in a scratch script or the browser console.

## Security Considerations

- Client never sets `sender_id` — it's derived server-side in the RPC from `auth.uid()`, so a
  tampered client request cannot spoof another user's identity or fake an anonymous send's exemption.
- Image upload validates type/size before any network call, and again relies on the Phase 1 storage
  policy (own-folder-only) as the actual security boundary — client validation is UX only.

## Next Steps

- Phase 3 (Hashtag Picker) and Phase 4 (Write Kudos Modal) both import from `lib/kudos/*`.
