---
status: implemented
authored_by: takumi
fcode: F001
created: 2026-07-09
lang: en
---

# F001_SendKudos

## Overview

Send Kudos lets an authenticated employee ("Sunner") send a short thank-you/recognition note to one colleague, tagged with 1-5 hashtags drawn from a managed list of company values (e.g. "BE PROFESSIONAL", "GO FAST"). The sender can attach up to 5 images, mention other colleagues inline via "@name", and optionally send the note anonymously. The feature's purpose is to drive peer-to-peer recognition and reinforce the company's core-value hashtags.

## Polymorphic Behavior

None — single form-submit flow (compose modal → validate → submit), no per-role or per-type variants. The same "Viết Kudo" modal and validation rules apply to every authenticated user regardless of role.

## Cross-Cutting Logic
### Requirements

- The system must require an authenticated session to open the "Viết Kudo" modal; an unauthenticated user attempting to access `/kudos` or the compose action must be redirected to login.
- The system must let the sender select exactly one recipient via a search/autocomplete field over the Sunners directory (profiles), and must block submit while no recipient is selected.
- The system must let the sender enter a "Danh hiệu" (title) as a required single-line text field, and must block submit while the title is empty.
- The system must let the sender compose rich-text content (bold, italic, strikethrough, ordered list, link, quote) and must block submit while content is empty.
- The system must let the sender type "@" followed by characters to search and insert an inline mention of another Sunner from the profiles directory.
- The system must let the sender select 1 to 5 hashtags from the predefined/managed hashtag list via the hashtag picker; free-text hashtag creation is not permitted; the system must block adding a 6th hashtag and must block submit while zero hashtags are selected.
- The system must let the sender optionally attach 0 to 5 images of type image/jpeg or image/png, each at most 5MB; the system must reject any other file type or oversized file with a visible error and must hide the "+ Image" control once 5 images are attached.
- The system must let the sender optionally toggle "send anonymously"; when enabled, the system must reveal a free-text anonymous display-name field and must NOT persist the real sender's identity anywhere in the resulting record.
- The system must keep the Submit action clickable at all times (it only disables while a submit request is in flight); clicking it while recipient, title, content, or hashtag-count (>=1) is not yet valid must show a validation-summary banner and must not submit, and clicking it once all four are valid must persist the kudos.
- The system must let the sender Cancel at any time, discarding all composed data and closing the modal without a confirmation step.

### Business Rules

- Recipient cardinality is exactly one per kudos (no multi-recipient sends).
- Hashtag count per kudos: minimum 1, maximum 5; selectable only from the managed `hashtags` list.
- Image count per kudos: 0 to 5; accepted types are image/jpeg and image/png only; 5MB max per file.
- When `is_anonymous` is true, the real sender identity must never be written to the kudos row (no sender reference persisted) — this is an intentional trade-off: anonymous kudos carry no abuse-tracing capability, by explicit product decision.

### Decision Logic

- Submit button state: always clickable except while a submit request is in flight (loading state). Clicking triggers validation; if (recipient selected) AND (title non-empty) AND (content non-empty) AND (hashtag count between 1 and 5) all hold, the kudos is submitted — otherwise a validation-summary banner is shown and no submission occurs.
- Anonymous field visibility: the anonymous display-name text field is shown only when the "send anonymously" toggle is on; hidden and cleared when off (toggle defaults to off).
- Hashtag row disable logic (picker dropdown): once 5 hashtags are selected, every currently-unselected row becomes non-interactive until the sender deselects one.

### State Machines

TBD (draft) — this is a single-step compose-and-submit form, not a multi-step wizard; no state machine is needed beyond the submit-button enable/disable decision logic above.

### Algorithms

- @mention suggestion matching: as the sender types after "@", substring-match the typed text against `profiles.full_name` (case-insensitive) and present the top matches in a suggestion list; selecting one inserts the mention inline.
- Recipient/hashtag search matching: substring-match typed text against `profiles.full_name` (recipient) or against the seeded `hashtags.name` list (hashtag picker filters by selection state, not by text search per the design).

### External Integrations

- Supabase Auth (existing) — gates modal access to authenticated sessions.
- Supabase Postgres (existing) — stores kudos, hashtags, join, and mention rows; `profiles` table auto-synced from `auth.users` via trigger.
- Supabase Storage (new) — public bucket `kudos-images` for uploaded attachment files; upload requires an authenticated session.

### Verification

