<!-- layout-exempt: rebuild-spec CHANGELOG — historical version notes; every docs/system|features|generated|flows path here is this skill's own output target, not a consumer assumption -->

# tkm:rebuild-spec — Changelog

Version history for the `rebuild-spec` skill. Current behavior is documented in `SKILL.md`;
this file holds the migration notes and breaking-change rationale for past versions. The most
recent sessions are also captured in `docs/journals/`.

---

## v25.1.2 — cap clamps + env hygiene (PR-review fixes, patch)

Four findings from the PR #169 external review (APPROVE-with-comments). Orchestration-prose only.

- **W8-family clamp (Medium).** W8/FS.6/FL.4 fix-cycle wave width used `REBUILD_W8_MAX_PARALLEL`
  raw — setting it to 10 exceeded the cap the invariant text promised ("every pass … fix cycles").
  Effective width is now `min(REBUILD_W8_MAX_PARALLEL, REBUILD_MAX_PARALLEL)`; AC.1's
  `REBUILD_SHARD_MAX_PARALLEL` gets the same clamp.
- **Env hygiene (Minor).** `parseInt(env ?? '5')` let junk/`0`/negative envs produce NaN/0 wave
  widths — `idx % NaN` never fires, silently disabling wave rotation (unbounded fan-out). All cap
  env parses now guard: `Math.max(1, parseInt(env ?? '5') || 5)` (junk/0 → default 5; negative →
  clamped to 1 — either way never cap-off). Includes TR.2's `BATCH_SIZE`/`MAX_AGENTS`.
- **Translate derivation rule (Minor).** `langs × agents ≤ 5` was a bare constraint statement; the
  orchestrator now DERIVES `effectiveLangs = max(1, min(TRANSLATE_MAX_PARALLEL, floor(REBUILD_MAX_PARALLEL / TRANSLATE_MAX_AGENTS)))`
  instead of trusting the env pair.
- **Wave-1 headroom warning (Low).** Legacy profiles sit at exactly 5/5 — a maintenance comment at
  Wave1.c now forbids adding a new sibling on `scoutTaskId` (chain new Wave-1 artifacts instead).

## v25.1.1 — global-cap hardening (review fixes for v25.1.0, patch)

Four defects surfaced by a review of v25.1.0 before merge. Orchestration-prose only — no
artifact format change, no migration.

- **Core Wave-1 overflow (Important).** On legacy profiles producing crud-matrix + db-objects,
  SIX Wave-1 tasks were blocked on `scoutTaskId` — exceeding the cap the release declares.
  Wave1.c db-objects is now chained behind Wave1.b crud-matrix
  (`addBlockedBy: [crudMatrixTaskId ?? scoutTaskId]`); the core-pass antichain stays ≤5.
- **Three shard fan-outs missed the SEQUENTIAL wording (Important).** The v25.1.0 inline edits
  covered data-model / route-list / user-stories / feature-list but NOT screen-list+flow /
  behavior-logic / api-map — while this changelog claimed the inverse list. All seven inline
  shard task descriptions now carry "SEQUENTIAL BATCHES … batch i+1 only after ALL of batch i";
  the v25.1.0 entry below is corrected.
- **`REBUILD_MAX_PARALLEL` was a phantom env (Minor).** Documented as an env but read nowhere.
  The wave-rotation pseudocode now reads it (FS.1/FS.5/SS.1/SS.2, aggregate).
- **Wave width conflated with batch size (Minor).** FS.5/SS.1/SS.2 rotated waves on their
  batch-size envs — raising a batch size (workload knob) silently widened concurrency past 5.
  Wave width is now `min(<batch env>, REBUILD_MAX_PARALLEL)` in FS.1 and plain
  `REBUILD_MAX_PARALLEL` for FS.5/SS.1/SS.2 reviewer/batch waves; the aggregate
  system-researcher waves use `REBUILD_MAX_PARALLEL` instead of borrowing
  `REBUILD_W8_MAX_PARALLEL`.

## v25.1.0 — global 5-subagent parallel cap (bounded-wave dispatch)

Field evidence: `--feature-specs` on a 12-feature repo spawned 12 concurrent async researchers —
the FS.1 rule "≤20 F### → flat fan-out" only activated the batch cap above 20 features, and five
other fan-outs had the same shape (batched on paper, unchained in dispatch). New invariant:
**never more than 5 subagents runnable at once, anywhere in the flow** (`REBUILD_MAX_PARALLEL=5`,
SKILL.md § GLOBAL PARALLEL CAP). Orchestration-only change — no artifact format change, no
migration needed.

- **Bounded-wave dispatch (new global rule).** Any pass creating >5 sibling tasks chunks them
  into waves of ≤5; every task of wave i+1 is `addBlockedBy` ALL tasks of wave i (never just the
  last — that lets waves overlap).
- **FS.1** — flat fan-out branch (≤20 F###) removed: per-feature tasks are now wave-chained at
  ≤`REBUILD_FS_BATCH_SIZE` (default 5). The >20 batch branch is unchanged (already sequential).
  Mirrored in `spec-stage-procedure.md` SYSTEM fan-out and SKILL.md § caps.
- **FS.5 / SS.1 / SS.2** — reviewer/batch tasks were all-unblocked-at-once (ceil(N/5) concurrent);
  now wave-chained at ≤5.
- **W8 / FS.6** — `chunk(affectedFiles, REBUILD_W8_MAX_PARALLEL)` was a no-op (every fix task
  shared one blocker); batches now chained.
- **FL.4** — flow fix fan-out was entirely uncapped; now wave-chained at ≤`REBUILD_W8_MAX_PARALLEL`.
- **AC.1** — batches chained on the LAST task of the previous batch only (overlap race); now
  chained on ALL of it.
- **Translate** — `REBUILD_TRANSLATE_MAX_PARALLEL` default 3 → **1** (langs sequential);
  documented constraint: langs × per-lang agents ≤ 5.
- **Shard fan-outs** — batches explicitly SEQUENTIAL and counted toward the global cap
  (`artifact-sharding.md § Batching`, all shard types). Inline task-description wording landed in
  v25.1.0 for data-model / route-list / user-stories / feature-list; the remaining three
  (screen-list+flow / behavior-logic / api-map) were completed in v25.1.1.
- **Aggregate system-researcher** — "one per artifact" capped at 5 concurrent (6 artifacts →
  wave of 5 + wave of 1).

## v25.0.1 — route-link parser/migration hardening (patch)

Five Critical defects surfaced by a max-level adversarial review of v25.0.0's new
`_route_link_lib.py` scanner and `migrate-feature-api-ids.py` writer — all reachable from
ordinary authoring patterns, not contrived input. No format change (route-list.md's Backend
Routes column shape is unchanged); bug-fix only.

- **Fence-scoping (C1).** `_all_backend_routes_tables` (validator/nav) and
  `_locate_backend_routes_tables` (migration) had no awareness of fenced code blocks, so a
  fenced ` ```markdown ` example table shown under `## Backend Routes` (illustrating the
  expected shape) was scanned as a REAL sub-table — leaking a fabricated `ROUTE###`/`F###` into
  the inventory/owner-map, shifting migration's numbering, and risking a spurious
  `link.feature_unresolved` FAIL. Both scanners now skip fenced regions (`_id_schemes_lib
  .segment_text` in the validator/nav path; a new `_fenced_line_indices()` helper reusing the
  same primitive in migration).
