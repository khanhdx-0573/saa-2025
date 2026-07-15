# Phase 05 — Banner + compose entry pill (Track A)

**Goal:** Build the top-of-board banner (A) and restyle the compose trigger into the pill-shaped input bar
(A.1) that opens the EXISTING F001 `KudosModal` unchanged. No intra-track deps; no Track B link.

**Screen refs:** A (`2940:13437` KV Kudos banner), A.1 (`2940:13449` pill input, placeholder "Hôm nay, bạn
muốn gửi lời cảm ơn và ghi nhận đến ai?", pencil icon left).

**Owns / creates (in `components/kudos/`):** `kudos-banner.tsx` (readonly hero), `compose-entry-bar.tsx` (pill
input; onClick opens `KudosModal`, reused as-is; holds its own modal open state OR exposes `onCompose`).

**Integration contract:** `<ComposeEntryBar />` self-contains the `KudosModal` mount + open state (mirrors the
current `kudos-page-client.tsx` pattern). Integration just places `<KudosBanner/>` + `<ComposeEntryBar/>` at
the top of the board shell.

**Out of scope:** modifying `KudosModal` or any F001 compose component (reuse only). i18n catalog entries
(Integration migrates the placeholder string). Mock/Figma copy used during build.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
