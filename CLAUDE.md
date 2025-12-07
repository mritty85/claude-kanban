# Kanban UI - Claude Code Context

## Project Overview

A local, file-based Kanban task manager built with React + Vite + TypeScript. The UI reads/writes markdown task files from the filesystem, providing visibility into work that can also be managed by Claude Code autonomously.

**Key Concept:** The filesystem (`/tasks` directory) is the shared state—the UI and Claude Code never communicate directly.

## Architecture

```
/kanban-ui/                 ← This directory (React app + Express server)
/tasks/                     ← Task storage (sibling directory)
  /ideation/
  /backlog/
  /planning/
  /implementing/
  /uat/
  /done/
```

### Frontend (React + Vite + TypeScript)
- **Entry:** `src/main.tsx` → `src/App.tsx` → `src/components/KanbanBoard.tsx`
- **Styling:** Tailwind CSS v4 with custom theme in `src/index.css` (uses `@theme` directive)
- **Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **State:** `src/hooks/useTasks.ts` manages task state and SSE subscription

### Backend (Express.js)
- **Entry:** `server/index.js`
- **API Routes:** `server/routes/tasks.js`
- **File Operations:** `server/services/fileService.js`
- **File Watcher:** `server/services/watcher.js` (chokidar + SSE)

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:status/:filename` | Update task |
| POST | `/api/tasks/move` | Move task between columns |
| POST | `/api/tasks/reorder` | Reorder within column |
| DELETE | `/api/tasks/:status/:filename` | Delete task |
| GET | `/api/tasks/events` | SSE stream for file changes |

## Task File Format

Tasks are markdown files in `/tasks/{status}/` directories:

```markdown
# {Title}

## Status
ideation | backlog | planning | implementing | uat | done

## Tags
- new-functionality
- feature-enhancement
- bug
- refactor

## Description
{Freeform description}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two

## Notes
{Implementation notes, blockers, decisions}
```

**File Naming:** `{priority}-{slug}.md` (e.g., `01-user-auth.md`)

## Key Files

| File | Purpose |
|------|---------|
| `src/components/KanbanBoard.tsx` | Main board component, drag-and-drop logic |
| `src/components/TaskModal.tsx` | Create/edit form |
| `src/components/Card.tsx` | Task card (sortable) |
| `src/components/Column.tsx` | Column container (droppable) |
| `src/hooks/useTasks.ts` | Task state, API calls, SSE subscription |
| `src/lib/api.ts` | API client functions |
| `src/types/task.ts` | TypeScript types and constants |
| `src/index.css` | Tailwind theme (colors, fonts, spacing) |
| `server/services/fileService.js` | File read/write/move/reorder |
| `server/services/watcher.js` | Chokidar watcher + SSE broadcast |

## Design System

Defined in `src/index.css` using Tailwind's `@theme` directive:

- **Colors:** Dark mode only (`--color-bg-base: #0d0d12`, etc.)
- **Font:** JetBrains Mono (monospace)
- **Spacing:** 4px base unit
- **Tags:** Color-coded by type (new=purple, enhancement=blue, bug=red, refactor=teal)

Reference `/kanban-style-guide.md` in parent directory for full design specs.

## Commands

```bash
# Development (runs both Vite + Express)
npm start

# Run separately
npm run dev      # Vite on :5173
npm run server   # Express on :3001

# Build for production
npm run build
```

## Configuration

- **Tasks directory:** Set `TASKS_DIR` env var or defaults to `../tasks`
- **API port:** Set `PORT` env var or defaults to `3001`
- **Vite proxy:** Configured in `vite.config.ts` to proxy `/api` to Express

## Common Tasks

### Adding a new tag type
1. Add to `TaskTag` type in `src/types/task.ts`
2. Add label to `TAG_LABELS` in same file
3. Add color styles to `src/components/Tag.tsx` (`tagStyles` object)
4. Add color styles to `src/components/FilterDropdown.tsx` (`tagStyles` object)
5. Add color styles to `src/components/TaskModal.tsx` (`tagStyles` object)

### Adding a new status column
1. Add to `TaskStatus` type in `src/types/task.ts`
2. Add label to `STATUS_LABELS` in same file
3. Add to `STATUSES` array in same file
4. Create directory in `/tasks/{new-status}/`
5. Update `STATUSES` array in `server/services/fileService.js`

### Modifying card appearance
- Card styles: `src/components/Card.tsx`
- Drag states defined in same file (isDragging opacity/scale)
- Drop zone highlight: `src/components/Column.tsx` (isOver border)

### Modifying the task form
- Form fields: `src/components/TaskModal.tsx`
- Task serialization: `server/services/fileService.js` (`serializeTask` function)
- Task parsing: `server/services/fileService.js` (`parseTaskFile` function)

## Dependencies

**Frontend:**
- `react`, `react-dom` - UI framework
- `tailwindcss`, `@tailwindcss/vite` - Styling
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` - Drag-and-drop
- `lucide-react` - Icons
- `gray-matter` - Markdown frontmatter parsing (unused in frontend, used in server)

**Backend (dev dependencies):**
- `express` - API server
- `cors` - Cross-origin requests
- `chokidar` - File system watcher
- `concurrently` - Run multiple npm scripts

## Known Limitations

- Single user only (no auth)
- No undo/redo
- No task dependencies
- No time tracking
- File watcher may have slight delay on some systems
