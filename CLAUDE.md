# Kanban UI - Claude Code Context

## Project Overview

A local, file-based Kanban task manager built with React + Vite + TypeScript. The UI reads/writes markdown task files from the filesystem, providing visibility into work that can also be managed by Claude Code autonomously.

**Key Concept:** The filesystem (`/tasks` directory) is the shared state—the UI and Claude Code never communicate directly.

**Current State:** Fully functional multi-project Kanban with drag-and-drop, task CRUD, project switching, and real-time updates via SSE.

## Task Management

This project uses its own file-based Kanban system for task management and enhancing the app.

### Task Location
Tasks are stored as markdown files in `/tasks/{status}/` directories:
- `/tasks/ideation/` - Rough ideas, not yet defined
- `/tasks/planning/` - Needs design/discussion before ready
- `/tasks/backlog/` - Fully planned and ready to be picked up
- `/tasks/implementing/` - Currently being worked on
- `/tasks/uat/` - Complete, awaiting review
- `/tasks/done/` - Accepted and finished

### Working on Tasks

When asked to work on tasks:
1. Check the `_order.json` file in `/tasks/backlog/` to see task priority order
2. Read the first task ID from the order, then find and read the corresponding `.md` file
3. Move the file to `/tasks/implementing/` (keep the same filename)
4. Update the `## Status` field to `implementing`
5. Update the `_order.json` files (remove from source, add to destination)
6. Implement the work described
7. Check off acceptance criteria as completed
8. Add notes to `## Notes` section for any decisions
9. When complete, move file to `/tasks/uat/`
10. Update the `## Status` field to `uat`
11. Update the `_order.json` files accordingly

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
------

## Multi-Project Architecture

This Kanban tool is designed as a **centralized installation** that manages multiple projects:

```
~/.kanban-ui/
  config.json                 ← Global config (machine-specific)
                                 Stores: registered projects, current project ID

~/tools/kanban-ui/            ← Single installation (this codebase)
  /src/                       ← React frontend
  /server/                    ← Express backend

/project-a/                   ← Any registered project
  /tasks/
    /ideation/
      _order.json             ← Task ordering for this column
      some-task.md
    /planning/
      _order.json
    /backlog/
      _order.json
    /implementing/
      _order.json
    /uat/
      _order.json
    /done/
      _order.json
    project.json              ← Per-project config (board name)

/project-b/                   ← Another registered project
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
   - Can be git-tracked with the project

3. **Project Switching:**
   - User clicks dropdown → selects project
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

## Frontend Architecture

### Component Hierarchy
```
App.tsx
└── KanbanBoard.tsx           ← Main container, drag-and-drop context
    ├── ProjectSwitcher.tsx   ← Header dropdown for switching projects
    ├── SearchBar.tsx         ← Task title search
    ├── FilterDropdown.tsx    ← Filter by tags
    ├── Column.tsx            ← Droppable column (one per status)
    │   └── Card.tsx          ← Draggable task card (sortable)
    ├── TaskPanel.tsx         ← Slide-out panel for create/edit task
    └── ProjectsModal.tsx     ← Manage projects (add/remove/rename)
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
├── index.js                  ← Express app setup, startup
├── routes/
│   ├── tasks.js              ← Task CRUD endpoints
│   └── projects.js           ← Project management endpoints
└── services/
    ├── configService.js      ← Global config (~/.kanban-ui/)
    ├── fileService.js        ← Task file operations
    └── watcher.js            ← Chokidar + SSE broadcasting
```

### Data Flow
1. **Task operations:** API → `fileService.js` → filesystem
2. **File changes:** `chokidar` detects → `watcher.js` broadcasts SSE
3. **Frontend:** SSE listener → triggers `loadTasks()` refresh
4. **Project switch:** Update config → reinit watcher → broadcast SSE

### Key Functions

**`configService.js`:**
- `ensureGlobalConfig()` - Creates default config on first run
- `getCurrentProjectPath()` - Returns active project's path
- `setCurrentProject(id)` - Switches active project
- `addProject(name, path)` - Registers new project
- `validateProjectPath(path, createIfMissing)` - Checks/creates tasks folder

**`fileService.js`:**
- `getTasksDir()` - Async, reads from current project config
- `getAllTasks()` - Reads all tasks, auto-migrates on first access, sorts by order files
- `parseTaskFile(content)` - Markdown → task object (extracts stable ID)
- `serializeTask(task)` - Task object → markdown (includes ID section)
- `generateTaskId()` - Creates timestamp-based unique ID
- `generateSlug(title, existingFiles)` - Creates filename with deduplication
- `readOrderFile(statusDir)` / `writeOrderFile(statusDir, data)` - Manage column ordering
- `moveTask()` - Moves file, updates both order files
- `reorderTasks()` - Updates order file only (no file renames)

**`watcher.js`:**
- `initWatcher()` - Sets up chokidar on current project
- `switchProject(id)` - Closes old watcher, inits new, broadcasts event
- `broadcastToClients(msg)` - Sends SSE to all connected clients

## API Reference

### Tasks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | List all tasks for current project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:status/:filename` | Update task |
| POST | `/api/tasks/move` | Move task between columns |
| POST | `/api/tasks/reorder` | Reorder within column |
| DELETE | `/api/tasks/:status/:filename` | Delete task |
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
- Filenames are stable once created (no renaming on reorder/move)
- Task ID stored in markdown is the unique identifier

**Column Ordering:** Each status folder contains `_order.json`:
```json
{
  "order": ["task_1734523687000", "task_1734523698000"]
}
```
- Order determined by position in array (first = highest priority)
- Reordering only updates this file, not task files
- Tasks not in order file appear at the end

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
