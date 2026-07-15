# Phase 03 — Shared toast (Track A · shared ui)

**Goal:** A SHARED toast system (`components/ui/toast.tsx`) — provider + `useToast()` + auto-dismiss viewport —
mounted once at the root so any screen can fire "Link copied — ready to share!". Not kudos-scoped (per
AGENTS.md shared-vs-feature).

**Screen refs:** none specific; used by copy-link (Phase 04) and reused board-wide.

**Owns / creates:** `components/ui/toast.tsx`. **Modifies:** `app/layout.tsx` (wrap children in
`<ToastProvider>`). No other Track A phase touches these files.

**Integration contract (consumed by Phase 04+):**
- `useToast(): { show(message: string): void }` — fire-and-forget; auto-dismiss ~3s.
- Provider is client-side, mounted above the page tree in `app/layout.tsx`.
- Toast text passed IN by the caller (string) — the i18n string lookup happens at the call site (Integration),
  so this component holds NO catalog strings.

**Out of scope:** toast variants (error/success styling beyond one style), queueing UX beyond simple stacking,
positioning config. KISS: one style, top/bottom-fixed, stack + auto-dismiss.

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: /home/khanh/sun/aidd/saa-2025/plans/260712-2203-kudos-live-board/clarifications.md