Success is confirmed when: a `kudos` row exists with the composed title, content, correct `recipient_id`, and correct `is_anonymous`/`anonymous_display_name` state; matching `kudos_hashtags` join rows exist for each selected hashtag (1-5); any uploaded images exist as objects in the `kudos-images` bucket with corresponding `kudos_images` rows; any @mentions are best-effort recorded in `kudos_mentions`; and for anonymous kudos, no row anywhere resolves back to the real sender's `auth.users`/`profiles` id.

**Client behavior:** see behavior-logic.md, permissions.md, screen-flow.md

## User Stories

### US001 — Compose and submit a kudos to one recipient

**As a** authenticated Sunner
**I want** to write a thank-you note to one colleague and submit it
**So that** I can recognize their contribution

**Acceptance Criteria**
- Opening the modal while unauthenticated redirects to login; while authenticated, the modal opens.
- Submit is clickable while recipient is empty, but clicking it shows a validation-summary banner and does not submit; selecting a recipient from the autocomplete dropdown populates the field, and the banner clears on the next submit attempt once all fields are valid.
- Submit is clickable while the "Danh hiệu" (title) field is empty, but clicking it shows the validation-summary banner instead of submitting; no per-field error indicator appears on the title field itself.
- Submit is clickable while content is empty, but clicking it shows the validation-summary banner instead of submitting; no per-field error indicator appears on the content field itself.
- Cancel discards all composed data and closes the modal immediately, no confirmation.
- With recipient, title, content, and >=1 hashtag valid, clicking Submit shows a loading state and closes the modal on success (no validation banner appears).
- Attempting to submit with recipient, title, content, and hashtags all empty shows only the single validation-summary banner (e.g. "Bạn cần điền đủ Người nhận, Danh hiệu, Lời nhắn gửi và Hashtag để gửi Kudos!"); no per-field borders or error text appear on any field; the button remains clickable throughout.

**Requirements fulfilled:** auth gate; recipient selection; title requirement; content requirement; submit validation gating; cancel/discard.

### US002 — Select 1-5 hashtags from the managed dropdown

**As a** authenticated Sunner
**I want** to tag my kudos with 1 to 5 predefined hashtags
**So that** the recognition maps to a company core value

**Acceptance Criteria**
- The "+ Hashtag" button opens a dropdown listing hashtags sourced dynamically from the database (e.g. High-performing, BE PROFESSIONAL, BE OPTIMISTIC, Be A Team, THINK OUTSIDE THE BOX, GET RISKY, GO FAST, WASSHOI).
- Clicking a row toggles its selection; selected rows show a check icon and darker background.
- Selected hashtags render as removable chips in the form; clicking "x" on a chip removes only that tag.
- Selecting a 6th hashtag is blocked with a "Tối đa 5 hashtag" message; at 5 selected, unselected rows in the dropdown become non-clickable.
- Submitting with 0 hashtags shows the validation-summary banner (no per-field hashtag error) and blocks submit.

**Requirements fulfilled:** hashtag selection (1-5, managed list only), submit validation gating.

### US003 — Attach up to 5 images with type/size validation

**As a** authenticated Sunner
**I want** to attach photos to my kudos
**So that** the recognition can include visual context

**Acceptance Criteria**
- "+ Image" opens a file picker; selecting a valid .jpg/.png file under 5MB adds a thumbnail with an "x" to remove it.
- Selecting a file over 5MB or of an unsupported type (e.g. .pdf, .mp4, .txt) is rejected with a visible error; no thumbnail is added.
- After 5 images are attached, the "+ Image" button hides; removing an image via "x" restores the button.
- Images are optional — submitting with 0 images is valid provided other required fields are satisfied.

**Requirements fulfilled:** image upload (0-5, jpg/png, 5MB cap).

### US004 — Send anonymously with a custom display name

**As a** authenticated Sunner
**I want** to send a kudos without revealing my identity
**So that** I can give recognition without concern for social visibility

**Acceptance Criteria**
- The "Gửi lời cám ơn và ghi nhận ẩn danh" toggle defaults to off.
- Turning the toggle on reveals a free-text field for a custom anonymous display name; turning it off hides the field again.
- On submit with the toggle on, the resulting kudos row does not persist the real sender's identity anywhere (no recoverable sender reference).

**Requirements fulfilled:** anonymous toggle (no identity persisted when active).

### US005 — Format content and mention a colleague inline

