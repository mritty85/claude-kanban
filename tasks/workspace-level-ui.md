# Workspace-Level UI

## Id
task_1771104801506

## Status
planning

## Tags
- new-functionality

## Description
Add a workspace home view as the app's landing page, showing all registered projects organized by lifecycle stage in a kanban-style board. This replaces the current "drop straight into a single project board" flow with a two-tier navigation: **Workspace → Project Board**.

The prototype is at `style-guide/workspace-prototype.html`. The design uses the same visual language as the existing board (dark theme, Instrument Sans display / Source Code Pro body fonts, card-based layout) but operates at the project level rather than the task level.

### What the Workspace View Shows

**Header:** "Workspace" title, current date, "Register Project" button (opens existing project-add flow).

**Summary Strip:** A row of stats — total project count, plus counts per lifecycle stage (e.g., "2 Prototyping", "1 Beta", "1 Production"). Styled as a segmented bar with stage-colored values.

**Recent Activity Feed:** A chronological list of recent task movements across all projects. Each entry shows: task title, action (moved/created/completed), project name, and relative time. This requires a new backend capability — the server currently only watches the active project's tasks directory.

**Project Lifecycle Board:** A horizontal kanban of lifecycle stage columns:
- **Prototyping** (violet `#a78bfa`)
- **Proof of Concept** (blue `#6380f5`)
- **Beta Development** (amber `#f59e0b`)
- **Production Dev** (green `#10b981`)
- **Launched / Archived** (grey `#525b70`)

Each column contains project cards. Cards show: colored icon (first letter of name), project name, filesystem path, and an inline-editable notes field. The currently-active project gets a highlighted border and "Current" badge.

### How It Fits Into the Existing Architecture

**Current state (no routing):**
- `App.tsx` renders `<KanbanBoard />` directly
- `ProjectSwitcher.tsx` dropdown in header handles project switching
- `useProjects` hook manages project list state

**Target state (view-based navigation):**
- `App.tsx` manages a `view` state: `'workspace' | 'board'`
- Landing on the app shows the workspace home
- Clicking a project card in workspace → switches to that project board (calls existing `switchToProject`) and sets view to `'board'`
- Board header gets a back/home button → returns to workspace view
- No client-side router needed — a simple state toggle is sufficient since there are only two views

### Data Model Changes

The `Project` interface (`src/types/task.ts`) needs two new optional fields:

```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  lastAccessed: string;
  boardName?: string;
  lifecycleStage?: LifecycleStage;  // NEW
  summary?: string;                  // NEW — short one-liner for workspace card
}
```

New type:
```typescript
export type LifecycleStage = 'prototype' | 'poc' | 'beta' | 'production' | 'launched';
```

These fields live in `~/.kanban-ui/config.json` per-project entry (not in per-project `project.json`, since lifecycle stage is a workspace-level concept).

> **Note:** `summary` is a short one-liner description shown on workspace project cards. This is distinct from `documentation/notes.md`, which is the full project notes panel. The naming avoids collision with the documentation-level notes.

### Backend Changes

**`configService.js`:**
- `updateProject()` already accepts arbitrary updates — just needs `lifecycleStage` and `summary` to be persisted in the project entry within `config.json`
- Default `lifecycleStage` to `'prototype'` for existing projects that don't have one

**`server/routes/projects.js`:**
- `PUT /api/projects/:id` already calls `updateProject()` — may need to skip the `boardName` sync logic when only `lifecycleStage` or `summary` are being updated. Note: after the template restructure task, `project.json` lives at the project root — the sync logic will already have been updated to use that path

**Cross-project activity (stretch / optional for v1):**
- New endpoint: `GET /api/workspace/activity` — reads recent task files across all registered projects, sorted by modification time
- This is the hardest backend piece. A simpler v1 could skip the activity feed entirely or show only the current project's recent tasks
- Would need to temporarily read each project's `{projectPath}/tasks/` directory without switching the active project (path convention is stable post-template restructure)

**Project task summary (optional for v1):**
- New endpoint: `GET /api/workspace/summary` — returns task counts per status per project
- Could be used to show a tiny progress bar or "3 implementing, 1 in UAT" subtitle on each project card

### Frontend Components to Create

