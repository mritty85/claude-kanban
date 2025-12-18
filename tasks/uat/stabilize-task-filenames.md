# Stabilize Task Filenames for External References

## Id
task_1734524500000

## Status
uat

## Tags
- feature-enhancement

## Description
**Problem:** File paths change when tasks are reordered or moved between columns. This breaks external references (e.g., when Claude is given a task path to work on, or when linking tasks in notes).
**Current behavior:**
- `reorderTasks()` renumbers ALL files in a column on drag-drop
- `moveTask()` assigns a new priority prefix when moving between columns
- Result: `03-my-task.md` can become `01-my-task.md` unexpectedly
**Goal:** Make file paths stable across all columns so references remain valid.

## Acceptance Criteria
- [x] Task filenames are stable and never change after creation
- [x] Existing external references (file paths) remain valid
- [x] Card ordering still works in all columns
- [x] UI displays tasks in correct priority order

## Notes
**Implementation completed:**
- Moved unique identifier from filename into markdown content (`## Id` section)
- Task IDs are timestamp-based: `task_1734523687000`
- Filenames are now slug-only: `user-auth.md` instead of `01-user-auth.md`
- Column ordering managed by `_order.json` files in each status folder
- Reordering only updates the order file, not task files
- Auto-migration runs on first access for projects without order files
- Migration preserves existing order based on numeric prefixes

**Files changed:**
- `server/services/fileService.js` - Core logic for IDs, ordering, migration
- `server/routes/tasks.js` - Updated reorder endpoint
- `src/types/task.ts` - Removed priority field
- `src/lib/api.ts` - Updated reorderTasks signature
- `src/hooks/useTasks.ts` - Updated reorder call, removed priority sorting
- `src/components/KanbanBoard.tsx` - Pass IDs instead of filenames
- `src/components/FilterDropdown.tsx` - Updated sort option from 'priority' to 'default'
- `CLAUDE.md` - Updated documentation
