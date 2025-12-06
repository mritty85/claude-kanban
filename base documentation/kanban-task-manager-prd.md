# PRD: Local Kanban Task Manager for Claude Code

## Overview

A single-user, file-based kanban board that serves as a task queue for Claude Code. The frontend provides visibility and task management while Claude Code operates on the same markdown files autonomously.

The filesystem is the shared state—the UI and Claude Code never communicate directly.

---

## Architecture

```
/project-root
  /kanban-ui              ← React app (your visibility layer)
  /tasks
    /ideation
    /backlog
    /ready
    /in-progress
    /uat
    /done
  claude-instructions.md  ← Standard prompt for Claude Code
```

**Two independent components:**

1. **Kanban UI** — Local React/Vite app for viewing and managing tasks
2. **Claude Code** — Picks up tasks from `/tasks/ready`, works through them, moves them through stages

---

## Workflow Stages

| Column | Purpose | Who Interacts |
|--------|---------|---------------|
| **Ideation** | Rough ideas, drafts, not yet fully defined | You only |
| **Backlog** | Defined tasks, not yet prioritized for work | You only |
| **Ready** | Prioritized and ready for Claude Code to pick up | You write, Claude reads |
| **In Progress** | Currently being worked on | Claude moves here and works |
| **UAT** | Complete, awaiting your review/acceptance | Claude moves here when done |
| **Done** | Accepted and finished | You move here after review |

---

## Priority & Ordering

- **Vertical stacking** within each column determines priority
- **Top = highest priority**
- Claude Code always picks the **top item in `/tasks/ready`**
- Files use numeric prefixes to persist order: `01-user-auth.md`, `02-dashboard-layout.md`
- When tasks are reordered via drag-and-drop, files are renamed to reflect new order

---

## Task File Schema

All task types use the same format:

```markdown
# {Title}

## Status
ideation | backlog | ready | in-progress | uat | done

## Tags
- new-functionality
- feature-enhancement
- bug
- refactor

## Description
{Freeform description of what needs to happen}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two
- [ ] Criterion three

## Notes
{Claude Code appends notes here if stuck, blocked, or to document decisions made during implementation}
```

### File Naming Convention

`{priority-number}-{slug}.md`

Examples:
- `01-user-auth.md`
- `02-dashboard-layout.md`
- `03-fix-nav-bug.md`

The numeric prefix determines sort order within the column. When you reference a task for Claude Code, use the full filename: `"Claude, 01-user-auth.md is ready for you to begin."`

---

## UI Requirements

### Task Creation & Editing

- **Form-based creation**: UI form generates `.md` file in the correct directory
- **Form-based editing**: Click into a task to edit via form
- **Manual file sync**: If a `.md` file is created manually in the correct directory, it should appear in the UI automatically

### Display

- **6-column horizontal kanban layout**: Ideation → Backlog → Ready → In Progress → UAT → Done
- **Vertical card stacking**: Top = highest priority
- **Card preview**: 
  - Title
  - Tags (as pills/badges)
  - Truncated description with "read more" or click to expand
- **Drag-and-drop**: 
  - Reorder within column (updates priority/file prefix)
  - Move between columns (moves file to new directory, updates status field)

### Navigation & Filtering

- **Filter by tag/label**: Toggle to show only specific tag types
- **Search by title**: String match against task titles
- **Dark mode**: Default (no toggle needed, but toggle is fine if simpler to implement)

### Scope

- **Single user**: No authentication required

---

## Claude Code Behavior

When prompted to work on tasks, Claude Code should:

1. **Read** the top file in `/tasks/ready/` (lowest numeric prefix)
2. **Move** the file to `/tasks/in-progress/`
3. **Update** the `## Status` field to `in-progress`
4. **Implement** the work described in the task
5. **Check off** acceptance criteria as completed
6. **Append to Notes** if any decisions are made or issues encountered
7. **Move** the file to `/tasks/uat/` when complete
8. **Update** the `## Status` field to `uat`
9. **Check** for the next task in `/tasks/ready/`

### Handling Blockers

If Claude Code is blocked or needs clarification:
- Update the `## Notes` section with the blocker/question
- Leave the task in its current state
- Stop and wait for guidance

---

## Template Usage

This kanban system is designed to be **reusable across projects**:

1. Keep a clean template copy at `~/templates/kanban/`
2. Copy into any new project: `cp -r ~/templates/kanban ./kanban`
3. Tasks are project-specific; the UI and structure are reusable
4. Improvements to the template flow back for future projects

---

## Technical Notes

### Suggested Stack

- **Frontend**: Vite + React
- **Markdown parsing**: `gray-matter` (for frontmatter) or simple regex
- **File watching**: `chokidar` or polling for file changes
- **Drag-and-drop**: `@dnd-kit/core` or `react-beautiful-dnd`
- **Styling**: Tailwind CSS (dark mode default)

### File Watching Behavior

The UI should detect:
- New files added to any `/tasks/{status}/` directory
- Files moved between directories
- File content changes
- Files deleted

### Reordering Logic

When a card is dragged to a new position within a column:
1. Determine new order of all files in that column
2. Rename files with updated numeric prefixes (`01-`, `02-`, `03-`, etc.)
3. UI reflects new order on next read

---

## Out of Scope (v1)

- Multi-user / authentication
- Cloud sync
- Notifications
- Time tracking / estimates
- Dependencies between tasks
- Multiple task templates

---

## Success Criteria

- [ ] UI renders all 6 columns with cards from filesystem
- [ ] Can create new task via form → generates `.md` file
- [ ] Can edit existing task via form → updates `.md` file
- [ ] Drag-and-drop reorders within column (renames files)
- [ ] Drag-and-drop moves between columns (moves file, updates status)
- [ ] Filter by tag works
- [ ] Search by title works
- [ ] Dark mode is default
- [ ] Manually created `.md` files appear in UI
- [ ] Claude Code can read top task from `/ready`, work on it, and move to `/uat`