**As a** authenticated Sunner
**I want** to format my note and @mention a colleague within it
**So that** the note reads clearly and can credit others involved

**Acceptance Criteria**
- The formatting toolbar (Bold, Italic, Strikethrough, Numbered list, Link, Quote) applies the selected style to the current text selection.
- The Link tool opens a URL-input dialog before inserting a link.
- Typing "@" followed by characters opens a suggestion list of matching Sunners; selecting one inserts the mention inline in the content.
- Helper text below the content field explains the @mention feature.

**Requirements fulfilled:** rich-text content with @mention.

### Edge Cases

See edge-cases.md.

## Key Entities

- **profiles** — mirror of `auth.users`, auto-populated/kept in sync via a Postgres trigger on insert/update: `id` (uuid, PK, = auth.users.id), `full_name`, `avatar_url`, `email`. Serves as the searchable "Sunners" directory for recipient autocomplete and @mention search.
- **hashtags** — the managed/predefined tag list: `id`, `name`, `is_active`. Seeded with the values visible in the design (High-performing, BE PROFESSIONAL, BE OPTIMISTIC, Be A Team, THINK OUTSIDE THE BOX, GET RISKY, GO FAST, WASSHOI). No free-text creation from the client.
- **kudos** — one row per sent note: `id`, `sender_id` (uuid, FK → profiles, NULLABLE), `recipient_id` (uuid, FK → profiles, NOT NULL, exactly one recipient), `title` (text, NOT NULL — the "Danh hiệu" headline dedicated to the recipient), `content` (rich text/HTML), `is_anonymous` (boolean), `anonymous_display_name` (text, nullable), `created_at`. Anonymous trade-off: when `is_anonymous = true`, `sender_id` MUST be NULL at write time (the application must not populate it, and this should be enforced by an insert policy/check) — there is intentionally no way to recover the real sender afterward.
- **kudos_hashtags** — join table linking a kudos to 1-5 hashtags: `kudos_id` (FK), `hashtag_id` (FK), composite PK.
- **kudos_images** — one row per attached image: `id`, `kudos_id` (FK), `storage_path` (points into the `kudos-images` bucket), `position`.
- **kudos_mentions** — best-effort record of inline @mentions parsed from content: `id`, `kudos_id` (FK), `mentioned_profile_id` (FK, nullable), optional and non-blocking if parsing misses a mention.

## Artifact References

Registered in `docs/generated/feature-list.md` as F001 (status: implemented).

## Assumptions

- "Sunners" means all authenticated users of the app (the whole employee directory via `profiles`); no per-tenant/org/department scoping is assumed for recipient or mention search.
- Every authenticated user may both send and receive kudos; no role restriction is assumed.
- Vietnamese is the primary UI locale for this feature (per the MoMorph design copy); this spec is authored in English per project convention, with UI strings implemented via the project's existing i18n setup if one exists.
- The hashtag list is company-wide and shared across all users (not per-team or per-user customizable) — it is "seeded/managed", implying an admin-side management path exists or will exist outside this feature's scope.
- Rich-text `content` is stored as sanitized HTML (or an equivalent serializable rich-text format); rendering assumes the storage format is safe to render without further sanitization at render time — actual sanitization strategy is an implementation detail for the build phase.

## Source Code References

- Migrations: `supabase/migrations/20260709120842_profiles.sql`, `20260709120843_hashtags.sql`, `20260709120844_kudos.sql`, `20260709120845_kudos_rpc.sql` (`create_kudos` RPC), `20260709120846_storage_kudos_images.sql`.
- Data layer: `lib/kudos/types.ts`, `lib/kudos/validation.ts`, `lib/kudos/queries.ts`, `lib/kudos/mutations.ts`, `lib/kudos/use-kudos-form.ts`.
- UI: `components/kudos/kudos-modal.tsx`, `kudos-editor.tsx`, `kudos-editor-link-input.tsx`, `recipient-field.tsx`, `title-field.tsx`, `mention-suggestion.tsx`, `hashtag-field.tsx`, `hashtag-picker.tsx`, `hashtag-picker-row.tsx`, `image-field.tsx`, `anonymous-toggle.tsx`, `kudos-page-client.tsx`.
- Entry route: `app/kudos/page.tsx`.
- Tests: `lib/kudos/validation.test.ts`, `lib/kudos/use-kudos-form.test.ts`.

## Unresolved Questions

None — see locked decisions above.
