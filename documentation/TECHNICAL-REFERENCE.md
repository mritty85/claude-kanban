# Kanban UI — Technical Reference

A local, file-based Kanban task manager built with React + Vite + TypeScript on the frontend and Express on the backend. The filesystem is the source of truth — the UI reads and writes markdown task files, and real-time sync happens via Server-Sent Events (SSE) backed by chokidar file watching.

This document is a complete technical reference for rebuilding or adapting this architecture to a new project (e.g., a CRM, issue tracker, or any file-backed CRUD app).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Data Model](#data-model)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Real-Time Updates (SSE + File Watching)](#real-time-updates)
7. [Drag-and-Drop](#drag-and-drop)
8. [Multi-Project System](#multi-project-system)
9. [Styling & Theming](#styling--theming)
10. [Development Setup](#development-setup)
11. [Key Patterns & Conventions](#key-patterns--conventions)
12. [Adapting This Architecture](#adapting-this-architecture)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React + Vite)          port 5190              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  useTasks() hook ←──── SSE subscription           │  │
│  │       ↕                     ↑                     │  │
│  │  api.ts ─── HTTP ──→ Express API (port 3050)      │  │
│  │                        ↕                          │  │
│  │                   fileService.js                   │  │
│  │                        ↕                          │  │
│  │                   Filesystem (/tasks/*.md)         │  │
│  │                        ↑                          │  │
│  │                   chokidar watcher ──→ SSE broadcast│ │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User action → API call → fileService writes to disk
2. Chokidar detects filesystem change → broadcasts SSE event
3. Frontend SSE listener receives event → calls `loadTasks()` to refresh state
4. UI re-renders with fresh data

This architecture means external edits (e.g., a CLI tool editing a markdown file) automatically appear in the UI with no additional integration work.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 19.x | UI framework |
| Build | Vite | 7.x | Dev server, bundler, API proxy |
| Language | TypeScript | 5.9 | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first CSS with `@theme` |
| Icons | lucide-react | 0.556 | SVG icon components |
| Drag-drop | @dnd-kit | core 6.x, sortable 10.x | Accessible drag-and-drop |
| Backend | Express | 5.x | REST API server |
| File watching | chokidar | 5.x | Filesystem change detection |
| Process mgmt | concurrently | 9.x | Run frontend + backend together |

**No database.** All data is stored as markdown files and JSON on disk.

---

## Data Model

### Task (Primary Entity)

Each task is a markdown file in `/tasks/` with structured sections:

```markdown
# Deploy Authentication System

## Id
task_1734523687000

## Status
implementing

## Epic
User Auth

## Tags
- new-functionality
- feature-enhancement

## Description
Implement OAuth2 login flow with Google and GitHub providers.
Supports **markdown** formatting including headers within the section.

## Acceptance Criteria
- [x] OAuth2 flow works with Google
- [ ] OAuth2 flow works with GitHub
- [ ] Session persistence across browser restarts

## Notes
Decided to use passport.js for provider abstraction.

## Completed
2024-01-31T15:30:00.000Z
```

**TypeScript interface:**

```typescript
interface Task {
  id: string;                           // "task_1734523687000" (stable, timestamp-based)
  filename: string;                     // "deploy-auth-system.md" (slug from title)
  status: TaskStatus;                   // Column position
  title: string;
  description: string;
  tags: TaskTag[];
  acceptanceCriteria: AcceptanceCriterion[];
  notes: string;
  epic?: string;                        // Grouping label
  completed?: string;                   // ISO timestamp, set when moved to "done"
  additionalContent?: string;           // Preserves unknown markdown sections
}

type TaskStatus = 'ideation' | 'backlog' | 'planning' | 'implementing' | 'uat' | 'done';
type TaskTag = 'new-functionality' | 'feature-enhancement' | 'bug' | 'refactor' | 'devops';
```

### Column Ordering (`_board.json`)

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

Position in array = priority (index 0 = top of column). Tasks not listed in `_board.json` appear at the top of their column (newest first).

### Project Config (`project.json`)

```json
{
  "boardName": "My Project",
  "launchConfigs": [
    { "id": "lc_1704067200000", "name": "Dev Server", "command": "npm run dev", "workingDir": "." }
  ]
}
```

### Global Config (`~/.kanban-ui/config.json`)

```json
{
  "currentProject": "/Users/me/projects/my-app",
  "projects": [
    {
      "id": "my-app",
      "name": "My App",
      "path": "/Users/me/projects/my-app",
      "lastAccessed": "2024-01-31T15:30:00Z"
    }
  ]
}
```

---

## Backend

### Directory Structure

```
server/
├── index.js              # Express app setup, startup sequence
├── routes/
│   ├── tasks.js          # Task CRUD + SSE endpoint
│   ├── projects.js       # Project management
│   └── launch.js         # Terminal spawn configs
└── services/
    ├── fileService.js    # All file I/O and markdown parsing (714 lines)
    ├── configService.js  # Global config CRUD (213 lines)
    └── watcher.js        # Chokidar + SSE broadcasting (157 lines)
```

### Startup Sequence (`index.js`)

```javascript
// 1. Create ~/.kanban-ui/config.json if first run
await ensureGlobalConfig();

// 2. Read current project path from config
const projectPath = await getCurrentProjectPath();

// 3. Create /tasks dir and _board.json if missing
await ensureDirectories(projectPath);

// 4. Start file watcher on all registered project /tasks directories
await initWatcher();

// 5. Listen on port 3050
app.listen(PORT);
```

### API Endpoints

#### Tasks

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tasks` | — | List all tasks for current project |
| `POST` | `/api/tasks` | `TaskFormData` | Create task (generates ID, slug, file) |
| `PUT` | `/api/tasks/:filename` | `Partial<TaskFormData>` | Update task fields |
| `POST` | `/api/tasks/move` | `{ filename, toStatus, position? }` | Move between columns |
| `POST` | `/api/tasks/reorder` | `{ status, orderedIds }` | Reorder within column |
| `DELETE` | `/api/tasks/:filename` | — | Delete task file |
| `GET` | `/api/tasks/events` | — | SSE stream (query: `?project=id`) |
| `GET/PUT` | `/api/tasks/config` | `{ boardName, ... }` | Project config |
| `GET/PUT` | `/api/tasks/notes` | `{ content }` | NOTES.md |
| `GET/PUT` | `/api/tasks/roadmap` | `{ content }` | ROADMAP.md |

**Route ordering matters:** Named routes (`/config`, `/notes`, `/roadmap`) must be registered before wildcard `/:filename` routes.

#### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all registered projects |
| `GET` | `/api/projects/current` | Current project with boardName |
| `POST` | `/api/projects` | Register new project |
| `PUT` | `/api/projects/:id` | Update name (syncs to boardName) |
| `DELETE` | `/api/projects/:id` | Unregister project |
| `POST` | `/api/projects/:id/switch` | Switch active project |
| `POST` | `/api/projects/validate-path` | Validate path exists |

#### Launch Terminal

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/launch/configs` | List launch configs |
| `POST` | `/api/launch/configs` | Add config |
| `PUT/DELETE` | `/api/launch/configs/:id` | Update/delete config |
| `POST` | `/api/launch/:id` | Spawn terminal (macOS AppleScript to Ghostty) |

### File Service — Key Functions

**Markdown Parsing:** The parser splits markdown into sections by `## ` headers. "Freeform" sections (description, notes) can contain nested `##` headers without breaking the parse — the parser tracks which sections allow arbitrary content.

```javascript
// Parsing: markdown string → Task object
parseTaskFile(content, filename)

// Serialization: Task object → markdown string
serializeTask(task)

// ID generation
generateTaskId()    // → "task_" + Date.now()
generateSlug(title, existingFiles)  // → "deploy-auth-system.md" (deduplicates)
```

**Board management:**
```javascript
readBoardFile(tasksDir)        // → { columns: { status: [taskId, ...] } }
writeBoardFile(tasksDir, data) // Atomic write

moveTask(filename, toStatus, position)  // Updates file status + _board.json
reorderTasks(status, orderedIds)        // Updates _board.json only
```

**Auto-migration:** On first `getAllTasks()` call, detects if the project uses the old folder-per-status layout and migrates to flat structure automatically.

---

## Frontend

### Directory Structure

```
src/
├── main.tsx                    # ReactDOM entry
├── App.tsx                     # Root (renders KanbanBoard)
├── index.css                   # @theme variables, Tailwind imports
├── lib/
│   └── api.ts                  # HTTP client + SSE subscription (310 lines)
├── types/
│   └── task.ts                 # All TypeScript interfaces (104 lines)
├── utils/
│   └── epicColors.ts           # Deterministic color hash for epic badges
├── hooks/
│   ├── useTasks.ts             # Task CRUD + SSE (98 lines)
│   ├── useProjects.ts          # Project list + switching (93 lines)
│   ├── useTheme.ts             # Light/dark theme toggle
│   ├── useProjectNotes.ts      # Notes panel state
│   └── useProjectRoadmap.ts    # Roadmap panel state
└── components/
    ├── KanbanBoard.tsx          # Main container, all state orchestration (466 lines)
    ├── Column.tsx               # Droppable column with sortable cards (86 lines)
    ├── Card.tsx                 # Draggable task card (89 lines)
    ├── TaskPanel.tsx            # Create/edit modal with full form
    ├── ListView.tsx             # Alternative list layout
    ├── ListSection.tsx          # Collapsible list section
    ├── ProjectSwitcher.tsx      # Header project dropdown
    ├── ProjectsModal.tsx        # Add/remove/rename projects
    ├── LaunchModal.tsx          # Terminal launch configs
    ├── SearchBar.tsx            # Title search input
    ├── FilterDropdown.tsx       # Tag/epic/date filter popover
    ├── NotesPanel.tsx           # Side panel for scratch notes
    ├── RoadmapPanel.tsx         # Side panel for roadmap
    ├── EpicCombobox.tsx         # Autocomplete epic input
    └── Tag.tsx                  # Colored tag badge
```

### Component Hierarchy

```
App
└── KanbanBoard (state orchestrator)
    ├── ProjectSwitcher
    ├── SearchBar
    ├── FilterDropdown
    ├── [view toggle, notes, roadmap, launch buttons]
    │
    ├── DndContext (kanban view)
    │   ├── Column × 6 (one per status)
    │   │   └── SortableContext
    │   │       └── Card × N (sortable)
    │   └── DragOverlay (floating card during drag)
    │
    ├── ListView (alternative view)
    │   └── ListSection × 6
    │
    ├── TaskPanel (slide-out modal)
    ├── NotesPanel (side panel)
    ├── RoadmapPanel (side panel)
    ├── ProjectsModal
    └── LaunchModal
```

### State Management

No Redux, Zustand, or Context. Just hooks + prop drilling.

**`useTasks(projectId)`** — the core hook:
```typescript
const {
  tasks,                    // Task[]
  loading, error,
  createTask, updateTask, moveTask, reorderTasks, deleteTask,
  getTasksByStatus,         // (status) => Task[]
  refresh                   // Manual reload
} = useTasks(currentProject?.id);
```

Internally subscribes to SSE. When any `add`, `change`, or `unlink` event arrives, calls `refresh()` to reload all tasks from the API.

**`useProjects()`** — project management:
```typescript
const {
  projects, currentProject, loading, error,
  addProject, removeProject, updateProjectName, switchToProject,
  validatePath, refresh
} = useProjects();
```

### API Client (`src/lib/api.ts`)

Thin wrappers around `fetch()` that throw on non-2xx responses.

**SSE subscription:**
```typescript
subscribeToChanges(projectId, onEvent, onReconnect): () => void
```
- Creates `EventSource` to `/api/tasks/events?project={projectId}`
- Exponential backoff on connection errors (max 30 seconds)
- Reconnects on browser visibility change (handles sleep/wake)
- Returns an unsubscribe function for cleanup

---

## Real-Time Updates

### How It Works

```
[File written to disk]
        ↓
[Chokidar detects change]
        ↓
[watcher.js determines which project]
        ↓
[Broadcasts SSE to clients watching that project]
        ↓
[Frontend EventSource receives event]
        ↓
[useTasks hook calls loadTasks()]
        ↓
[UI re-renders]
```

### Watcher Configuration

```javascript
chokidar.watch(watchPaths, {
  persistent: true,
  ignoreInitial: true,         // Don't fire for existing files
  depth: 0,                    // Flat directory only
  awaitWriteFinish: {          // Prevent partial-read events
    stabilityThreshold: 100,
    pollInterval: 50
  }
});
```

Watches all registered projects simultaneously. Each SSE client specifies which project it's watching via query parameter.

### SSE Event Format

```javascript
{
  event: 'add' | 'change' | 'unlink' | 'connected' | 'project-switched',
  path: '/absolute/path/to/file.md',
  projectId: 'my-app',
  clientId: 1,
  timestamp: 1704067200000
}
```

### Client Tracking

```javascript
// Server maintains a map of connected clients
clients: Map<clientId, { response: Response, projectId: string }>

// When a client connects:
addSSEClient(res, projectId)    // Writes SSE headers, sends "connected" event

// When a file changes:
broadcastToProject(projectId, message)  // Only clients watching this project

// When a client switches projects:
updateClientProject(clientId, newProjectId)
```

---

## Drag-and-Drop

Built on `@dnd-kit` (accessible, performant, React-native).

### Setup (`KanbanBoard.tsx`)

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

// Custom collision: pointer-based first, fall back to rect intersection
const collisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};
```

### Column = Droppable + SortableContext

```typescript
// Column.tsx
const { setNodeRef, isOver } = useDroppable({ id: status });

<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
  {tasks.map(task => <Card key={task.id} task={task} />)}
</SortableContext>
```

### Card = Sortable

```typescript
// Card.tsx
const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: task.id });
```

### Drag End Handler

Three cases:
1. **Drop on column header** → `moveTask(filename, targetStatus)` (append to end)
2. **Drop on card in same column** → `reorderTasks(status, newOrder)` (reorder only)
3. **Drop on card in different column** → `moveTask(filename, targetStatus)` (move + position)

A `DragOverlay` renders a floating copy of the card during drag for visual feedback.

---

## Multi-Project System

### Architecture

```
~/.kanban-ui/
  config.json                    ← Machine-specific, tracks all projects

/project-a/tasks/                ← Project A's task storage
  _board.json                    ← Column ordering
  project.json                   ← Board name, launch configs
  *.md                           ← Task files

/project-b/tasks/                ← Project B's task storage
  ...
```

### Switch Flow

1. User selects project from `ProjectSwitcher` dropdown
2. Frontend calls `POST /api/projects/:id/switch`
3. Backend updates `currentProject` in `~/.kanban-ui/config.json`
4. SSE client project association is updated
5. Frontend `useTasks` hook re-subscribes with new projectId
6. Tasks reload from new project's `/tasks/` directory

### Project Registration

Projects are registered by absolute path. The backend validates the path exists, creates `/tasks/` and `_board.json` if missing. Each machine maintains its own `config.json` since paths differ between machines.

---

## Styling & Theming

### Tailwind v4 with `@theme`

All colors defined as CSS custom properties in `src/index.css`:

```css
@theme {
  --color-bg-base: #0d0d12;
  --color-bg-surface: #16161e;
  --color-bg-elevated: #1e1e28;
  --color-border-subtle: #2a2a3c;
  --color-text-primary: #e2e2e9;
  --color-text-secondary: #9090a0;
  --color-accent-primary: #7c5cff;
  --font-mono: 'JetBrains Mono', monospace;
  /* ... */
}
```

Light mode is supported via `html.light` selector with overridden values.

### Conventions

- Dark mode by default
- JetBrains Mono monospace font throughout
- Custom scrollbar styling (webkit)
- Tag colors per type (5 tag types × bg/text pairs)
- Epic colors via deterministic hash (8-color palette)
- Focus-visible outlines with accent color

---

## Development Setup

### Ports

| Service | Port | Config Location |
|---------|------|-----------------|
| Vite (frontend) | 5190 | `vite.config.ts` |
| Express (backend) | 3050 | `server/index.js` |

Vite proxies `/api` requests to `http://localhost:3050`.

### Commands

```bash
npm start          # Run both frontend and backend (concurrently)
npm run dev        # Frontend only
npm run server     # Backend only
npm run build      # Production build (tsc + vite build)
```

### First Run

1. `npm install`
2. `npm start`
3. `~/.kanban-ui/config.json` is auto-created
4. Parent directory is registered as "Default Project"
5. Open `http://localhost:5190`

---

## Key Patterns & Conventions

### File-as-Database

Every entity is a file. No database, no ORM. The filesystem IS the state. This means:
- External tools can read/write the same files
- Git can version the task data
- No migration scripts — just files

### Markdown Parsing Strategy

The parser handles freeform markdown sections (description, notes) that may contain `##` headers. It does this by tracking which sections are "freeform" and consuming all content until the next known section header.

Unknown `##` sections are preserved in `additionalContent` and round-trip safely through parse → serialize.

### ID Strategy

- **Task IDs:** `task_` + `Date.now()` — timestamp-based, globally unique enough for single-user
- **Launch config IDs:** `lc_` + `Date.now()`
- **Filenames:** Slugified title with deduplication (`my-task.md`, `my-task-2.md`)
- Filenames are stable once created (never renamed on reorder/move)

### Optimistic Updates

The frontend updates local state immediately on user action, then confirms with the API. SSE events from chokidar then trigger a full reload, ensuring consistency.

### Error Handling

- Backend: try/catch → log → return 4xx/5xx with JSON error message
- Frontend: API layer throws on non-2xx → hooks catch and set error state
- No global error boundary — errors are per-hook

---

## Adapting This Architecture

This pattern works well for any local, single-user CRUD app where:
- You want file-based storage (readable, git-trackable, editable outside the UI)
- You need real-time sync between the UI and external file changes
- You want a simple stack with no database setup

### For a Job Search CRM

The same architecture maps directly:

| Kanban Concept | CRM Equivalent |
|---------------|----------------|
| Task file (`.md`) | Contact/company/application record |
| `## Status` column | Pipeline stage (applied, phone screen, onsite, offer, etc.) |
| `## Tags` | Labels (company size, role type, remote/hybrid) |
| `_board.json` ordering | Priority ranking within each stage |
| `## Notes` | Interview notes, follow-up items |
| `## Acceptance Criteria` | Action items / next steps checklist |
| `project.json` | CRM config (pipeline names, custom fields) |
| Multi-project | Multiple job searches or search + networking tracks |

**What to keep as-is:**
- Express + chokidar + SSE real-time architecture
- Markdown file storage and parsing
- `_board.json` for column ordering
- Vite + React + Tailwind frontend
- `@dnd-kit` drag-and-drop between pipeline stages
- Project switching (could be different search campaigns)

**What to adapt:**
- Task schema → Contact/Application schema with different fields
- Status values → Pipeline stages relevant to job search
- Tags → Categories meaningful for job hunting
- Card component → Show company, role, salary range, next action date
- Add date-based features (follow-up reminders, application date tracking)
- Add relationship fields (contacts per company, referrals)

### Minimal Reproduction Steps

To build a new app on this architecture:

1. **Copy `server/` directory** — swap `fileService.js` parsing for your schema
2. **Copy `src/lib/api.ts`** — update endpoints for your entities
3. **Copy `src/hooks/useTasks.ts`** — rename and adapt for your data type
4. **Copy `src/components/KanbanBoard.tsx`** — your main container with DnD
5. **Copy `watcher.js`** verbatim — SSE + chokidar is entity-agnostic
6. **Define your markdown schema** — the parser/serializer is the main custom work
7. **Design your Tailwind theme** — update CSS variables in `index.css`

The total codebase is ~2,500 lines of application code (not counting config files), making it straightforward to understand end-to-end.