- **Pipe-in-cell write corruption (C2).** Migration's `backfill_route_list` split each row on
  `|` and blindly inserted the new columns at a fixed index; an unescaped `|` inside a Path or
  Handler cell (e.g. a regex-alternation route constraint) shifted every cell after it, writing
  a permanently corrupted row. Now: header cell count is captured per table span, and any data
  row whose cell count doesn't match is left byte-identical and reported via a WARN (never
  written corrupted).
- **4-digit code overflow (C3).** `_ROUTE_PREFIX`/`_F_PREFIX` (`\bROUTE\d{3}`/`\bF\d{3}`) lacked
  the `(?![0-9])` boundary `_id_schemes_lib.token_re()` already solved elsewhere, so `ROUTE1000`
  silently truncated to the wrong code `ROUTE100` — a real collision risk past 999 routes. Both
  patterns now reuse `token_re()` (wrapped `re.IGNORECASE` to preserve existing case-insensitive
  matching): a 4+ digit code simply does not match, instead of mismatching.
- **Duplicate ROUTE### last-wins (C4).** `build_route_owner_map` overwrote on a duplicate
  `ROUTE###` across two `### File:` sub-tables, silently dropping the first owner and risking a
  false `link.owner_mismatch` against the legitimate one. `build_route_owner_map_with_dups` now
  unions owners across duplicates and returns the duplicate set; the validator raises a new
  critical `link.route_duplicate` for each (the template's "contiguous and global" ROUTE###
  contract makes a duplicate itself a defect). `build_route_owner_map` remains as a back-compat
  wrapper.
