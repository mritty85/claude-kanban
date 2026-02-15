# Kanban UI - Claude Code Context

## Project Overview

A local, file-based Kanban task manager built with React + Vite + TypeScript. The UI reads/writes markdown task files from the filesystem, providing visibility into work that can also be managed by Claude Code autonomously.

**Key Concept:** The filesystem (`/tasks` directory) is the shared state—the UI and Claude Code never communicate directly.

**Current State:** Fully functional multi-project Kanban with drag-and-drop, task CRUD, project switching, and real-time updates via SSE.

## Task Management

This project uses its own file-based Kanban system for task management and enhancing the app.

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

```markdown
# {Title}

## Id
task_1734523687000

## Status
planning

## Tags
- new-functionality | feature-enhancement | bug | refactor

## Description
{What needs to be done}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two

## Notes
{Implementation notes}
```
------

## Multi-Project Architecture

This Kanban tool is designed as a **centralized installation** that manages multiple projects:

```
~/.kanban-ui/
  config.json                 <- Global config (machine-specific)
                                 Stores: registered projects, current project ID

~/tools/kanban-ui/            <- Single installation (this codebase)
  /src/                       <- React frontend
  /server/                    <- Express backend

/project-a/                   <- Any registered project
  /tasks/
    _board.json               <- Column ordering (all statuses)
    project.json              <- Per-project config (board name)
    some-task.md              <- Tasks live here (flat)
    another-task.md

/project-b/                   <- Another registered project
  /tasks/
    ...
```

### How It Works

1. **Global Config (`~/.kanban-ui/config.json`):**
   - Stores list of registered projects with `{id, name, path, lastAccessed}`
   - Tracks `currentProject` (the active project path)
   - Machine-specific—not shared via git

2. **Per-Project Config (`{project}/tasks/project.json`):**
   - Stores `boardName` displayed in header
   - Stores `launchConfigs` array for terminal launch commands
   - Can be git-tracked with the project

3. **Project Switching:**
   - User clicks dropdown -> selects project
   - Backend updates `currentProject` in global config
   - File watcher reinitializes to watch new project's `/tasks`
   - SSE broadcasts `project-switched` event
   - Frontend reloads tasks

### Key Files for Multi-Project

| File | Purpose |
|------|---------|
| `server/services/configService.js` | CRUD for `~/.kanban-ui/config.json` |
| `server/routes/projects.js` | REST API for project management |
| `src/hooks/useProjects.ts` | Frontend state for projects |
| `src/components/ProjectSwitcher.tsx` | Dropdown in header |
| `src/components/ProjectsModal.tsx` | Full project management UI |

### Key Files for Launch Terminal

| File | Purpose |
|------|---------|
| `server/routes/launch.js` | REST API for launch configs + spawn endpoint |
| `server/services/fileService.js` | `getLaunchConfigs()`, `addLaunchConfig()`, etc. |
| `src/components/LaunchModal.tsx` | Modal for viewing/managing launch configs |
| `src/lib/api.ts` | `fetchLaunchConfigs()`, `launchTerminal()`, etc. |
| `src/types/task.ts` | `LaunchConfig`, `LaunchConfigFormData` types |

**Launch Config Schema (in project.json):**
```json
{
  "launchConfigs": [
    { "id": "lc_timestamp", "name": "Dev Server", "command": "npm run dev", "workingDir": "kanban-ui" }
  ]
}
```
- `workingDir` is optional - relative to project root or absolute path

**Ghostty Spawn Notes:**
- Commands wrapped in `/bin/bash -c '...'` to handle compound commands (`cd && ...`)
- Opens new window (macOS limitation - no CLI for "open as tab")

## Frontend Architecture

### Component Hierarchy
```
App.tsx
└── KanbanBoard.tsx           <- Main container, drag-and-drop context
    ├── ProjectSwitcher.tsx   <- Header dropdown for switching projects
    ├── SearchBar.tsx         <- Task title search
    ├── FilterDropdown.tsx    <- Filter by tags
    ├── Column.tsx            <- Droppable column (one per status)
    │   └── Card.tsx          <- Draggable task card (sortable)
    ├── TaskPanel.tsx         <- Slide-out panel for create/edit task
    ├── ProjectsModal.tsx     <- Manage projects (add/remove/rename)
    └── LaunchModal.tsx       <- Terminal launch configs (spawn Ghostty)
```

