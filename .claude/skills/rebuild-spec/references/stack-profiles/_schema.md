<!-- layout-exempt: stack-profile schema — artifact_map keys are rebuild-spec's own artifact names, not docs/ consumer paths -->
# Stack-Profile Schema (Phase A)

A **stack-profile** is the data declaration that tells rebuild-spec how to reverse-engineer a
given technology stack. It replaces the hard-coded "web app + JS/PHP manifest + UTF-8" assumption
that previously lived in the preflight gate and the scout dispatch. Adding support for a new stack
means adding **one profile file** here — never editing pipeline code.

## Hard rules

1. **Profiles are loaded ONLY from this kit directory** (`references/stack-profiles/`). A profile is
   never loaded from the project under analysis, a user-supplied path, or anywhere else. This is the
   trust boundary (RT-F5): a malicious repo cannot inject a profile.
2. **A profile MUST be a `.json` file.** `.yaml` / `.yml` / `.toml` files are **NOT** loaded
   (stdlib `json` only — zero third-party dependency). The loader ignores any non-`.json` entry and
   any file whose basename starts with `_` (reserved: `_schema.md` is documentation, not a profile).
3. **`extractors` are validated against an allowlist** of known script names before any extractor
   runs (RT-F5). A profile naming an extractor outside the allowlist is **rejected** (the loader
   raises, the orchestrator aborts). The allowlist lives in `_stack_profile_lib.py`
   (`ALLOWED_EXTRACTORS`). Phase A ships every profile with `extractors: []`; Phase B/D populate them.
4. **`detection.globs` are match-only.** They are evaluated with `fnmatch` against the basenames
   walked by `detect_stack_profile.py` (which uses `os.walk(followlinks=False)` and a file cap).
   They are never passed to a shell glob or an unbounded filesystem walk with an attacker-controlled
   root.

## Fields

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `id` | string | yes | Stable identifier. MUST equal the filename stem (`delphi-vcl.json` → `delphi-vcl`). |
| `display_name` | string | yes | Human-readable name for logs / manifests. |
| `detected_language_heading` | string | yes | Value the scout writes into `## Detected Language` (RT-F2). E.g. `"Delphi/VCL"`, `"Oracle PL/SQL"`, `"JS/TS"`. Never `"JS/TS"` for a non-JS stack. |
| `detection` | object | yes | `{ "globs": ["*.dpr", "*.pas", ...] }` — basename patterns identifying the stack. |
| `source_encoding` | object | yes | `{ "primary": "shift_jis", "fallback": "utf-8" }`. `primary` is the encoding extractors decode with; `fallback` is tried on decode error. For web profiles both are `utf-8`. |
| `resource_decode` | string\|null | no | Optional rule name for stack-specific escape decoding (e.g. Delphi `#nnnn` resource strings). `null` when not applicable. |
| `artifact_map` | object | yes | `{ "<artifact>": { "action": "produce"\|"skip", "class": "universal"\|"web"\|"stack-specific" } }`. Drives the producing/skipping manifest AND the conditional dispatch guard (RT-F1). |
| `screen_source` | string | yes | **[v21.0.0]** Declares WHERE screens come from for this stack: `"route-view"` (web — routes resolve to view components), `"dfm-form"` (Delphi — `.dfm` TForm units), or `"none"` (no reliable screen source → headless backend, DB-only). **Authoritative gate for `screen-list`/`screen-flow`:** they are produced **iff** `screen_source != none`, *overriding* whatever those two artifacts' `artifact_map.action` says. `route-list`/`api-map` are NOT governed by this field (they stay web-only via `artifact_map`). Enum extensible — `"form-module"` is reserved for a future oracle-forms profile. Default when absent: `"none"` (fail-closed: an unmapped stack does not fabricate a screen artifact). |
| `extractors` | string[] | yes | Structural-extractor script names (no `.py`, no path) run in Wave 0.6 (Phase B). Validated against `ALLOWED_EXTRACTORS`. `[]` for web/generic. |
| `probe` | object | yes | `{ "bootable": false }` — when `false`, Wave 0.4 route-probe is skipped (legacy stacks are not bootable web apps). |
| `module_layout` | string | yes | `#12` hook — declares the spec layout convention, e.g. `"one-spec-per-unit"` (Delphi) or `"feature-grouped"` (web). Drives the multi-component auto-switch (`detect_stack_profile.py` keys the `component_profile` on a `one-spec-per-unit` profile claiming ≥2 roots). |
| `component_boundary_globs` | string[] | no | **[v22.0.0]** When present, `find_components` marks a component root using ONLY these basename globs (e.g. `["*.dpr","*.dproj","*.dpk"]` — executables/packages, never `.pas`/`.dfm`/`.inc`) instead of all profiles' `detection.globs`. Affects **boundary detection ONLY** — profile-matching (`match_profiles`) still uses `detection.globs`. **Absent → current behavior** (all profiles' detection globs mark a root). Backward-compatible: web profiles omit it. |
| `shared_layer_dirs` | string[] | no | **[v22.0.0]** Dir **basenames** (matched at any depth, no fnmatch) that are shared layers — scanned once and attributed to each component, **never claimed as their own component** (e.g. `["Common","DB"]` for Delphi). A dir suppressed this way emits a `shared_layer_excluded` warning so a real module legitimately named `DB`/`Common` is not silently dropped. **Absent → `[]`** (no shared layers; current behavior). |
| `re_contract` | bool | no | **[v11.2.0]** When `true`, the RE output contract is enforced — every structural claim carries a citation, unverifiable claims are marked `[UNVERIFIED]`, and the reviewer runs a citation-density check. Set on `delphi-vcl`/`oracle-plsql`; absent/`false` for web/generic (normal mode, no new gate). `--legacy` forces it `true`. See `references/re-output-contract.md`. |

