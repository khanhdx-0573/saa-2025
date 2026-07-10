---
title: "Send Kudos (Viết Kudo)"
description: "Compose modal + hashtag picker + Supabase schema for peer-to-peer kudos"
status: completed
priority: P2
effort: 3-4d
tags: [supabase, database, kudos, momorph, rich-text]
blockedBy: []
blocks: []
work_type: feature
spec: docs/features/F001_SendKudos/
created: 2026-07-09
---

# Send Kudos (Viết Kudo)

## Overview

Implements the "Viết Kudo" compose flow: an authenticated user picks one recipient, writes
formatted thank-you content (with @mention), tags 1-5 hashtags from a managed list (via the
"Dropdown list hashtag" screen), optionally attaches up to 5 images, and can send anonymously
(no identity persisted). Ships the Supabase schema (profiles sync, hashtags, kudos + join
tables, storage bucket), the two MoMorph screens as React components, and a minimal `/kudos`
entry page. Full requirements: [`spec/send-kudos/technical-spec.md`](./spec/send-kudos/technical-spec.md).

MoMorph refs:
- Viết Kudo (compose modal): https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Dropdown list hashtag: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/p9zO-c4a4x

## Key Decisions (locked — see spec `## Assumptions` / clarification session)

1. Rich-text editor: adds `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
   `@tiptap/extension-mention` as new dependencies (approved exception to the no-new-deps rule).
2. Hashtags: selection-only from a managed `hashtags` table — no free-text creation.
3. Entry point: new minimal `/kudos` page with just the "Viết Kudo" trigger button (no feed yet).
4. New `public.profiles` table, trigger-synced from `auth.users`, is the Sunners directory.
5. Anonymous kudos: `sender_id` is NULL at write time — no real identity persisted, no audit trail.
6. New public Supabase Storage bucket `kudos-images`, authenticated upload, 5MB/file cap, jpg/png only.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Database Schema & Supabase Setup](./phase-01-database-schema-supabase-setup.md) | Completed |
| 2 | [Backend Data Layer](./phase-02-backend-data-layer.md) | Completed |
| 3 | [Hashtag Picker Component](./phase-03-hashtag-picker-component.md) | Completed |
| 4 | [Write Kudos Modal](./phase-04-write-kudos-modal.md) | Completed |
| 5 | [Kudos Entry Page & i18n](./phase-05-kudos-entry-page-i18n.md) | Completed |
| 6 | [Testing & Validation](./phase-06-testing-validation.md) | Completed |

## Dependencies

<!-- Cross-plan dependencies -->