### State Management
- **`useTasks` hook:** Task CRUD, SSE subscription, optimistic updates
- **`useProjects` hook:** Project list, current project, switching
- **No global state library**—React hooks + prop drilling

### Styling
- Tailwind CSS v4 with `@theme` directive in `src/index.css`
- Dark mode only
- CSS variables for colors (`--color-bg-base`, `--color-text-primary`, etc.)
- JetBrains Mono font

## Backend Architecture

### Service Layer
```
server/
├── index.js                  <- Express app setup, startup
├── routes/
│   ├── tasks.js              <- Task CRUD endpoints
│   ├── projects.js           <- Project management endpoints
│   └── launch.js             <- Terminal launch endpoints
└── services/
    ├── configService.js      <- Global config (~/.kanban-ui/)
    ├── fileService.js        <- Task file operations + launch configs
    └── watcher.js            <- Chokidar + SSE broadcasting
```

### Data Flow
1. **Task operations:** API -> `fileService.js` -> filesystem
2. **File changes:** `chokidar` detects -> `watcher.js` broadcasts SSE
3. **Frontend:** SSE listener -> triggers `loadTasks()` refresh
4. **Project switch:** Update config -> reinit watcher -> broadcast SSE

### Key Functions

**`configService.js`:**
- `ensureGlobalConfig()` - Creates default config on first run
- `getCurrentProjectPath()` - Returns active project's path
- `setCurrentProject(id)` - Switches active project
- `addProject(name, path)` - Registers new project
- `validateProjectPath(path, createIfMissing)` - Checks/creates tasks folder

**`fileService.js`:**
- `getTasksDir()` - Async, reads from current project config
- `getAllTasks()` - Reads all tasks from flat /tasks/, auto-migrates old structure
- `parseTaskFile(content, filename)` - Markdown -> task object (extracts stable ID and status)
- `serializeTask(task)` - Task object -> markdown (includes ID and Status sections)
- `generateTaskId()` - Creates timestamp-based unique ID
- `generateSlug(title, existingFiles)` - Creates filename with deduplication
- `readBoardFile(tasksDir)` / `writeBoardFile(tasksDir, data)` - Manage column ordering
- `moveTask(filename, toStatus, position)` - Updates status in file and _board.json
- `reorderTasks(status, orderedIds)` - Updates _board.json only
- `getLaunchConfigs()` - Returns launchConfigs array from project.json
- `addLaunchConfig(data)` - Adds new launch config with generated ID
- `updateLaunchConfig(id, updates)` - Updates existing launch config
- `deleteLaunchConfig(id)` - Removes launch config by ID

**`watcher.js`:**
- `initWatcher()` - Sets up chokidar on current project (depth: 0 for flat structure)
- `switchProject(id)` - Closes old watcher, inits new, broadcasts event
- `broadcastToClients(msg)` - Sends SSE to all connected clients

## API Reference

### Tasks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | List all tasks for current project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:filename` | Update task |
| POST | `/api/tasks/move` | Move task between columns |
| POST | `/api/tasks/reorder` | Reorder within column |
| DELETE | `/api/tasks/:filename` | Delete task |
| GET | `/api/tasks/events` | SSE stream |
| GET | `/api/tasks/config` | Get project.json |
| PUT | `/api/tasks/config` | Update project.json |

### Projects
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List all registered projects |
| GET | `/api/projects/current` | Get current project with boardName |
| POST | `/api/projects` | Add new project |
| PUT | `/api/projects/:id` | Update project (name syncs to boardName) |
| DELETE | `/api/projects/:id` | Remove project from registry |
| POST | `/api/projects/:id/switch` | Switch to project |
| POST | `/api/projects/validate-path` | Check if path is valid |