### `artifact_map` artifact keys

Keys are rebuild-spec artifact names (the same names used by `--artifact NAME`): `system-overview`,
`architecture`, `route-list`, `data-model`, `screen-list`, `screen-flow`, `behavior-logic`,
`api-map`, `permissions`, `permissions-matrix`, `business-rules`, `user-stories`, `feature-list`,
`entities`. Phase B adds `crud-matrix` and `db-objects`. An artifact absent from the map defaults to
`{ "action": "produce", "class": "universal" }` (fail-open for unmapped universal artifacts).

### `class` semantics

- `universal` — meaningful for any codebase (user-stories, feature-list, system-overview, data-model).
- `web` — only meaningful for a bootable web/API app: `route-list`, `api-map`. **NOTE (v21.0.0):**
  `screen-list`/`screen-flow` historically carried `class: web`, but screens are NO LONGER web-only —
  their production is gated by `screen_source` (see "Screen source & conditional production"), not by
  `class`. The `class: web` label on those two is legacy and feeds ONLY the universal-drop guard; it is
  NOT a skip signal. Never skip screen-list/screen-flow because their class is `web` on a non-web stack.
- `stack-specific` — produced only by a particular stack's extractors (Phase B: crud-matrix, db-objects).

**Universal-drop guard (RT-F1 manifest):** if a profile `skip`s a `universal` artifact while still
`produce`-ing a `web` artifact, the orchestrator emits `[WARN] universal_artifact_dropped` (advisory).

## Screen source & conditional production (v21.0.0)

Screens are no longer a web-only concept. A desktop stack (Delphi/VCL) has screens too — they are
`.dfm` TForm units, not routed views. The `screen_source` field unifies this: it names the stack's
screen origin, and `screen-list`/`screen-flow` production is gated on it rather than on `class: web`.

**Precedence rule (authoritative — resolves the fail-open flaw of keying on `class`):**

- `screen_source == "none"` → `screen-list` AND `screen-flow` are **skipped**, *regardless* of their
  `artifact_map.action`. A headless backend (oracle-plsql) never fabricates a screen artifact.
- `screen_source != "none"` → `screen-list` AND `screen-flow` are **produced**, sourced as declared:
  - `"route-view"` → the existing web path (routes → view components, `route-list` digest).
  - `"dfm-form"` → the Delphi path (`.dfm` TForm units + `_digest_extract_form_nav.json`).

`screen_source` wins over `artifact_map` **only for these two artifacts**. Every other artifact —
including `route-list` and `api-map` — is still governed solely by `artifact_map.action` (web-only,
unchanged). The `produce()` helper in `pipeline-dispatch-and-gates.md` is the single implementation
of this rule.

**Self-consistency rule (v21.0.0):** a profile that sets `screen_source != "none"` MUST ALSO map
`screen-list`/`screen-flow` to `action: "produce"` in its `artifact_map`, so the file reads truthfully
(`delphi-vcl.json` does this). The `screen_source` override means leaving them `skip` is *technically*
harmless — the override flips them on regardless — but a `skip` entry alongside a non-`none`
`screen_source` is a footgun: it reads as "off" to anyone (or any orchestrator) inspecting the profile.
Keep the two in agreement.

Per-profile values:

| Profile | `screen_source` | Effect |
|---------|-----------------|--------|
| `web-js-ts` | `route-view` | screen-list/flow produced from routed views (unchanged) |
| `delphi-vcl` | `dfm-form` | screen-list/flow produced from `.dfm` TForms + form-nav digest (NEW) |
| `oracle-plsql` | `none` | screen-list/flow skipped; logic surfaces in behavior-logic/feature-list |
| `generic-source` | `none` | no reliable screen source → screen-list/flow skipped |

## `detect_stack_profile.py` output contract

