## Code Review Summary

### Scope
- Files: `components/kudos/kudos-modal.tsx`, `app/globals.css`, `messages/en.json`, `messages/vi.json`, `e2e/kudos.spec.ts`
- LOC: ~90 changed (mostly additive i18n/token entries)
- Focus: bug fix — Submit button always clickable + validation banner on incomplete submit

### Overall Assessment
Solid, focused fix. Type-check (`tsc --noEmit`) and lint both clean on the changed files. i18n keys are consistent and valid JSON in both locales. The Tailwind translation of the Figma spec is accurate. One real logic bug found (message doesn't reflect actual required-field set) and one state-staleness bug (banner doesn't clear when the user fixes the form) — both worth fixing before merge.

### Critical Issues
None.

### High Priority

1. **Validation message is incomplete relative to `canSubmit`'s real conditions** (`lib/kudos/use-kudos-form.ts:79-85`, `components/kudos/kudos-modal.tsx:82`, `messages/vi.json`/`en.json` `submitValidationError`).
   `canSubmit` requires **recipient, title (`Danh hiệu`), content, hashtags**, and conditionally `anonymousName` when `isAnonymous`. The banner text only lists "Người nhận, Lời nhắn gửi và Hashtag" — Title (which has its own required asterisk + inline error in `title-field.tsx`) and the conditional anonymous-name are silently omitted from the copy.
   Concretely: a user fills Recipient + Content + Hashtag but leaves Title blank → `canSubmit` is `false`, clicking Submit shows "Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag..." even though all three named fields are already filled, and never mentions the actual missing field (Title). Confusing/misleading.
   If this exact copy is mandated verbatim by the Figma reference (662:13035), it's a design-fidelity/product decision that should be flagged back to the design/PM rather than silently shipped as-is — the code review can't reconcile the mismatch on its own. Otherwise, either fix `canSubmit`/message to align, or generalize the copy (e.g. "vui lòng điền đủ các trường bắt buộc") so it can't misstate which field is missing.

