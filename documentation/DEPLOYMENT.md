# Kanban UI Deployment Guide

## Overview

The Kanban UI is a **centralized tool** that can manage tasks across multiple projects. You install it once, then register any project that has (or needs) a `/tasks` folder.

**Key concepts:**
- **One installation** of kanban-ui serves all your projects
- **Global config** at `~/.kanban-ui/config.json` tracks registered projects (machine-specific)
- **Each project** has its own `/tasks` folder with flat markdown files and a `documentation/` folder
- **Ports:** Vite runs on `5190`, Express API on `3050` (to avoid conflicts with project dev servers)

---

## Quick Start (New Machine Setup)

### 1. Clone the Kanban UI once

```bash
# Clone to a permanent location
git clone <your-kanban-repo> ~/tools/kanban-ui
```

### 2. Install dependencies

```bash
cd ~/tools/kanban-ui/kanban-ui
npm install
```

### 3. Start the server

```bash
npm start
```

This will:
- Create `~/.kanban-ui/config.json` automatically (first run only)
- Register the parent directory as "Default Project"
- Start Vite on `http://localhost:5190`
- Start Express API on `http://localhost:3050`

### 4. Open the UI and add your projects

1. Open `http://localhost:5190` in your browser
2. You'll land on the **Workspace** view showing all registered projects
3. Click **"Register Project"** (top-right) to add projects:
   - **Name:** Human-readable name (e.g., "Budget App")
   - **Path:** Absolute path to project root (e.g., `/Users/you/projects/budget-app`)
   - **Scaffold:** Optionally scaffold the full project template (`tasks/`, `documentation/`, `project.json`)
4. Click a project card to navigate into that project's task board

---

## Adding a New Project

### From the UI (recommended)
1. From the Workspace view, click **"Register Project"**
2. Enter name and absolute path
3. Check **"Scaffold project template"** if the project doesn't have a `tasks/` folder yet
4. Click "Add Project"

### What gets scaffolded
```
/your-project/
  /tasks/
    _board.json             <- Column ordering for all statuses
  /documentation/           <- Project documentation folder
  project.json              <- Per-project config (board name, launch configs)
```

### Task structure (flat)
All task files live directly in `/tasks/` — no subfolders per status:
```
/your-project/
  /tasks/
    _board.json             <- Column ordering (all statuses)
    some-task.md            <- Status is in the file's ## Status field
    another-task.md
    project.json            <- Legacy location (some older projects)
  /documentation/
    DEPLOYMENT.md           <- Project-specific docs
    audit_log.md
    schema.md
    ...
  project.json              <- Per-project config (board name, launch configs)
```

- **Status** is determined by the `## Status` field inside each markdown file, not by folder location
- **Ordering** is managed by `_board.json` (position in array = priority)
- **Filenames** are stable slugs (e.g., `user-auth.md`) — never renamed on reorder/move

---

## Configuration Files

