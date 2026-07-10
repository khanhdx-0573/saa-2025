# Independent audit: Send Kudos + Login features

Scope: all 28 files listed (components/kudos, lib/kudos, app/kudos, components/auth, app/login, app/auth). Read-only audit, no edits made.

## Findings

1. **CONFIRMED (agrees with prior hand-trace).** `lib/kudos/use-kudos-form.ts:25-26,52,80,109-110` — `mentionedIds`/`setMentionedIds` is state that's written internally, exposed on `KudosFormState`, and threaded into `toCreateKudosInput()`'s `mentionedProfileIds`, but `setMentionedIds` has zero call sites outside the hook (verified via grep across `app/`, `lib/`, `components/`). `components/kudos/kudos-modal.tsx:88-89` always recomputes and overrides `mentionedProfileIds` from `editorRef.current?.getMentionedIds()` right before calling `createKudos`. Dead field. `lib/kudos/use-kudos-form.test.ts:310,325` references `setMentionedIds`/`mentionedIds` in the "should reset all form state to initial values" test and would need updating if removed.

2. **CONFIRMED via trace — duplicated constant, same shape of risk as finding #1 (unsynced parallel state, just constants instead of hook state).** The max-hashtags rule (`5`) is defined independently in two places instead of being centralized alongside the feature's other tunables in `lib/kudos/validation.ts` (which already owns `MAX_KUDOS_IMAGES`, `MAX_KUDOS_TITLE_CHARS`, `MAX_KUDOS_CONTENT_CHARS`, `MAX_LINK_TEXT_CHARS`, `MAX_LINK_URL_CHARS`):
   - `lib/kudos/use-kudos-form.ts:7` — `const MAX_HASHTAGS = 5` (drives `canSubmit`)
   - `components/kudos/hashtag-field.tsx:9` — `const MAX_HASHTAGS = 5` (drives the picker's disabled state + "max reached" hint)
   These two never actually diverge today, but nothing enforces that — a future change to one without the other silently breaks either submit-gating or the UI's max-reached affordance. Not currently a live bug, but it's the same "two writers of one fact, one hidden" smell as finding #1. Recommend moving to `lib/kudos/validation.ts` as `MAX_KUDOS_HASHTAGS`/`MIN_KUDOS_HASHTAGS`.

3. **Suspected, low severity.** `lib/kudos/use-kudos-form.ts:9` — `export type KudosFormState` is exported but never imported anywhere else in the codebase (grep across the repo, excluding the declaring file, returns zero hits). It's still doing useful work as the hook's explicit return-type annotation, so it's not truly dead, just an export nobody consumes. Not worth flagging as a bug, only as an unused export if you're pruning the public surface.

4. **Suspected, trivial.** `lib/kudos/validation.ts:6` — `MIN_LINK_URL_CHARS` is exported but only ever consumed inside the same file (`isValidLinkUrl`); no other file imports it, and `validation.test.ts` only imports `MAX_LINK_URL_CHARS`. Harmless, but could be un-exported (or a boundary test added) since it's part of a validated business rule.

## Explicitly checked, found clean

- **Traced every other writer/reader pair for the mentionedIds shape** (state set but shadowed before use): `recipient`/`setRecipient`, `title`/`setTitle`, `content`/`isContentEmpty`/`setContent`, `hashtagIds`/`setHashtagIds`, `images`/`setImages`, `isAnonymous`/`setIsAnonymous`, `anonymousName`/`setAnonymousName` — all flow straight from `useKudosForm` state through to `toCreateKudosInput()` and into `createKudos()` with no shadowing. No second instance of the mentionedIds bug found.
- **kudos-icons.tsx**: all 12 exported icons (`BoldIcon`, `ItalicIcon`, `StrikeIcon`, `ListIcon`, `LinkIcon`, `QuoteIcon`, `CloseIcon`, `CloseTinyIcon`, `SendIcon`, `PlusIcon`, `DownIcon`, `PersonIcon`, `CheckIcon`) are imported and rendered somewhere — none orphaned. Module usage is confined entirely to `components/kudos/`, so its location is correct (not a misplaced shared-UI candidate).
- **Directory structure**: no file among the 28 looks misplaced. `hashtag-picker.tsx`/`hashtag-picker-row.tsx` are generic-looking list/row components but both are coupled to the `Hashtag` type and kudos-specific selection semantics (max-N disable rule), so kudos/ is the right home, not components/ui/.
- **Comments**: scanned every comment/doc-block in all 28 files. All are WHY-style (design constraint, spec reference, race/lifecycle rationale, lint-suppression justification) — e.g. `kudos-editor.tsx:13-14` (ProseMirror `inclusive` behavior), `kudos-editor.tsx:56-58` (truncate-by-position vs `undo()`), `kudos-editor-link-dialog.tsx:33-34` (SSR/portal hydration), `kudos-editor-link-dialog.tsx:78-80` (portal needed because outer dialog is inert), `hashtag-picker-row.tsx:36` (fixed slot to avoid layout shift), `validation.ts:15` (spec reference). No "just restates the line below it" comments found (e.g. no `// sets the title` above `setTitle(...)`). The one borderline case, `use-kudos-form.test.ts:178` (`// isContentEmpty = true` next to a bare boolean literal argument), is annotating an ambiguous positional arg rather than restating adjacent code — judged acceptable, not a violation.
- No leftover artifacts found beyond findings #2-4 above (no orphaned helper functions, no now-redundant post-refactor code).

## Unresolved questions
- None blocking. Findings #3/#4 are optional cleanup, not correctness bugs — your call whether they're worth touching.

**Status:** DONE
**Summary:** Confirmed the mentionedIds dead-state bug as described. Found one additional same-shape-of-risk issue (duplicated MAX_HASHTAGS constant in two files, not yet actually diverged) plus two trivial unused-export notes. No misplaced files, no restating-comment violations found across all 28 files.