```json
{
  "schema_version": "22.0.0",
  "root": "/abs/path",
  "matched": [{ "id": "delphi-vcl", "hits": 812, "confidence": 0.71 }],
  "recommended_profile": "delphi-vcl",
  "confidence": 0.71,
  "encoding": "shift_jis",
  "detected_language_heading": "Delphi/VCL",
  "components": [{ "path": "PG/POS", "profile": "delphi-vcl", "role": "service", "group": null }],
  "component_profile": "delphi-vcl",
  "auto_switch": true,
  "auto_switch_reason": "20 components, component_profile=delphi-vcl one-spec-per-unit",
  "shared": [{ "path": "PG/Common", "kind": "source", "label": "Common" },
             { "path": "DB", "kind": "db", "label": "DB" }],
  "warnings": []
}
```

- **`component_profile`** (v22.0.0) is the COMPONENT-owning profile: a matched profile whose
  `module_layout == "one-spec-per-unit"` that claims ≥2 component roots via its `component_boundary_globs`.
  It is keyed SEPARATELY from `recommended_profile` (which is the raw hit-count winner) precisely so a
  DB-heavy Delphi repo whose raw hits make `oracle-plsql` the `recommended` profile still resolves
  `component_profile=delphi-vcl` (Finding 2). `null` when no profile owns ≥2 roots (single/monolithic repo).
- **`auto_switch`** / **`auto_switch_reason`** (v22.0.0): `true` iff a `component_profile` exists AND `--mono`
  is not set. The orchestrator (SKILL.md Preflight 2.5) acts on it — printing `[INFO] multi-component
  detected` and entering the `--emit-manifest`→`--batch`→`--aggregate` loop — UNLESS the user passed an
  explicit `--root <subrepo>` or `.rebuild-components.json` already exists. Detection-only: `detect()` reports.
- **`shared`** (v22.0.0): the shared-layer dirs declared by `component_profile.shared_layer_dirs` —
  `[{path, kind, label}]`, `kind ∈ {"db","source"}` routing the Step-0.4 pre-pass extractor. On
  `--emit-manifest` this is written to the SIDECAR `.rebuild-components-shared.json` (the component
  manifest stays a JSON array — Finding 1). `[]` when no `component_profile`.

- `recommended_profile` (single) is the **stable Phase A contract** — the preflight caller reads it.
  Phase D **adds** a `components: [{path, profile, role, group}]` field **alongside** it (additive, RT2-F4);
  Phase D must never remove or repurpose `recommended_profile`.
  - `role` (RT2-F4b) is `"frontend"` | `"backend"` | `"service"`, classified from the component's manifest
    CONTENT (profiles are too coarse to carry it — one `web-js-ts` matches a Nuxt FE and a Laravel BE alike).
    A server-side language manifest (composer/go/pom/gradle/Gemfile, or a web-framework pyproject) outranks a
    co-located `package.json`; a standalone `package.json` is classed by its declared dependencies.
  - `group` (RT2-F4b) is the relative path of a **named wrapper** (not a conventional container dir) that
    holds ≥2 complementary build units (≥1 frontend AND ≥1 backend) and has no root manifest — the signature
    of one product split into FE+BE units (`null` for ungrouped/peer components). It is advisory: the
    detector surfaces the grouping and a matching `component_group:` warning, but never merges components.
- `matched` is sorted by `hits` descending; `recommended_profile` is `matched[0].id` (or `null` when
  nothing matched). Multiple entries → the orchestrator keeps the `[MULTI_STACK]` annotation.
- `warnings` may include `file_cap_reached` (RT-F6 — walk stopped at the cap, result is partial),
  `encoding_unverified` (RT-F3 — sample round-trip decode failed under `source_encoding.primary`), and
  `component_group:` (RT2-F4b — a co-deployed FE+BE product; the orchestrator runs the Product-group gate).
- **Exit codes:** `exit 0` for **every detection outcome** including no-match (detection is advisory —
  ask-don't-abort lives in the orchestrator). `exit 2` ONLY when a kit profile is corrupt/invalid
  (bad JSON, schema violation, extractor outside the allowlist) — that is a kit bug, not a project
  condition, and is fatal. The orchestrator preflight MUST handle a non-zero exit (no JSON on stdout):
  surface stderr and stop — never silently treat a load failure as no-match.

**Encoding is a per-profile default, not a per-repo fact.** `delphi-vcl.json` ships
`source_encoding.primary = "shift_jis"` because the profile targets Japanese ERP Delphi codebases
(the originating use case). A Western Delphi repo (CP1252/UTF-8) will fail the round-trip smoke-check
and surface `encoding_unverified` — that is the signal to override encoding at the extractor layer
(Phase B `decode_source`), not a hard error. Encoding is advisory in Phase A by design (RT-F3).

## generic-source fallback

`generic-source.json` is the non-interactive / "treat as generic" fallback (RT-F13): every artifact
is `class: universal` with `action: produce`, `extractors: []`, and all web/stack-specific artifacts
skipped. It produces universal docs only — zero extractor, zero web assumption.
