# Cairn — Design Document

> A cairn marks the path. Each stone a finished task, the stack your progress.

This document is the source of truth for Cairn's identity, design language,
naming, and feature roadmap. Read it before building anything user-facing.

---

## 1. Identity

**Name:** Cairn (kept from upstream — it's good).
**One-liner:** *A calm place for tasks.*
**Mark:** Three white hand-stacked stones on a warm creamy beige rounded
square (`/frontend/public/favicon.svg`, reusable React component at
`components/brand/CairnMark.tsx`). Geometry follows Phosphor's rounded,
friendly language. The stones are deliberately slightly askew — placed by a
human hand, not a machine.

**Voice:** Calm, warm, unhurried. Copy never shouts, never gamifies.
"A blank slate, ready when you are." — that register.

## 2. Design language

The aesthetic is **Gruvbox warmth**: earthy parchment in light mode, cozy
charcoal in dark mode. Think of a well-organized desk by a window, not a
dashboard.

| Layer | Choice | Where |
|---|---|---|
| Palette | Gruvbox, hand-tuned for WCAG-AA | `styles/theme.css` — never hardcode hex in components; use tokens |
| Display type | **Fraunces** (warm, slightly bookish serif) | h1/h2, brand, note headers |
| Body type | Inter 15px base | everything else |
| Mono | JetBrains Mono | ids, counts, kbd hints, dates |
| Texture | `.paper` dotted grid; ruled lines in Quick Notes | main canvas, notebook |
| Shadows | layered warm shadows (`--shadow-*`), never pure black in light mode | cards, floating windows |
| Radius | 0.5rem base; floating windows 0.75rem | everywhere |
| Motion | `motion/react` springs, 300–400 stiffness; one good entrance beats ten micro-wiggles | QuickNotes, dialogs |

**Design lens (from the telos):** the user is an urban planner / landscape
architect. Hierarchy, breathing room, navigability. Human scale beats
density. When in doubt: more whitespace, fewer borders, clearer hierarchy.

## 3. Naming

User-facing language vs. code/API. The API keeps `list` (contract stability);
the UI says **project** everywhere.

| Concept | UI says | API/code says | Notes |
|---|---|---|---|
| Top container | Workspace | workspace | separate task environments (e.g. Work / Private / Verein) |
| Mid container | **Project** | list / TodoList | thumbnail upload planned; subtasks live here |
| Unit | Task | item | |
| Sub-unit | Subtask | (M2) | parent_id self-join on items |
| Capture | Quick note | note tab | floating notebook, cross-project |

A deep rename (API paths `/lists` → `/projects`, table rename) is **deliberately
deferred** — contract churn for zero user value right now. Revisit if/when an
API v2 is warranted.

## 4. Quick Notes (flagship feature)

The problem it solves: intense meetings produce thoughts across *many*
projects at once. Capture must be instant and unstructured; sorting happens
afterwards.

**v1 (shipped):**
- Floating notebook window above the app — draggable, resizable, position
  remembered. Toggle: notebook button in top bar or **⌘/Ctrl+J**.
- Ruled paper with a red margin line; lines scroll with the text
  (`background-attachment: local`).
- Multiple notes as **vertical register tabs** on the right edge, titles
  derived from the first line.
- **Select a passage → "To project…"** → pick project → lands as one task or
  one task per line (leading `-`/`*`/`•` bullets stripped, 250-char labels,
  long single selections keep the full text in the description).
- Persistence: `localStorage` (`cairn.quicknotes.v1`), debounced.

**v2 (roadmap):**
- Backend sync: `notes` table (id, user_id, title, body, updated_at),
  CRUD endpoints, last-write-wins; localStorage becomes the offline cache.
- Attachments & scribbles (files ride the same upload pipeline as project
  thumbnails; scribble = simple canvas → PNG).
- Highlight ranges that were already sent get a subtle strike/tint.
- AI assist: "split this note into tasks" via local Qwen (GEX44) or Claude —
  through the existing AI provider abstraction.

## 5. Feature roadmap (tranches — one at a time, Playwright per tranche)

### M2 — Core parity (in progress)
- ✅ **Subtasks** (shipped 2026-06-06): `parent_id` on items, one level deep, indent UI, n/m chip on parents, DB cascade.
- ✅ **Due-date UX** (shipped 2026-06-06): row chips with overdue tint, date editor in expanded panel. Still open: Today/Upcoming smart views.
- ✅ **Progress rings** (shipped 2026-06-06): per-project completion rings in the sidebar, completed_count in summaries.
- ✅ **Recurring tasks** (shipped 2026-06-06): daily/weekly/monthly/monthly_last, next occurrence spawns on completion with calendar-aware deadline advance.
- ✅ **Manual sort order** (shipped 2026-06-06): `position` float, fractional indexing, grip-drag in list view.
- **M2 is complete** — the tududi migration is unblocked.

### M3 — Views & structure
- ✅ **Kanban** (shipped 2026-06-06): List|Board switcher per project, todo/doing/done columns (items.status, two-way synced with checked), drag between columns.
- **Table view** (sortable columns, inline edit).
- ✅ **Gantt/timeline** (shipped 2026-06-07): day axis, creation→deadline bars, today line, milestone stripes; deadline-less tasks dot on today.
- ✅ **Milestones** (shipped 2026-06-07): name + date + gruvbox color per project, flag-button dialog, stripes in the timeline. Later: attach tasks, milestone progress.
- **Progress tracking**: per-project completion ring in sidebar; per-workspace rollup; tiny burn-down on project header.

### M4 — Media
- **Project thumbnails**: upload/replace/delete. Backend: image upload endpoint, sharp-equivalent (Pillow) thumbnail generation, stored on a local volume (NOT the CIFS storagebox — too slow to serve), backed up via Backrest. Sidebar + project header show them.
- Quick Notes attachments ride the same pipeline.

### M5 — Integrations
- **Telegram bot**: create tasks via message, daily digest (port the tududi workflow).
- **MCP**: already mounted at `/mcp` (15 ops) — wire into MetaMCP, replacing tududi's tools at cutover.
- **AI**: provider-agnostic (local Qwen 3.6 on GEX44 via OpenAI-compatible endpoint, or Claude). Entry points: chat (exists), quick-notes split, NL quick-add.
- **Quick Add Magic** (Vikunja-style NL parsing): `water plants every monday 9am !2 *garden` → structured task. Pure function, unit-tested first.

### M6 — Polish
- Import: tududi (migration script), Todoist/Vikunja JSON.
- PWA manifest + offline shell.
- Email digests (Mailu) — opt-in, the inbox is noisy enough.

## 6. Engineering guardrails

- **Quality > buggy additions. Continuous shrinking.** Delete before adding.
  The MUI dependency cluster is a removal candidate (Radix+shadcn covers it) —
  do it as its own tranche, nothing mixed in.
- API contract changes require a frontend+backend pair commit, deployed
  backend-first.
- Every tranche ships with Playwright coverage of its happy path + one
  destructive path.
- Secrets only in Coolify env vars. The repo is public.
- `DATABASE_URL` uses `postgresql+asyncpg://`. Alembic arrives with the first
  real schema change (M2) — `create_all` until then.