### Launch Terminal
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/launch/configs` | List launch configs for current project |
| POST | `/api/launch/configs` | Add new launch config |
| PUT | `/api/launch/configs/:id` | Update launch config |
| DELETE | `/api/launch/configs/:id` | Delete launch config |
| POST | `/api/launch/:id` | Spawn Ghostty terminal with config command |

## Task File Format

```markdown
# {Title}

## Id
task_1734523687000

## Status
ideation | planning | backlog | implementing | uat | done

## Tags
- new-functionality
- feature-enhancement
- bug
- refactor
- devops

## Description
{Freeform description}

## Acceptance Criteria
- [ ] Criterion one
- [x] Completed criterion

## Notes
{Implementation notes, blockers, decisions}
```

**File Naming:** `{slug}.md` (e.g., `user-auth.md`)
- All tasks live in `/tasks/` directory (flat structure)
- Filenames are stable once created (no renaming on reorder/move)
- Task ID stored in markdown is the unique identifier
- Status is determined by `## Status` field, not folder location

**Column Ordering:** `/tasks/_board.json`:
```json
{
  "columns": {
    "ideation": ["task_123", "task_456"],
    "planning": ["task_789"],
    "backlog": [],
    "implementing": [],
    "uat": [],
    "done": ["task_001", "task_002"]
  }
}
```
- Order determined by position in array (first = highest priority)
- Tasks not in _board.json appear at TOP of their column (newest first)
- Claude only needs to edit the task file's `## Status` to move tasks

## Configuration

### Ports
- **Vite:** `5190` (configured in `vite.config.ts`)
- **Express:** `3050` (configured in `server/index.js`)
- Chosen to avoid conflicts with typical dev servers (3000, 5173)

### Environment Variables
- `PORT` - Override Express port (default: 3050)
- `TASKS_DIR` - Only used for initial migration on first run

## Common Development Tasks

### Adding a new tag type
1. Add to `TaskTag` type in `src/types/task.ts`
2. Add label to `TAG_LABELS` in same file
3. Add color styles to `src/components/Tag.tsx` (`tagStyles` object)
4. Add color styles to `src/components/FilterDropdown.tsx` (`tagStyles` object)
5. Add color styles to `src/components/TaskPanel.tsx` (`tagStyles` object)

### Adding a new status column
1. Add to `TaskStatus` type in `src/types/task.ts`
2. Add label to `STATUS_LABELS` in same file
3. Add to `STATUSES` array in same file
4. Update `STATUSES` array in `server/services/fileService.js`
5. Update `STATUSES` array in `server/services/configService.js`

### Modifying task form fields
1. Update `TaskFormData` type in `src/types/task.ts`
2. Add form fields in `src/components/TaskPanel.tsx`
3. Update `parseTaskFile()` in `server/services/fileService.js`
4. Update `serializeTask()` in `server/services/fileService.js`

### Adding a new project API endpoint
1. Add route in `server/routes/projects.js`
2. Add service function in `server/services/configService.js` if needed
3. Add API function in `src/lib/api.ts`
4. Use in `src/hooks/useProjects.ts`

## Dependencies

**Frontend:**
- `react`, `react-dom` - UI framework
- `tailwindcss`, `@tailwindcss/vite` - Styling
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` - Drag-and-drop
- `lucide-react` - Icons

**Backend:**
- `express` - API server
- `cors` - Cross-origin requests
- `chokidar` - File system watcher
- `gray-matter` - Markdown parsing (available but not currently used)
- `concurrently` - Run Vite + Express together

## Known Limitations

- **Single user only** - No authentication
- **No undo/redo** - File operations are immediate
- **No task dependencies** - Tasks are independent
- **No time tracking** - No estimates or logged time
- **Machine-specific project paths** - Must re-register projects on each machine
- **File watcher delay** - May have slight lag on some systems

## Future Enhancement Ideas

- Keyboard shortcuts for common actions
- Task templates
- Bulk operations (multi-select)
- Task search across all projects
- Project grouping/workspaces
- Export/import functionality
- Optional light mode theme