### Global Config: `~/.kanban-ui/config.json`
```json
{
  "currentProject": "/Users/you/projects/budget-app",
  "projects": [
    {
      "id": "budget-app",
      "name": "Budget App",
      "path": "/Users/you/projects/budget-app",
      "lastAccessed": "2026-02-15T12:00:00Z",
      "lifecycleStage": "beta",
      "summary": "Personal budgeting tool with bank sync"
    },
    {
      "id": "website",
      "name": "Company Website",
      "path": "/Users/you/projects/website",
      "lastAccessed": "2026-02-14T10:00:00Z"
    }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `currentProject` | Path of the active project |
| `id` | URL-safe identifier (auto-generated from name) |
| `name` | Display name (syncs to `boardName` in project.json) |
| `path` | Absolute filesystem path to project root |
| `lastAccessed` | ISO timestamp, updated on switch |
| `lifecycleStage` | Workspace column: `prototype`, `poc`, `beta`, `production`, `launched` |
| `summary` | One-liner shown on workspace project card |

- **Machine-specific:** This file is NOT shared between machines
- **Auto-created:** First run creates it with a default project
- **`lifecycleStage` and `summary`** default to empty — projects without a stage appear in "Prototyping"

### Per-Project Config: `{project}/project.json`
```json
{
  "boardName": "Budget App",
  "launchConfigs": [
    {
      "id": "lc_1234567890",
      "name": "Dev Server",
      "command": "npm run dev",
      "workingDir": ""
    }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `boardName` | Displayed in the board header |
| `launchConfigs` | Terminal launch commands (spawns Ghostty windows) |
| `launchConfigs[].workingDir` | Optional — relative to project root, or absolute path |

- **Git-tracked:** This file IS in your project repo
- Lives at the **project root**, not inside `/tasks/`

---

## Workspace View

The app lands on a **Workspace** home page — a lifecycle-stage board showing all registered projects.

### Features
- **Summary strip:** Total project count + per-stage counts
- **Lifecycle board:** 5 columns (Prototyping → PoC → Beta → Production → Launched/Archived)
- **Project cards:** Icon, name, path, inline-editable summary, stage dropdown
- **Active project:** Highlighted with accent border and "Current" badge
- **Theme toggle:** Sun/moon icon in header switches between dark and light mode
- **Navigation:** Click a project card to enter that project's task board

### Lifecycle Stages
| Stage | Color | Description |
|-------|-------|-------------|
| Prototyping | Violet `#a78bfa` | Early exploration, layout/design |
| Proof of Concept | Blue `#6380f5` | Core concept validation |
| Beta Development | Amber `#f59e0b` | Active feature development |
| Production Dev | Green `#10b981` | Hardening, load testing, polish |
| Launched / Archived | Grey `#525b70` | Shipped or no longer active |

Change a project's stage via the dropdown on its card. The stage is stored in `~/.kanban-ui/config.json`.

---

## Multi-Machine Setup

Since `~/.kanban-ui/config.json` is machine-specific, you'll need to re-register projects on each machine.

### What transfers between machines (via git)
- Task files (`/tasks/*.md`, `_board.json`)
- Documentation (`/documentation/*`)
- Project config (`project.json` — board name, launch configs)

### What does NOT transfer (machine-specific)
- `~/.kanban-ui/config.json` (project registry, lifecycle stages, summaries)
- Filesystem paths (differ per machine)

### Steps for a new machine:
1. Clone `kanban-ui` to a permanent location
2. `cd kanban-ui && npm install && npm start`
3. Open `http://localhost:5190`
4. Register each project via "Register Project" — use the paths on THIS machine
5. Set lifecycle stages and summaries as desired (these are per-machine)

### Example
Personal machine:
```
/Users/mritty/projects/budget-app
```

Work machine:
```
/Users/msmith/dev/budget-app
```

Both point to the same git repo, just different local paths. Tasks and documentation sync via git; project registry and lifecycle stages are set up independently per machine.

---

## Project Documents

Each project can have markdown documents in its `documentation/` folder. The Kanban UI detects these automatically and shows them in the sidebar's **Documents** section.

### Document detection
The server scans `{projectRoot}/documentation/` for `.md` files. Each file becomes an entry in the sidebar. Clicking opens a slide-out panel with a markdown editor (auto-saves with 5-second debounce).

### Common documents
- `documentation/DEPLOYMENT.md` — Deployment/setup guide
- `documentation/audit_log.md` — Change log / audit trail
- `documentation/schema.md` — Data schema documentation

Documents can also be edited directly in your editor — changes sync via the file watcher.

---

## Upgrading an Existing Installation

### Quick Upgrade

```bash
cd ~/tools/kanban-ui
git pull && cd kanban-ui && npm install
```

Your `~/.kanban-ui/config.json` and all registered projects remain untouched.

### What Gets Updated vs. What Stays

| Updated (from git) | Preserved (local) |
|--------------------|-------------------|
| `kanban-ui/src/*` | `~/.kanban-ui/config.json` |
| `kanban-ui/server/*` | Each project's `/tasks/*.md` files |
| `package.json` | Each project's `project.json` |
| | Each project's `documentation/*` |

### After Upgrading

1. Restart the server if it was running (`Ctrl+C` then `npm start`)
2. Hard refresh the browser (`Cmd+Shift+R`) to clear cached JS

---

## Configuring Claude Code for Your Project

Add this to your project's `CLAUDE.md`:

```markdown
## Task Management

This project uses a file-based Kanban system for task management.

### Task Location
Tasks are stored as markdown files in the flat `/tasks/` directory:
- All task files live directly in `/tasks/` (no subfolders)
- Status is determined by the `## Status` field in each task file
- Column ordering is managed by `_board.json`

**Status values:** `ideation`, `planning`, `backlog`, `implementing`, `uat`, `done`

### Working on Tasks

When asked to work on tasks:
1. The user will link directly to the file e.g. tasks/example-task-name.md
2. Update the `## Status` field in the task file to `implementing`
3. Plan first, ask clarifying questions, then implement the work described
4. Check off acceptance criteria as completed
5. Add notes to `## Notes` section for any decisions
6. When complete, update the `## Status` field to `uat`

**Important:** Claude only edits task `.md` files. The `_board.json` file is managed by the UI for column ordering.

### Task File Format

` ``markdown
# {Title}

## Id
task_1734523687000

## Status
planning

## Tags
- new-functionality | feature-enhancement | bug | refactor | devops

## Description
{What needs to be done}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two

## Notes
{Implementation notes}
` ``

### Project Documentation

Documentation files live in `/documentation/`:
- Editable in the Kanban UI sidebar (auto-saves)
- Can also be edited directly in your editor
- Read these files for project context when working on tasks
```

---

## Running the Kanban UI

### Development (default)
```bash
cd ~/tools/kanban-ui/kanban-ui
npm start
```
- Vite: `http://localhost:5190`
- API: `http://localhost:3050`

### Custom ports (if needed)
```bash
PORT=4000 npm run server  # API on port 4000
```

Edit `vite.config.ts` to change Vite port and proxy target.

---

## Tips

### Keep the UI Running
Run `npm start` in a terminal while working. The UI auto-updates when task files change (via SSE).

### Manual Task Creation
Create `.md` files directly in `/tasks/`. The UI picks them up automatically via file watching. Status is read from the `## Status` field — no need to place files in specific folders.

### Priority Management
- Drag cards in the UI to reorder (updates `_board.json`, files stay unchanged)
- Filenames are stable slugs (e.g., `user-auth.md`) — no numeric prefixes
- Each task has a unique `## Id` section for identification
- Tasks not listed in `_board.json` appear at the top of their column (newest first)

### Launch Configs
Configure terminal commands in `project.json` (or via the UI's Launch modal). Each config can specify a command and optional working directory. Launches open new Ghostty terminal windows.

### Theme
Toggle between dark and light mode via the sun/moon icon in the Workspace header. Preference is saved in `localStorage`.

---

## Troubleshooting

### "Port already in use"
Another process is using 5190 or 3050. Either:
- Kill the other process: `lsof -i :5190` / `lsof -i :3050`
- Or change ports in `server/index.js` and `vite.config.ts`

### Projects not showing up
Check `~/.kanban-ui/config.json` exists and has valid paths for this machine.

### Tasks not loading
- Verify the project path exists
- Check that `{path}/tasks/` directory exists
- Look at terminal for server errors

### UI not updating
- Check SSE connection (browser dev tools → Network → EventStream)
- Restart the server: `npm start`

### Lifecycle stages reset after clone
This is expected — `lifecycleStage` and `summary` live in `~/.kanban-ui/config.json` (machine-specific). Re-set them on the new machine via the workspace card dropdowns and inline summary editing.