| Component | Purpose |
|-----------|---------|
| `WorkspaceHome.tsx` | Top-level workspace view container |
| `WorkspaceSummary.tsx` | Summary strip showing project counts by stage |
| `WorkspaceBoard.tsx` | Lifecycle stage columns with project cards |
| `ProjectCard.tsx` | Card for a single project (icon, name, path, summary) |
| `ActivityFeed.tsx` | Recent cross-project activity list (optional v1) |

### Frontend Components to Modify

| Component | Change |
|-----------|--------|
| `App.tsx` | Add view state (`workspace` / `board`), render either `WorkspaceHome` or `KanbanBoard` |
| `KanbanBoard.tsx` | Add back/home button in header to return to workspace |
| `useProjects.ts` | Add `updateProjectStage()` and `updateProjectSummary()` methods |
| `src/types/task.ts` | Add `LifecycleStage` type, extend `Project` interface |
| `src/lib/api.ts` | Add API calls for new endpoints if any |

### Design Tokens

The prototype uses a slightly different color palette than the existing app. The workspace view should adopt the existing app's CSS variables (`--color-bg-base`, `--color-bg-surface`, etc.) rather than the prototype's hardcoded values. The lifecycle stage colors are new and should be added to `src/index.css`:

```css
--color-stage-prototype: #a78bfa;
--color-stage-poc: #6380f5;
--color-stage-beta: #f59e0b;
--color-stage-production: #10b981;
--color-stage-launched: #525b70;
```

### Keyboard Navigation (Optional for v1)

The prototype includes arrow-key navigation across columns and cards, plus `N` to create new project and `Enter` to open a board. This mirrors the existing board's drag-and-drop interaction model but at the project level. Can be deferred to a follow-up.

## Acceptance Criteria
- [ ] App launches to a workspace home view showing all registered projects
- [ ] Projects are displayed in lifecycle stage columns (Prototyping → PoC → Beta → Production → Launched)
- [ ] Summary strip shows total project count and per-stage counts
- [ ] Clicking a project card navigates to that project's task board
- [ ] Board header has a back button that returns to workspace view
- [ ] Project lifecycle stage can be set (e.g., via dropdown on card or drag between columns)
- [ ] `lifecycleStage` field persists in `~/.kanban-ui/config.json`
- [ ] Projects without a `lifecycleStage` default to "Prototyping" column
- [ ] Current/active project is visually highlighted with accent border
- [ ] "Register Project" button in workspace header opens project creation flow (uses full template scaffolding from template restructure task)
- [ ] Project cards show: icon (first letter), name, path, summary
- [ ] Project summary is inline-editable (click to edit, blur/Enter to save)
- [ ] Design matches existing app's dark theme, fonts, and spacing conventions

## Notes
**Depends on:** `update-project-template-deployment.md` — the template restructure task must be completed first. That task moves `project.json` to the project root, establishes the `documentation/` folder convention, and adds the new project scaffolding logic that this task's "Register Project" flow will use.

**Reference:** `style-guide/workspace-prototype.html` — static HTML prototype of the workspace view.

**Phasing recommendation:** Ship in two passes:
1. **Core:** Workspace view with lifecycle columns, project cards, navigation between views, lifecycle stage CRUD. This is self-contained and useful.
2. **Polish:** Cross-project activity feed, project task summary counts, keyboard navigation, drag-to-reorder projects between lifecycle columns.

**No router needed:** The app has exactly two views (workspace / board). A `useState<'workspace' | 'board'>` in `App.tsx` with conditional rendering is simpler than introducing react-router. If more views are added later, a router can be introduced then.

**Existing project management UX:** The `ProjectsModal.tsx` and `ProjectSwitcher.tsx` components handle project CRUD and switching today. The workspace view effectively replaces `ProjectSwitcher` as the primary project-selection mechanism, but the switcher could remain in the board header as a quick-switch shortcut. `ProjectsModal` could be folded into the workspace view or kept as-is for the "Register Project" flow.

**Naming clarity:** `summary` (workspace card one-liner) vs `documentation/notes.md` (full project notes panel) — these are intentionally different fields to avoid confusion. Summary lives in `config.json`, notes live on the filesystem.