- **Missing-separator row drop (C5).** An unconditional `table[2:]` slice (4 call sites across
  `_route_link_lib.py`, `_nav_route_lib.py`, and migration's positional `pos==1` handling) assumed
  the `|---|` separator row is always present; when hand-edited or malformed input omits it, the
  first real data row was silently dropped, producing a false `link.route_unresolved` FAIL (lib/
  nav) or a corrupted synthetic-separator insertion (migration). New shared `data_rows(table)`
  primitive in `_nav_table_parse_lib.py` checks the separator's shape before skipping; migration
  gained the matching `has_sep` branch.

`_route_link_lib.py` stays at the 200-LOC ceiling (the C5 fix's `table[2:]` sites were replaced
with calls to the new shared `data_rows()`, keeping the module itself lean); `validate_feature_api_link.py`
grew by 4 lines for `link.route_duplicate`. Regression tests reproduce all 5 reviewer fixtures
(fenced example table, pipe-in-path row, `ROUTE1000`, cross-table duplicate, missing-separator
table) across the validator, migration, and nav paths, plus a migrate→validate end-to-end pair
(including a missing-separator variant). 2258 pytest green (2242 prior + 16 new).

---

## v25.0.0 — feature↔API/route ID binding (BREAKING)

**BREAKING** — mirrors the v24.0.0 feature↔screen pattern one layer further out: `route-list.md`
gains a mandatory code column and a mandatory owner column, and a deterministic validator now
enforces both directions plus twin-consistency from day one.

### Breaking — feature↔API/route binding (Phase 1)

- **`route-list-template.md`** Backend Routes table gains two columns:
  `Method | Path | Code | Owner F### | Handler | Middleware`. `Code` is the canonical `ROUTE###`
  (contiguous, global, same shape as `SCR###`/`F###`); `Owner F###` carries the bare feature code
  that claims the route, `—` when unattributable (shared/infra routes), or comma-separated
  multi-owners for rare shared routes (e.g. `F001, F003`).
- **`_id_schemes_lib.py`** gains the `ROUTE` scheme (`WORD###`, global scope) and a new
  `ARTIFACT_OWNS["route-list"] = ["ROUTE"]` entry; `SIBLING_MATRIX["ROUTE"]` is scoped to
  `feature-list.md` + `behavior-logic.md` only — `technical-spec.md` is per-feature (out of this
  global-artifact matrix's reach) and `screen-flow.md` was excluded (no real `ROUTE###` citation,
  only an optional either/or in a `GUARD-###` heading).

### New validator `validate_feature_api_link.py`

- forward — `technical-spec.md` / `behavior-logic.md` `{ROUTE###}` citations (Artifact References'
  Codes Used column) resolve to `route-list.md`'s `Code` column.
- reverse — `route-list.md`'s `Owner F###` cell(s) (multi-owner comma/slash aware) resolve to
  `feature-list.md`.
- twin — a feature's forward `ROUTE###` citation must appear in that route's reverse `Owner F###`
  set; a silent double-claim across features is a real correctness bug, not a WIP state (the
  exact lesson PR #158 forced for feature↔screen, extended one layer out).
- Degradation contract: no `Code`/`Owner F###` columns at all → WARN `link.pre_migration`
  (never breaks the build); a present-but-unresolvable code → critical `link.route_unresolved` /
  `link.feature_unresolved`; a mapped route whose owner disagrees with a citing feature → critical
  `link.owner_mismatch`; an empty/placeholder Owner cell on a migrated table → soft `link.unmapped`
  WARN (an unclaimed `—` owner is NOT a twin-consistency mismatch); either inventory file (
  `route-list.md` / `feature-list.md`) absent entirely → WARN `link.inventory_absent` (missing ≠
  drift). Wired into the FS.2 feature-specs gate right after `validate_feature_screen_link.py`.

### New migration `migrate-feature-api-ids.py`

- Idempotent PER-TABLE backfill: a `route-list.md` can be half-migrated (one `### File:`
  sub-table already coded, another not) — each sub-table's own header decides whether it is
  touched; `ROUTE###` numbering stays globally contiguous by seeding from the highest existing
  code across all sub-tables.
- Ownership is DERIVED, not read from an existing bridge (unlike the screen migration's
  `screen-flow.md` "Owned screens" source): every `docs/features/F###/technical-spec.md`'s
  Artifact References citations are inverted into `{ROUTE### -> [citing F###]}` via the SAME
  shared parser (`_route_link_lib.artifact_ref_cited_routes`) the validator uses, so migration
  attribution and validator citation-detection can never disagree. Zero-citation routes get `—`;
  multi-citing routes get a comma-joined owner list.
- Non-destructive: only inserts the `Code`/`Owner F###` columns, never rewrites existing
  Method/Path/Handler/Middleware cells. No `technical-spec.md` files found (bridge absent) →
  WARN + exit 0, no changes ("run the feature-specs pass first").

### Nav wiring (Phase 4)

- New `_nav_route_lib.py`: per-feature Route/API table, presence-pruned (renders only when the
  feature has ≥1 resolvable `ROUTE###` citation), resolving Method+Path labels across every
  Backend Routes sub-table; every row links to the single shared `../../generated/route-list.md`
  (no per-route spec files exist, unlike screens/`SCR###`/`spec.md`).
- `_nav_feature_lib.py`'s `relationship_legend` gate extended to `{5, 7, 9}` — reuses
  `route-list.md`'s existing reading-order gate number 9, no new gate invented.
- All 3 locale string modules (`_nav_strings_{en,vi,ja}.py`) updated in lockstep: the
  `relationship_map` bullet now names `ROUTE###` explicitly (was a vague "route" mention) and
  states that `api-map.md`/`api-contracts.md` remain separate, unbound views; new
  `feature_readme` keys `routes_heading` / `col_route` / `col_route_owner` / `col_route_spec`.

### Out of scope

- `api-map.md` and `api-contracts.md` are **NOT** bound by this release. They are derived/grouped
  views with their own separate code schemes (`{ROUTE_CODE}`/`{GQL_CODE}`/`{GRPC_CODE}` in
  `api-contracts.md`, no codes at all in `api-map.md`) — cross-checking them against
  `route-list.md` is a candidate follow-up, not part of v25.0.0.

### Contracts + checklists updated

`verification-checklist-core-artifacts.md`, `verification-checklist-feature-spec.md`,
`feature-spec-researcher-contract.md`, `pipeline-feature-specs.md`, `technical-spec-template.md`,
`behavior-logic-template.md`.

**Version bump:** `24.1.0` → **`25.0.0`** (major, breaking — new required schema element + gate,
matching the severity class of v24.0.0's own bump).

---

## v24.1.0 — file-schema field + file-endpoint reading scope + twin-consistency reviewer rule (additive)

**Non-breaking** — purely additive improvements to file-exchange documentation, backend reading scoping, and template consistency checking.

### Added

- **File Schema field (BL + ALG):** `behavior-logic-template.md` (BL blocks) and `technical-spec-template.md` (`### ALG-###_Name` Algorithm blocks) each gain an identical `**File Schema**` field — a `| Column | Type | Required | Notes |` table documenting the internal column/header contract of an import/export file (CSV/XLSX), populated only when the block's Type/description matches file-exchange vocabulary (`import, export, csv, xlsx, upload, download, bulk`); `N/A — not a file-exchange type` otherwise. Byte-identical table format in both templates — no format drift between BL and ALG.
- **Bounded backend-reading exception:** `screen-spec-researcher-contract.md`'s Import Discovery Rule (frontend-only, 1-level-deep) gains a narrow exception — when a screen's server-side action is file-producing/consuming (export/import/download/upload path or multipart/file Content-Type), the researcher MUST follow the backend handler one controller→job/service hop to identify the file schema, then **cross-reference** the feature's `BL-### File Schema` rather than re-deriving the column list (DRY). If the backend file-generation code is unreachable within that bound, the researcher escalates via `## Unresolved Questions` instead of silently omitting.
- **Two new validator rules (both warning-severity, non-halting):**
  - `BehaviorLogic.file_schema_missing` in `validate_behavior_logic.py` — flags a BL block whose own Type + description matches file-exchange vocabulary but whose own `**File Schema**` field is left unpopulated (or misuses the `N/A` string despite the vocab match).
  - `FeatureSpec.alg_file_schema_missing` in `validate_feature_spec.py` — the same check applied to `### ALG-###_Name` blocks in `technical-spec.md`.
  Both share one detection helper (`_file_schema_lib.py`) for the vocabulary match and "populated schema" test — no duplicated heuristic. Both rules registered in `verification-checklist-feature-spec.md`'s Deterministic Validator Coverage table.
- **W7i twin-consistency reviewer rule:** `verification-checklist-screen-spec.md` gains a new reviewer-only rule (`W7i`, no Python validator) enforcing that create/edit screen pairs sharing the same `**Feature**` backlink remain consistent on § A) Client-side validated field names — divergences without a stated reason are flagged as a warning. Registered in the checklist's summary table.
- **Server-side validator-class escalation:** `screen-spec-researcher-contract.md` §4.3 Section B now requires the researcher to first attempt to locate and read the endpoint's backend validator class (FormRequest / request-validator / serializer / DTO) before writing `[UNVERIFIED]` on a server-driven error message. If found, the real message is extracted (no `[UNVERIFIED]`); if the class is genuinely unreachable, `[UNVERIFIED]` stands but MUST be paired with a matching `## Unresolved Questions` entry naming the endpoint and the path that couldn't be reached.

### Implementation

- New shared library `_file_schema_lib.py` for File Schema field parsing and validation across BL + ALG contexts.
- New test files: `test_validate_behavior_logic.py`, `test_validate_feature_spec.py`, and `test_file_schema_lib.py` (21 new test cases covering the two validator rules + shared lib).
- No breaking changes to template shapes or validator-stage gates; all new rules are warning-severity and non-halting.

**Version bump:** `24.0.0` → **`24.1.0`** (minor, additive).

---

## v24.0.0 — feature↔screen ID binding + thickened feature/screen reading guide (BREAKING)

**BREAKING** — the two ID systems are now bound both ways, changing two templates and
adding a validation gate. Additive reading-guide work (A1–A6) ships in the same release.

### Breaking — feature↔screen binding (Phase B)

- **`screens-template.md`** Screen List gains an `SCR###` column:
  `Screen Name | SCR### | What User Sees | What User Can Do`. The code is the canonical
  `SCR###_NameSlug` from `screen-list.md` — the bridge to `docs/screens/SCR###_Name/spec.md`.
- **`screen-spec-template.md`** header gains `**Feature**: F###_Name` — the owning feature,
  the inverse of the SCR### column.
- **New validator `validate_feature_screen_link.py`** (WARN-capable, NON-halting): forward
  (screens.md SCR### ∈ screen-list.md) + reverse (screen-spec **Feature** ∈ feature-list.md).
  Degradation contract: a missing column/backlink on an un-migrated doc → WARN
  `link.pre_migration` (never breaks the build); a present-but-unresolvable code → FAIL
  (`link.scr_unresolved` / `link.feature_unresolved`). Wired into the FS.2 feature-specs gate.
- **New migration `migrate-feature-screen-ids.py`** (idempotent, non-destructive): backfills
  the SCR### column (resolved via screen-list.md by name) and the **Feature** backlink
  (sourced from `screen-flow.md` § Feature Entry Points `**Owned screens**`). Absent bridge →
  reports and exits 0 with no changes. Only inserts a column/line — never rewrites prose cells.
- Contracts + checklists updated (`feature-spec-researcher-contract.md`,
  `screen-spec-researcher-contract.md`, `pipeline-feature-specs.md`,
  `verification-checklist-feature-spec.md`, `verification-checklist-screen-spec.md`).

### Additive — feature/screen reading guide (Phases A1–A6)

- **A1** per-artifact causal "why read this here" clauses (`reading_why`) appended to the
  single-component index layer-1-3 rows (mirrors aggregate `reading_order_rows`).
- **A2** multi-line "how to read a feature" traversal block (`feature_traversal`) replacing the
  single buried note; teaches the feature → screen → SCR### path.
- **A3** static ID-relationship legend (`relationship_map`) — F### ⇄ SCR### ⇄ US### ⇄ route.
- **A4** per-feature `README.md` inside `docs/features/F###_Slug/` — 4-file reading order +
  best-effort Screen → SCR### → spec table (column-aware).
- **A5** `docs/features/README.md` feature index (was suppressed; now generated from F### subdirs).
- **A6** `new_dev` role line now points into the feature traversal (gated on the features entry).
- New modules: `_nav_feature_lib.py`, `_nav_table_parse_lib.py`. All 3 locales
  (`_nav_strings_{en,vi,ja}.py`) edited in lockstep; parity tests enforce skeleton identity.

### Nav refresh on the standalone feature-/screen-specs passes

- The **feature-specs (FS.7)** and **screen-specs (SS.3)** passes now run `build_navigation.py` after
  promote (mirroring the core-pass W9.6 step), so the newly-promoted `docs/features/F###/` +
  `docs/screens/SCR###/` dirs immediately surface in the reading-order README, the per-feature READMEs
  (A4), and the features index (A5). Previously these passes promoted the dirs but left the README
  stale until the next core pass. Primary root is refreshed directly (mode-aware `docs_root`);
  secondary-lang mirrors continue to refresh via the translation auto-sync Step 3.5.

**Migration:** run `migrate-feature-screen-ids.py --docs-root docs/` (or `docs/<lang>/`) once
after upgrading; re-run is a no-op. Pre-migration repos keep building (validator WARNs, never FAILs).

---

## v23.0.0 — component per-lang placement: single-source translate model (BREAKING)

**BREAKING** — three tracks shipped together. `SYNTHESIS_FORMAT_VERSION` → `22.0.0` (trips
`[WARN] stale_digest` on existing aggregate state, forcing re-synthesis after migration).

### Track 1 — Component placement model (P04/P05/P07)

Per-component docs are now written ONCE to the language-resolved source root:
- `docs/components/<name>/` for en single-lang (byte-identical to v22 — no change)
- `docs/<primary>/components/<name>/` for non-en or per-lang repos (v23 BREAKING)

`resolve_component_paths` passes `primary_lang` to `resolve_docs_root` — the same resolver
used by core/system artifacts. **The derived-view projection (ADR-0002 rung-1/2/3) is
deleted.** There is no `docs/<primary>/components/` rebuilt by the aggregate; it is written
directly by `--root`/`--batch` runs.

Secondary-lang component docs at `docs/<L>/components/<name>/` are produced by the
translation pipeline (`--lang <L> --root <name>`) and auto-synced on change via
`translation_sync_gate.py` (`_DOC_AREAS` now includes `"components"`). Every secondary-lang
component doc is a real translation — the rung-3 "dùng tạm" fallback is gone.

### Track 2 — Derived-view shadow purge (P06)

`_component_view_lib.py` and the projection entry-point in `_component_placement_lib.py`
deleted. Test file `tests/test_component_placement.py` removed. All three recorded in
`claude/metadata.json → deletions`.

### Track 3 — Reading-guide / nav fixes (P04/P07)

`build_navigation.py` generates READMEs at the resolved per-lang component path. The
`--aggregate` `system/README.md` reading-guide no longer references a derived-view path.

### One-time migration (existing non-en repos)

`_component_migrate_lib.migrate_components_to_lang` runs automatically on the FIRST
`--aggregate` call when `primary_lang != en` and `docs/components/` still exists (the old
v20/v22 root location). Guarded by sentinel `docs/<primary>/.components-migrated-v23`.

| Scenario | What happens |
|----------|--------------|
| `docs/components/` absent (new or already clean v23 repo) | no-op; sentinel written |
| Only `docs/components/` present | atomic `os.rename` root → lang; sentinel written |
| Both trees present, byte-identical | `shutil.rmtree` root copy; sentinel written |
| Both trees present, files differ | keep both; `[WARN]`; sentinel NOT written — re-run after resolving manually |
| `primary_lang == "en"` | no-op; en source stays at `docs/components/` by design |

**Root `docs/README.md` pruning:** after a successful migration a purely-generated pointer
README at the root is deleted; a hand-written one is never touched.

### ADR

ADR-0002 superseded by **ADR-0003** (`docs/decisions/ADR-0003.md`). ADR-0002 kept as
immutable history with a superseded banner.

---

## v22.0.0 — auto-detect multi-component + shared-layer attachment (BREAKING)

A single `rebuild-spec` run over **one repo holding N independent executables** (Ishindenshin: 20
Delphi `.dpr` under `PG/<MODULE>/` + a shared `PG/Common/` + an Oracle `DB/{TABLE,SP,VIEW}/<MODULE>/`
tree) used to flatten every module into ONE mono doc set — the multi-component machinery was opt-in by
flag and never auto-triggered. v22 closes that gap with three moves, all inside the existing
multi-component machinery.

**BREAKING:** a plain `/tkm:rebuild-spec` over a multi-executable `one-spec-per-unit` repo now
**auto-switches** into the `--emit-manifest`→`--batch`→`--aggregate` loop instead of producing one mono
doc set. Escape hatch: `--mono`.

- **Auto-switch (Phase 03/04).** `detect_stack_profile.py` resolves a `component_profile` — a matched
  `one-spec-per-unit` profile that claims ≥2 component roots — and emits `auto_switch` + `auto_switch_reason`.
  SKILL.md Preflight 2.5 prints `[INFO] multi-component detected (…): switching to --emit-manifest flow`
  and enters the driver loop. Bypasses: `--mono`, an explicit `--root <subrepo>`, an existing
  `.rebuild-components.json` (idempotent).
- **Executable-manifest boundary (Phase 01/02).** New optional profile field `component_boundary_globs`
  (`["*.dpr","*.dproj","*.dpk"]` on `delphi-vcl`) marks a component root by executables only — a dir with
  only `.pas` is no longer claimed. `find_components` gains keyword-only `boundary_globs`/`shared_abspaths`/
  `warnings` (default-None = byte-identical legacy behavior; all existing call sites unaffected).
- **Shared-layer marker (Phase 01/03/05).** New optional profile field `shared_layer_dirs`
  (`["Common","DB"]`) — those dirs are scanned ONCE and attributed to each component, never claimed as
  their own component (Layer-1 exclusion runs before the marker check, defeating the oracle co-detection
  of `DB/`). Surfaced as `detectJson.shared` and written to a SIDECAR `.rebuild-components-shared.json`
  (the component manifest stays a JSON ARRAY — Finding 1). A suppressed dir emits `shared_layer_excluded`
  so a real module named `DB`/`Common` is not silently dropped (Finding 4).
- **Deterministic DB attribution (Phase 05).** `_shared_attribution_lib.matches_module_label` (full-segment
  equality — `POS` ≠ `POSDEN`) drives a per-component FILTERED view of the shared-DB digest, attributing
  `DB/<TYPE>/<MODULE>` objects to `PG/<MODULE>` by the declared module-name convention. The Step-0.4
  shared pre-pass runs at the ROOT plan-dir (distinct from each component's → no `is_extractor_completed`
  collision; the `--out-suffix` idea was dropped).
- **`--profile <id>` (Phase 03).** Pins the authoritative profile when Delphi+Oracle co-detect and a
  DB-heavy tree would otherwise make `oracle-plsql` the hit-count `recommended` (Finding 2).
- **Detect output `schema_version` → 22.0.0.** Additive (new `component_profile`/`auto_switch`/`shared`
  fields); `recommended_profile` unchanged for legacy callers. `SYNTHESIS_FORMAT_VERSION` /
  state schema UNCHANGED (no synthesis-output or state-shape change). New file:
  `scripts/_shared_attribution_lib.py`.

Red-team hardened (`reviewer-260629-1508`): 2 BLOCKERS (manifest-array sidecar, component_profile vs
hit-count winner) + 3 majors folded into the design before build.

## v21.0.1 — extractor + contiguity fixes from real Delphi/Oracle run (patch)

Five bugs surfaced validating v21 on a real Delphi+Oracle (Shift-JIS) ERP repo on a
case-sensitive Linux FS. No output-format change (`SYNTHESIS_FORMAT_VERSION` stays `21.0.0`).

- **Case-insensitive extractor globs.** `fnmatch(fn, glob)` with lowercase globs (`*.sql`,
  `*.pas`) silently skipped uppercase `.SQL`/`.PAS` files on case-sensitive filesystems —
  near-empty digests (1 table instead of 461). Filename is now lowercased before matching in
  `extract_sql_schema.py`, `extract_data_flow.py`, and `_extractor_lib.py` (`source_tree_hash`).
- **Oracle leading-comma columns.** `_COL_DEF` in `_sql_parse_lib.py` required a line to start
  with whitespace, so leading-comma DDL (`,\tCAPTION VARCHAR2(40)`) parsed only the first column.
  `_COL_DEF`/`_COL_SKIP` now accept a leading comma.
- **Contiguity duplicate false-positives (hybrid heading/prose rule).** `validate_id_contiguity.py`
  counted *every* prose occurrence of a code as a definition, so summary-table rows,
  `**Dependencies**:` cross-links, `F001–F045` ranges and format examples all read as duplicates.
  Now: if a code appears as a Markdown **heading** at all, its duplicate count is judged by heading
  occurrences only (table/bullet refs ignored); if it **never** appears as a heading (table-defined
  schemes like `route-list` / `crud-matrix`), it falls back to all-prose counting so genuine
  duplicate rows are still caught. Two headings for one code remains the canonical duplicate.
- **Stack-specific core artifacts promoted.** `crud-matrix.md` and `db-objects.md` (extractor-
  digest-derived) added to `_layout_lib.py`'s layout map and `promote_drafts.py`'s promote list,
  so Delphi/Oracle runs place and promote them like other core artifacts.

Regression tests added: `TestParseColumnLine` (leading-comma), `test_uppercase_extension_detected`,
heading-based duplicate fixtures, plus `test_heading_defined_with_many_refs_not_duplicate` and
`test_table_defined_scheme_duplicate_via_fallback` in `test_validate_id_contiguity.py`. 1955 pytest green.

---

## v21.0.0 — screen-artifact unify (non-web) + IPE stack-aware US generation (BREAKING)

**BREAKING** — non-web stacks now gain a screen artifact. `SYNTHESIS_FORMAT_VERSION` → `21.0.0`.

**Motivation.** On a real Delphi+Oracle ERP repo, `delphi-vcl` skipped the whole
`route-list/screen-list/screen-flow/api-map` cluster (`class: web`) → **no screen artifact**, and
US generation (screen-anchored) starved to **86 US for 440 material forms** (~20–35% coverage). v21
gives desktop stacks a screen artifact and makes US enumeration run per-form, without touching the
(correct) web path.

**What changed:**
- **New profile field `screen_source`** (`route-view` | `dfm-form` | `none`; `form-module` reserved).
  `screen-list`/`screen-flow` are produced **iff** `screen_source != none`, *overriding* their
  `artifact_map.action`. `route-list`/`api-map` stay web-only (governed by `artifact_map`). The
  `produce()` helper is the single source of truth. Profiles: web-js-ts→`route-view`,
  delphi-vcl→`dfm-form`, oracle-plsql/generic-source→`none`.
- **Anti-skip hardening (self-consistency).** First real Delphi run silently skipped screens: the
  orchestrator read `delphi-vcl.json`'s `screen-list/screen-flow → {action:skip, class:web}` and the
  "non-web project → skip web artifacts" heuristic, ignoring the subtle `screen_source` override. Fixed
  three ways so the produce decision is unmissable: (1) `delphi-vcl.json` now sets those two to
  `action:"produce"` — the profile reads truthfully (schema adds a **self-consistency rule**:
  `screen_source != none` ⇒ map them `produce`); (2) an explicit MANDATORY rule at the `produce()`
  binding in `pipeline-dispatch-and-gates.md` — the skip decision is `produce()`/`screen_source` ONLY,
  NEVER `class:web` and NEVER "route-list was skipped"; (3) SKILL.md's artifact→wave table no longer
  lists `route-list.md` as a screen prerequisite for non-web stacks (source is the form-nav digest).
- **Scout `.dfm` root-kind classification** — `object X: TBaseClass` header decides the tag:
  TForm→`screen`, TFrame→`screen-embedded`, TDataModule→`datamodule` (+`[reachable]`). Never by
  extension. `count_screen_files.py` regex tightened (`\tscreen(?![-\w])`) so `screen-embedded`/
  `datamodule` no longer inflate the visual-screen count.
- **New extractor `extract_form_nav.py`** — parses `.pas` Show/ShowModal/CreateForm, resolves
  target form→unit, builds a reachability closure from the `.dpr` root form, emits
  `_digest_extract_form_nav.json` (forms + edges, each citing `file:line`). Unreachable/indirect →
  `reach: unverified` (included, never dropped). Wired into `delphi-vcl` extractors + allowlist.
- **Route/api-map decoupling** (the part that actually unblocks Delphi): W9 `allCoreDocsPromoted`
  asserts route-list/api-map/screen-list/screen-flow only when `produce()`; the W7a reviewer
  artifact list is built from produce()-true artifacts; the verification-checklist SCR→RouteList
  cross-check + service-coverage rule are gated on `produce("route-list")`; `validate_screen_list.py`
  gains `--screen-source` (skips the route-specific `no_wildcard_route` check off route-view, keeps
  all structural checks). Without this, a perfect Delphi run HALTED at Wave 9.
- **Stack-aware templates** — screen-list/screen-flow carry conditional STACK-AWARE directives:
  `dfm-form` omits Routes/URLs, Authentication Flow, Guard Logic, Deep-Link, Unsaved-Changes,
  Extraction Signatures; uses a caller-based Invocation/Entry-form shape (no fork — one template).
- **IPE stack-aware** — Step 1 vocabulary enumerates `.dfm` controls (TButton/TAction/TMenuItem…+
  On* handlers) for dfm-form; Step 3 merge key is per-stack (web=same HTTP endpoint, dfm-form=same
  event-handler proc — NOT same table); materiality filter drops FPrt/FSel/FDlg/FSub/FCal families;
  form-variant dedup collapses `FHotelm`+`FHotelm2`; Oracle PL/SQL reachable logic → system-action
  US in behavior-logic/feature-list. Web split rule textually unchanged. `IPE_MERGE_CANDIDATE`
  reviewer rule updated to the per-stack key.
- **RE citation** — `validate_source_citations.py --re-mode` now counts screen-list/screen-flow
  toward citation density (when present on disk). `[UNVERIFIED]` reachability rows are valid (they
  carry a form-definition `file:line`). Advisory WARN, never HALT.

**Migration.** Existing Delphi docs lack screen-list/screen-flow. On the next run the orchestrator
backfills them: when `produce("screen-list")` is true but `docs/generated/screen-list.md` is absent
while core docs exist, Wave 2 screen-artifact generation is scheduled (see `pipeline.md` §
"v21.0.0 screen-artifact migration"). Additive — no prior artifact is deleted. Web output is
byte-comparable to pre-v21 (regression suite green); oracle-plsql still emits no screen artifact.
Because `screen_source` is a new resolved-profile field, the profile/state schema version bumps in
lockstep: `_stack_profile_lib.SCHEMA_VERSION` and `.rebuild-state.json`'s `STATE_SCHEMA_VERSION`
→ `21.0.0` (RT-F4). On resume, a state `< 21.0.0` invalidates the preflight checkpoint and
re-resolves the profile, so a pre-`screen_source` checkpoint cannot silently fail-close screens to
`"none"`.

**US recovery.** Delphi US count recovers from 86 toward the audited ~150–250 band (post
materiality-merge + variant-dedup), not the 354 1:1 upper bound.

---

## v20.0.0 — per-component language-aware placement: source-vs-derived-view (BREAKING)

**BREAKING** — components layout semantics change. `SYNTHESIS_FORMAT_VERSION` → `20.0.0`.

`--aggregate` now builds a **derived view** `docs/<primary>/components/<name>/` from the
lang-agnostic source `docs/components/<name>/` using a rung-selected per-component slice.
The source is NEVER mutated. Stale orphan dirs are pruned atomically each run.

**Source-vs-derived-view model (ADR-0002):**
- **Source of truth:** `docs/components/<name>/` — per-component `--root`/`--batch` runs
  always write here (unchanged). Lang-agnostic, ping-pong-safe.
- **Derived view:** `docs/<primary>/components/<name>/` — rebuilt atomically each aggregate
  run (temp-dir + rename swap; orphan prune). Not a symlink — a real committed copy.
- **Rung selection:** rung-1 (has `<L>/` mirror → flatten to view root, mirror wins on
  collision); rung-2 (primary_lang == L → copy base, exclude sibling lang dirs); rung-3
  (no `<L>` content → copy primary base + `[WARN] lang_fallback`).
- **Legacy converge:** a stray `docs/<primary>/components/` from a prior v15 run is moved
  back to `docs/components/` (source) on the first aggregate run.

**LANGUAGE_LAYERS split:**
- `MOVED_LAYERS` = `("system", "generated", "flows", "features", "screens")` — flip/relocate
  move ONLY these layers. `components` is no longer relocated by the layout flip.
- `LANGUAGE_LAYERS` kept as backward-compat alias (includes `components`) for rollback.

**Digest collection:** always reads from SOURCE `docs/components/` (lang-agnostic) regardless
of layout mode. Prior v15 code read from `docs/<primary>/components/` in per-lang mode.

See `docs/decisions/ADR-0002` (supersedes ADR-0001's deferred-flatten stance — the flatten
IS done, but only in the derived view, never in the source).

---

## v19.0.0 — aggregate tier: Python is scanner-only (BREAKING)

**BREAKING** — completes v18's Python-removal. Python no longer generates ANY aggregate document
content (prose, tables, OR Mermaid). `SYNTHESIS_FORMAT_VERSION` → `19.0.0`.

`--aggregate` is now purely the scanner: writes `.system-scout-report.md` as **data tables only**
(no Mermaid) + mechanical `per-component-confidence.md`, and creates **no `.draft.md`**. The
**system-researcher** CREATES each of the 6 system docs from `templates/aggregate/<name>-template.md`
+ the scout report + the components' docs — authoring prose, **building tables, and drawing the
Mermaid itself** (topology/layer/saga). Docs-derived edges now appear IN the charts (v18 had them in
prose only, because Python drew the chart from the thin digest before the docs were read — the root
cause of the stale-chart problem).

- **Removed (Python):** `_build_topology_mermaid_block`/`_build_layer_mermaid_block`/
  `_build_saga_sequence_block`, `render_draft_from_template`, `load_aggregate_template` from
  `_synthesis_scout_lib.py`; the 6-draft emission loop from `synthesize_system.py`.
- **Fidelity → review gate + lint** (was mechanical pinning): new `lint_mermaid_safety()` scans
  authored Mermaid fences for unsafe raw chars; `validate_filled_scaffold(draft)` (single-arg) flags
  leftover `{{FILL}}`/`{{SCOUT}}` + lint violations before promote. `SY-R6` rewritten for LLM-drawn
  charts (every edge traces to scout/cited-doc; no phantom edges; `[UNVERIFIED]`+cited; valid+safe).
- **Templates rewritten:** drop `{{SCOUT}}`; `{{FILL}}` now instructs "BUILD the table" / "DRAW the Mermaid".

Validated end-to-end on `wsm_platform` (reviewer `failed:0`; charts now carry the employee Kafka/gRPC
edges). 1906 pytest green.

**Housekeeping (post-v19):** removed the orphaned Phase-08 reused-mirror trió —
`scripts/mirror_reused_component.py` + `scripts/_reused_mirror_lib.py` +
`scripts/tests/test_reused_mirror_lib.py` — and pruned the runbook's "Delete-original gate" prose. The
CLI was implemented + tested but never invoked (no import, no orchestration reference); the live reused
path is `synth_digest_from_docs.py` (Step 0.5). No behaviour change (it was never called). 1889 green.

---

## v18.0.0 — LLM-authored aggregate tier (scout-report + template) + read-reused-docs (BREAKING)

**BREAKING** — the aggregate (`--aggregate`) tier no longer builds its documents in Python.
`SYNTHESIS_FORMAT_VERSION` → `18.0.0` (forces re-synthesis on the next run).

New model: Python computes facts → `.system-scout-report.md` (services table with `reused` flag +
absolute docs path, edge/fan-in-out/entity/correlation/event tables, pinned topology/layer/saga
Mermaid, confidence) → emits the 6 system docs as `<name>.draft.md` from
`templates/aggregate/<name>-template.md` with `{{SCOUT}}` fact-blocks pre-substituted verbatim
(Python-pinned diagrams/tables = provably faithful). The new **system-researcher**
(`references/system-researcher-contract.md`) AUTHORS the `{{FILL}}` prose, then the v17 Step 3.5
review→fix→promote gate runs (now `SY-R1..R8` over 6 authored artifacts).

- **[Critical rule] Read reused docs — never declare "unobserved" blind.** The researcher MUST read
  each component's docs (without exception for any `reused`/docs-derived component) at the scout-report
  docs path and supplement the heuristic edge list. Calling a read-available component
  "isolated/unobserved" = CRITICAL (`SY-R8`). Root cause: `synth_digest_from_docs.py`'s thin digest
  (WSM `ssv-wsm-employee` had `topic=0` → looked isolated; its docs reveal Kafka consume/produce +
  gRPC to auth & gateway).
- **Removed:** Python scaffold builders (`render_system_overview_scaffold` etc., `render_service_catalog`,
  `render_data_ownership_map`, `render_system_architecture`) and the orphaned `_synthesis_render_topology.py`
  (builders moved to new `_synthesis_scout_lib.py`). `data-ownership-map.md` is now authored; only
  `per-component-confidence.md` stays mechanical.
- **Promote gate:** `validate_filled_scaffold` now flags any remaining `{{FILL}}`/`[FILL]`/`{{SCOUT}}`;
  the H2 add/drop lock is dropped.
- **Per-lang root README removed:** `build_navigation.py` no longer writes a root `docs/README.md` in
  per-lang mode (was a ~3-line pointer in v15-v17). `resolve_root_readme_removal()` deletes a
  purely-generated root README, preserves a hand-written one. Sole entry: `docs/<primary>/README.md`.

Validated end-to-end on `wsm_platform` (1905 pytest green; reviewer `failed:0`).

---

## v17.0.0 — aggregate-tier quality: review gate, charts, reasoned nav, entity dedup (BREAKING)

**BREAKING** — the aggregate (`--aggregate`) promote gate changed. Hybrid artifacts are no longer
promoted on narrative-fill alone; a new **review→fix-cycle→promote** stage (Step 3.5) now stands
between fill and promote. A run whose hybrid drafts fail review after `MAX_FIX_CYCLES = 3` preserves
the drafts and escalates instead of promoting. Output paths are unchanged.

Four fixes, sourced from a real `wsm_platform` aggregate run:

- **Review subsystem + wording rubric (D).** New `references/verification-checklist-system-synthesis.md`
  (`SY-R1..SY-R7`: readability, factual consistency vs digests, `[UNVERIFIED]` honesty, entity-name
  sanity, no-empty-glossary-without-reason, chart coherence, read-first reasoning). The aggregate
  narrative-fill now runs a W7a-style `reviewer`→bounded fix-cycle (mirrors `pipeline-w7-w9.md`,
  reuses `_review_report_lib.mutate_review_report`)→promote gate over the 5 hybrid artifacts; the
  mechanical `per-component-confidence.md` / `data-ownership-map.md` are not reviewed. A human-readability
  **wording rubric** (active voice, define terms, no raw symbol dumps, audience = new engineer) is now
  part of the fill contract — the cheapest quality win. Orchestrator-driven; no new Python.
- **Charts for prose sections (B).** `architecture.md` `## Layer Diagram & Data Flows` now carries a
  role-tiered Mermaid `flowchart TB` (gateway → services → frontend); `cross-service-flows.md` sagas now
  carry a Mermaid `sequenceDiagram` — both scaffolded mechanically (injection-safe) before the fill
  narrative, kept under existing H2 so the promote gate's H2-lock holds.
- **Reasoned reading-order + README dedup (C).** Synthesis writes a side-channel
  `docs/<lang>/system/.nav-metadata.json` (ranked by role tier → fan-in, reused last, with a rationale
  key); `system/README.md` renders a "which service to read first + why" section (lang-aware, omitted
  when the metadata is absent). The parent `docs/<lang>/README.md` is now a thin pointer to
  `system/README.md` instead of duplicating the full reading-order table.
- **Entity dedup + dirty-name filter (A).** `entity_ownership` dedups by canonical `(owner, name)` and
  a shared `_canonical_entity_name` helper drops doc-section headings lifted as entity names
  ("Entity Relationship Diagram", "Entities", "Summary", "Validation Rules") and collapses
  `MODELnnn — X` / `X` variants. Filtered at both the parse source (`parse_entities`) and downstream.
  Plus a per-lang **components relocation** fix: a stray `docs/components` left at the root when the
  system dir was already migrated is now relocated to `docs/<lang>/components` (idempotent, reusing
  `_catchup_components`), independent of the `needs_migration` gate that previously skipped it.

New module `scripts/_nav_metadata_lib.py`. No files removed (no `metadata.json` deletions).

## v16.4.0 — docs refactor (multi-component runbook extracted; no behavior change)

Thinned the always-loaded `SKILL.md` by extracting the ~95-line **Multi-component runbook** block and
the 9 multi-component flag rows (`--root`/`--batch`/`--aggregate`/`--emit-manifest`/`--manifest`/
`--primary-lang`/`--force-aggregate`/`--digest-collect`) into a new on-demand reference
`references/multi-component-runbook.md`. `SKILL.md` keeps a ~6-line stub + a single pointer flag row +
a new "On-demand pipeline loading" directive (load the reference when any multi-component flag is set).
Single-repo runs (the common case) no longer carry monorepo-only detail in context. The
recommended-pass-sequence and all single-repo/pass flags (`--legacy`, `--lang`, `--non-interactive`, …)
stay inline. **No pipeline logic changed** — pure documentation reorganization; every gate, flag, and
contract is preserved verbatim in the reference. Synthesis internals remain in
`system-synthesis-contract.md`; the runbook now cross-links to it.

## v16.1.0 — additive (per-pass batch driver)

`--batch` gains `--pass <feature-specs|screen-specs|flows|glossary>` so the multi-component runbook
can auto-loop the remaining passes per component (Step 1b), the same way core is looped — durable
per-pass status, failure-isolation, cross-session resume. Core `--batch` (no `--pass`) is
BYTE-IDENTICAL; manifest entries gain nested `pass_status`/`pass_fail_reason` (absent ≡ pending —
back-compat). DAG: `flows`/`glossary` require `feature-specs`; `feature-specs`/`screen-specs` need
only core done. Reused/excluded components skip every pass; a pass "done" carries NO sha (output is a
disk-verifiable docs tree). Primitives in `scripts/_manifest_pass_status_lib.py`
(`next_pending_pass`/`mark_pass_done`/`mark_pass_failed`/`pass_summary`). `--aggregate` is orthogonal
(consumes only the core digest); `--lang` still runs last, once, over the whole tree.

## v16.0.0 — BREAKING CHANGE (aggregate doc-tier parity)

The `--aggregate` artifact names are renamed to PARITY with the per-component tier:
`system-overview.md`→`overview.md`, `service-catalog.md`→`component-catalog.md`,
`system-glossary.md`→`glossary.md`; the standalone `interaction-graph.md` is FOLDED into a NEW
`architecture.md` (mechanical topology + edges + fan-in/out + self-loops, plus a hybrid narrative
section). `data-ownership-map.md`, `per-component-confidence.md`, `cross-service-flows.md` keep their
names. The component-catalog gains Dependencies + Module-link + Responsibility (hybrid-fill) columns;
the aggregate `system/README.md` is rewritten to a numbered reading-order table + role reading-paths +
components pointer + principles (no more flat `## Files` list). No migration of existing on-disk
aggregate files (none exist — Validation S1); renderers emit the v16 names from the start and
`_is_aggregate_root` detects on `component-catalog.md` (the unique aggregate artifact —
`architecture.md` is shared with the single-component tier). See
`references/system-synthesis-contract.md`.

## v15.0.0 — per-lang aggregate layout / DOCUMENT-MAP removal

`build_navigation.py` no longer writes `docs/DOCUMENT-MAP.md` or `docs/DOCUMENT-MAP.draft.md` (was
write-only; no reader; machine state lives in `docs/.rebuild-state.json`). `META_FILES` still
recognizes both names so migration deletes any stale copies on next run. In per-lang mode the
top-level `docs/README.md` collapses to a ~3-line pointer to `docs/<primary>/README.md`; the whole
`components/` container relocates to `docs/<primary>/components/`. See `docs/decisions/ADR-0001`.

## v13.1.0 — top-level reading-order `docs/README.md` index (additive)

The navigation pass (`build_navigation.py`) writes a top-level `docs/README.md` "Documentation Index —
Reading Order" landing page — for the primary root AND every `docs/<lang>/` mirror (`--lang`).
Per-language labels, a "Read by role" guide (new-dev / reviewer / PM number-paths), per-layer intros,
and an ordered 4-layer table of concrete one-line descriptions render deterministically (no LLM);
absent artifacts (and the role-path numbers pointing at them) are pruned; 2-zone user tail preserved.
Prose lives in per-language locale modules (`_nav_strings_<lang>.py`); structure + role number-paths in
`_nav_strings.py`; the renderer in `_nav_index.py`.

## v13.0.0 — BREAKING CHANGE (system layer: language-mapped + richer)

`--aggregate` now writes the system layer to the **language-mapped** docs root — `docs/system/` for an
en single-lang repo (byte-identical, no change) but `docs/<primary>/system/` for a per-lang project,
with `primary_lang` discovered by majority across the component `.rebuild-state.json` files (conflict →
majority + `[WARN] lang_conflict`; `--primary-lang` overrides). A flat legacy tree on a per-lang project
is auto-migrated (`migrate_docs_layout`) before writing — no orphaned flat copy. The artifact set is
recut (red-team): `interaction-graph.md` gains a Mermaid topology + fan-in/out summary + self-loop note;
`canonical-entity-model.md` is replaced by `data-ownership-map.md` (ownership + correlation + event
producer→consumers); and `system-overview.md`, `system-glossary.md`, `cross-service-flows.md` are
**hybrid** — Python writes `<name>.draft.md` (idempotent; unfilled markers → `[WARN]
unfilled_scaffold`), a narrative-fill agent completes the prose, then the orchestrator promotes to
`<name>.md` after the post-fill validator passes. See `references/system-synthesis-contract.md`.

## v12.0.0 — BREAKING CHANGE (system-of-systems / multi-component)

The run model gains a multi-component shape for monorepo / polyglot microservice repos: **per-sub-repo
run + one root synthesis pass**, instead of a single root run. `detect_stack_profile.py` now ALSO emits
`components[]` (additive — `recommended_profile` is unchanged, so single-repo callers do not break); a
stateless driver `--batch <manifest>` processes one component per invocation; `--aggregate <root>`
synthesizes the system layer (v12 used `service-catalog.md`, `interaction-graph.md`, … — v16 uses
v16-parity names) over the per-component neutral digests. BREAKING is in the multi-component RUN MODEL
(new flags + the per-component `docs/components/<name>/` layout), NOT in the `detect` output shape.
Single-repo runs (no `--root`/`--batch`/`--aggregate`) are unchanged. See
`references/system-synthesis-contract.md`.

## v11.0.0 — BREAKING CHANGE (stack-profile layer)

Preflight no longer hard-aborts on a missing web manifest. A **stack-profile** (data file under
`references/stack-profiles/*.json`) declares detection globs, source encoding, artifact map, and probe
behavior; legacy non-web stacks (Delphi, Oracle PL/SQL) now run. No profile match → AskUserQuestion
(pick / generic / abort), never auto-abort. **State migration (RT-F4):** `.rebuild-state.json` carries
`schema_version`; resuming a pre-11.0.0 state invalidates the preflight checkpoint and re-runs
`detect_stack_profile.py` + profile-resolve before continuing the wave graph. A pass interrupted under
≤10.x re-runs preflight.

## v5.0.0 — BREAKING CHANGE (CORE-only default)

Default run now produces CORE artifacts only (no feature specs, process-flows, or glossary). Use
`--feature-specs`, `--flows`, `--glossary` standalone passes for those outputs. `--features F###` is
redefined as a scoped subset of `--feature-specs` (was: default-pipeline W6 narrowing). Migration: run
core pass first, then the new passes in order.

## v4.0.0 — per-feature 4-file specs

Per-feature specs split into 4 audience-aware files; `docs/system/architecture.md` and
`docs/generated/permissions-matrix.md` are generated/promoted; process-flows synthesized at FL.1 with an
FL.2 liveness validator (historical numbering: W6.8 / W6.85).