2. **Stale validation banner: doesn't clear as the user fixes the form.** (`components/kudos/kudos-modal.tsx:79-84`)
   `submitError` is only cleared in the `canSubmit === true` branch of the *next* submit attempt (line 86) or on dialog close (line 48). It is never recomputed as a derived value. Contrast with the inline per-field errors (`title-field.tsx:53`, `recipient-field.tsx:147`, etc.) which are computed live from `showValidationErrors && field-is-empty` and correctly disappear the instant the user fixes that field.
   Repro: submit empty → banner appears + inline errors appear → user fills every field → inline errors correctly vanish → but the red banner ("Bạn cần điền đủ...") stays on screen, now describing a state that's no longer true, until the user clicks Submit again. Recommend deriving the banner's *visibility* from `showValidationErrors && !form.canSubmit` (i.e., don't store the "validation failed" case in `submitError` state at all — only store true async submission failures there) rather than snapshotting the string once.

### Medium Priority

3. **Reusing one `submitError` slot for two conceptually different things works today but is fragile.** They can't be simultaneously true (early-return short-circuits before the try/catch), so there's no live race — but item #2 above is a direct symptom of conflating "static client-side validation state" (which should be derived/reactive) with "one-shot async error message" (which is legitimately imperative/stateful). Splitting them (`validationError = showValidationErrors && !form.canSubmit ? t(...) : null` computed each render, kept separate from `submitError` for the try/catch) would fix #2 for free and make the two concerns independently reasonable about.

4. **No `role="alert"`/`aria-live` on the new banner.** (`kudos-modal.tsx:138-142`) A screen-reader user who clicks Submit won't be notified that an error appeared unless they happen to navigate onto it — this is the top-level submit-blocking message, more important to announce than the existing inline per-field errors (which have the same gap, but are secondary). Suggest `role="alert"` on the `<p>`.

### Low Priority

5. `leading-6` is redundant alongside `text-base` (Tailwind's default `text-base` line-height is already 1.5rem/24px) — harmless, just belt-and-suspenders; not worth changing.
6. `--details-error` (`#b3261e` → `#d4271d`) is a shared token consumed by ~8 other call sites (`border-details-error` / `text-details-error` in `title-field.tsx`, `recipient-field.tsx`, `anonymous-toggle.tsx`, `kudos-editor-link-dialog.tsx`, `image-field.tsx`). Confirmed this is the correct, intentional fix (matches the Figma value given, and the pre-existing `--details-remove-button: #d4271d` token already used the same red) — no visual clash with the new banner since the per-field texts are small red-on-cream (bg-details-modal-background `#fff8e1`) inline hints, while the new banner is bold white-on-solid-red — different presentational context, same semantic color. No action needed, flagging only so it's visible that the blast radius was checked.

### Edge Cases Found
- Double-submit race: button is `disabled={submitting}` only, and `setSubmitting(true)` is synchronous before the first `await`; in practice a second click can't land before React disables the button. Not a regression introduced by this change (pre-existing pattern) and not exploitable in normal UI interaction.
- Item #1 above (title/anonymousName omitted from copy) is the main functional edge case worth resolving.

### Positive Observations
- `disabled={submitting}` simplification is correct and matches the stated intent (always clickable, only disabled mid-flight).
- `setShowValidationErrors(true)` alongside the banner correctly re-triggers all the inline per-field errors simultaneously — good, consistent UX.
- Tailwind translation of the given CSS spec is accurate: `font-montserrat` + `font-bold` (700), `text-base` (16px) + `leading-6` (24px), `tracking-[0.15px]`, `text-center`, `bg-details-error` (`#d4271d`) + `text-details-text-secondary-1` (`#ffffff`) for white-on-red. Nothing missing or wrong.
- i18n: both `en.json`/`vi.json` add `KudosModal.submitValidationError` in the same nested location; JSON parses cleanly in both files; translations are semantically equivalent.
- e2e test correctly proves the fix: clicks Submit on an empty form, asserts the exact banner text is visible, and asserts the dialog `is still visible` (didn't close/submit). Low flakiness risk — no arbitrary waits, uses role-based locators consistent with the existing suite's pattern, and the empty-form path has no async work before the state update, so no race window.
- `tsc --noEmit` and `npm run lint` are clean on all five changed files (no new errors/warnings introduced).

### Recommended Actions
1. Resolve the message/logic mismatch (#1) — either fix copy to be generic, extend it to cover Title/anonymous name, or confirm with design that literal Figma copy is intentional and file the gap as a known limitation.
2. Fix the stale-banner bug (#2) by deriving the validation-failure display reactively instead of storing it as one-shot state (also resolves #3).
3. Add `role="alert"` to the new banner (#4).

### Metrics
- Type Coverage: `tsc --noEmit` passes, 0 errors
- Test Coverage: not measured (no coverage run requested); new e2e test added, existing unit tests untouched by this change
- Linting Issues: 0 in changed files (833 pre-existing issues in unrelated `.claude/` tooling scripts, not part of this diff)

### Unresolved Questions
- Is the exact validation banner copy ("Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag...") mandated verbatim by the Figma reference regardless of which fields are actually missing, or should it reflect the true required-field set (which also includes Title and conditionally the anonymous display name)? This determines whether Finding #1 is a bug to fix in code or a spec gap to raise with design/PM.

**Status:** DONE_WITH_CONCERNS
**Summary:** Fix works as intended (button clickable, banner shows Figma-accurate styling, e2e proves it), type-check/lint clean, i18n consistent. Two correctness issues found: validation message omits Title/anonymous-name from the required-field list it claims, and the banner doesn't clear when the user subsequently fixes the form (stale until next submit click).
**Concerns/Blockers:** Findings #1 and #2 above are correctness bugs, not style nits — recommend addressing before merge.
