---
phase: 4
title: "Write Kudos Modal"
status: completed
effort: "1.5d"
---

# Phase 4: Write Kudos Modal

## Context Links

- Depends on: [Phase 2 — Backend Data Layer](./phase-02-backend-data-layer.md), [Phase 3 — Hashtag Picker Component](./phase-03-hashtag-picker-component.md)
- MoMorph screen: "Viết Kudo" — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Spec: [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md) → US001, US003, US004, US005; [`spec/send-kudos/edge-cases.md`](./spec/send-kudos/edge-cases.md)
- Existing form-adjacent pattern: `components/auth/google-login-button.tsx` (client component,
  `"use client"`, local `useState` error handling, calls Supabase directly — no form library in repo)

## Overview

**Priority:** P0 (the feature's core deliverable)
**Status:** Pending

Builds the full "Viết Kudo" compose modal: recipient autocomplete, Tiptap rich-text editor with
@mention and a formatting toolbar, the hashtag chip field (opens Phase 3's picker), image
attachment (0-5, validated), anonymous toggle, and Cancel/Submit with the exact enable/disable
gating from the spec.

## Key Insights

- **New dependency approved**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
  `@tiptap/extension-mention` — this is an explicit, user-approved exception to AGENTS.md's
  "no new packages" default. Pin versions compatible with React 19 (verify via `npm view
  @tiptap/react peerDependencies` before installing — Tiptap 2.x supports React 18/19; if the
  latest major has an open React 19 compatibility issue, pin the last known-good minor instead of
  `latest`).
- No modal/dialog primitive exists yet in `components/ui/` — this phase builds one from scratch
  (or uses the native `<dialog>` element, which needs no new dependency and handles focus-trap +
  ESC-to-close natively in modern browsers — prefer this over hand-rolling a portal+overlay unless
  it can't meet the design).
- Submit-button gating is the single most test-covered piece of this screen (spec edge-cases.md)
  — implement it as one derived boolean, not scattered conditionals.

## Requirements

See [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md) `## Cross-Cutting Logic`
for the authoritative FR/BR list. Summarized for this phase:

- Recipient: required, autocomplete search over `searchProfiles`, exactly one selection.
- Content: required, Tiptap editor, toolbar = Bold/Italic/Strikethrough/Ordered-list/Link/Quote,
  "@" triggers mention suggestions from `searchProfiles`.
- Hashtags: required, 1-5, via Phase 3's `<HashtagPicker>` opened from a "+ Hashtag" trigger, shown
  as removable chips.
- Images: optional, 0-5, jpg/png ≤5MB each, thumbnail grid with per-image remove, "+ Image" hides at 5.
- Anonymous: optional toggle; when on, reveals a free-text display-name field.
- Submit disabled until recipient + content + ≥1 hashtag are all valid; Cancel always discards, no confirm.

## Architecture

```
<KudosModal open onClose>
  <RecipientField />          -- autocomplete, searchProfiles()
  <KudosEditorToolbar />      -- Tiptap toolbar buttons
  <KudosEditor />             -- Tiptap EditorContent + mention suggestion popover
  <HashtagField>
    chips + "+ Hashtag" -> <HashtagPicker> (Phase 3, in a popover)
  </HashtagField>
  <ImageField />              -- thumbnail grid + file input, uses uploadKudosImages() on submit
  <AnonymousToggle />         -- checkbox + conditional name input
  <ModalFooter>Cancel | Submit</ModalFooter>
</KudosModal>

submit handler:
  1. validate (already gated by disabled state, but re-check defensively)
  2. uploadKudosImages(files) -> imagePaths[]
  3. createKudos({ ...formState, imagePaths })
  4. close modal, reset form
```

## Related Code Files

**Create:**
- `components/kudos/kudos-modal.tsx` — top-level modal shell + form state orchestration
- `components/kudos/recipient-field.tsx` — recipient autocomplete
- `components/kudos/kudos-editor.tsx` — Tiptap editor + toolbar + mention extension config
- `components/kudos/hashtag-field.tsx` — chip list + picker trigger (wraps Phase 3's `<HashtagPicker>`)
- `components/kudos/image-field.tsx` — thumbnail grid + file picker + client-side validation
- `components/kudos/anonymous-toggle.tsx` — checkbox + conditional name field
- `lib/kudos/use-kudos-form.ts` — form-state hook (recipient, content, hashtagIds, files, anonymous
  state) + the derived `canSubmit` boolean — keeps `kudos-modal.tsx` under 200 lines

**Modify:**
- `messages/en.json`, `messages/vi.json` — add `"KudosModal"` namespace with all static copy
  (placeholders, button labels, error messages) — copy sourced verbatim from the MoMorph spec text
  quoted in `spec/send-kudos/technical-spec.md` / the original MoMorph screen data, translated to
  English for `en.json` and kept as the original Vietnamese for `vi.json`.
- `package.json` — add the 4 Tiptap packages (Step 1 below)

## Implementation Steps

1. Install dependencies and verify the build still compiles:
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention
   npm run build
   ```
   If `npm run build` fails on a peer-dependency conflict with React 19, check Tiptap's changelog
   for the minimum version with React 19 support and pin explicitly rather than forcing with
   `--legacy-peer-deps` (a forced install can hide a real runtime incompatibility).

2. Build `use-kudos-form.ts` — single source of truth for form state:
   ```ts
   export function useKudosForm() {
     const [recipient, setRecipient] = useState<Profile | null>(null);
     const [content, setContent] = useState("");       // Tiptap HTML output
     const [hashtagIds, setHashtagIds] = useState<number[]>([]);
     const [images, setImages] = useState<File[]>([]);
     const [isAnonymous, setIsAnonymous] = useState(false);
     const [anonymousName, setAnonymousName] = useState("");
     const [mentionedIds, setMentionedIds] = useState<string[]>([]);

     const canSubmit =
       recipient !== null &&
       content.trim().length > 0 &&
       hashtagIds.length >= 1 &&
       hashtagIds.length <= 5;

     // ...setters, reset(), and a toFormInput() mapper to CreateKudosInput
     return { recipient, setRecipient, content, setContent, hashtagIds, setHashtagIds,
       images, setImages, isAnonymous, setIsAnonymous, anonymousName, setAnonymousName,
       mentionedIds, setMentionedIds, canSubmit, reset };
   }
   ```

3. Build `kudos-editor.tsx` with Tiptap:
   - `useEditor({ extensions: [StarterKit, Link, Mention.configure({ suggestion: { items: (query) => searchProfiles(query), render: ... } })] })`.
   - Toolbar buttons call `editor.chain().focus().toggleBold().run()` etc. (Tiptap's standard
     command-chaining API — no custom contentEditable logic needed since Tiptap owns the DOM).
   - On every update (`onUpdate`), call `setContent(editor.getHTML())` and separately track
     mentioned profile ids by inspecting the editor's mention nodes (Tiptap mention nodes carry
     the selected id as a node attribute — walk `editor.getJSON()` on submit to collect them,
     rather than maintaining a second parallel list during typing).

4. Build `recipient-field.tsx`:
   - Debounced (~250ms) call to `searchProfiles` as the user types; render results in a listbox;
     selecting sets `recipient` and closes the list.
   - Show the red-border + error state (per spec) only after a submit attempt with `recipient === null`
     — not on every keystroke (matches the described UX: error appears on submit, not eagerly).

5. Build `hashtag-field.tsx`:
   - Renders chips for each selected hashtag (name looked up from the already-fetched hashtag list)
     with an "x" remove button.
   - "+ Hashtag" opens a popover containing Phase 3's `<HashtagPicker selectedIds={hashtagIds}
     onToggle={...} maxSelected={5} />`.

6. Build `image-field.tsx`:
   - `<input type="file" accept="image/jpeg,image/png" multiple>` (hidden, triggered by the
     "+ Image" button); on selection, validate each new file with `isValidKudosImage` before adding
     to state; show a rejection message for invalid files (do not silently drop them).
   - Thumbnail grid via `URL.createObjectURL(file)` for preview (revoke on remove/unmount to avoid
     leaking blob URLs).
   - Hide "+ Image" once `images.length >= MAX_KUDOS_IMAGES`.

7. Build `anonymous-toggle.tsx` — checkbox + conditional text input, matching spec defaults (off).

8. Build `kudos-modal.tsx` — compose the above, wire the submit handler:
   ```ts
   async function handleSubmit() {
     if (!form.canSubmit) return;
     setSubmitting(true);
     try {
       const imagePaths = form.images.length > 0 ? await uploadKudosImages(form.images) : [];
       await createKudos({
         recipientId: form.recipient!.id,
         content: form.content,
         isAnonymous: form.isAnonymous,
         anonymousDisplayName: form.isAnonymous ? form.anonymousName : null,
         hashtagIds: form.hashtagIds,
         imagePaths,
         mentionedProfileIds: form.mentionedIds,
       });
       form.reset();
       onClose();
     } catch (err) {
       setSubmitError(err instanceof Error ? err.message : "Failed to send kudos");
     } finally {
       setSubmitting(false);
     }
   }
   ```
   Submit button: `disabled={!form.canSubmit || submitting}`; show a loading indicator while
   `submitting` per spec ("hiển thị loading").

9. Wire i18n: replace every hardcoded Vietnamese string quoted in the spec/MoMorph data with
   `t("KudosModal.xxx")` calls via `useTranslations("KudosModal")`, adding matching keys to both
   `messages/en.json` and `messages/vi.json`.

10. Manual visual QA: open the modal in the browser (`npm run dev`), compare against the MoMorph
    screenshot for `ihQ26W78P2`, and walk through the representative test-case scenarios from
    `spec/send-kudos/edge-cases.md` (empty-field errors, 6th hashtag block, 6th image block, invalid
    file type, anonymous toggle, cancel-discards).

## Todo List

- [x] Tiptap installed, `npm run build` green
- [x] `use-kudos-form.ts` — single derived `canSubmit`, no duplicated validation logic elsewhere
- [x] Recipient autocomplete — debounced, error only after submit attempt
- [x] Tiptap editor — toolbar (Bold/Italic/Strike/OrderedList/Link/Quote) + mention suggestions
- [x] Hashtag field — chips + picker popover, respects 1-5
- [x] Image field — validated upload, thumbnail grid, hides at 5, per-image remove revokes blob URL
- [x] Anonymous toggle — default off, conditional name field
- [x] Submit — disabled until valid, loading state, closes + resets on success
- [x] Cancel — discards immediately, no confirmation dialog
- [x] All static copy in `messages/en.json` + `messages/vi.json`, no hardcoded strings in components
- [x] Manual visual QA against MoMorph screenshot done

## Success Criteria

- [x] Every acceptance criterion in US001-US005 (`spec/send-kudos/technical-spec.md`) is manually verified working
- [x] Every row in `spec/send-kudos/edge-cases.md` reproduces the expected result in the running app
- [x] `npm run lint` and `npm run build` both pass with zero new errors
- [x] No `any` types introduced

## Risk Assessment

- **Tiptap + React 19 compatibility**: highest technical risk in this plan — verify early (Step 1)
  before building the rest of the modal around it; if incompatible, fall back to the "custom,
  no-new-deps" approach from the clarification options (contentEditable + `document.execCommand`)
  and flag the scope/timeline change to the user immediately rather than discovering it mid-phase.
- **Mention-node id extraction**: Tiptap's mention extension API varies by version for reading
  selected node attributes — confirm the exact attribute name (`id` vs `label`) against the
  installed version's docs (`tkm:search-docs` for `@tiptap/extension-mention`) rather than guessing.
- **Blob URL leaks**: forgetting to `URL.revokeObjectURL` on image removal/unmount leaks memory
  during a long-lived SPA session — cover with a `useEffect` cleanup.

## Security Considerations

- Tiptap's HTML output is rendered back to other users eventually (feed, if built later) — even
  though not in this phase's scope, do NOT skip Tiptap's built-in sanitization defaults; do not
  disable any HTML-escaping/sanitization extension defaults for convenience.
- Never trust `canSubmit` alone as a security boundary — the Phase 1 RPC re-validates hashtag
  cardinality/validity server-side regardless of what the UI allowed through.

## Next Steps

- Phase 5 wires a trigger button on `/kudos` that mounts `<KudosModal>`.
