# Update Architecture to Single Folder Structure

## Id
task_1769346011977

## Status
uat

## Tags
- refactor
- new-functionality

## Description
Simplify task management by eliminating status subfolders. All tasks live in `/tasks/`, column membership comes from `## Status` field in each file. Claude only needs to edit one file to move a task.

## Acceptance Criteria
- [x] All tasks stored flat in `/tasks/*.md`
- [x] Status derived from `## Status` field in file content
- [x] Single `_board.json` replaces 6x `_order.json` files
- [x] Auto-migration from old structure on first load
- [x] Unordered tasks appear at TOP of column (not bottom)
- [x] API simplified (no status in URL paths)
- [x] CLAUDE.md updated with new workflow

## Notes
**Plan file:** `idempotent-plotting-parnas.md`

### Implementation Summary (2026-01-25)

**Backend changes:**
- `server/services/fileService.js` - Complete rewrite:
  - Added `readBoardFile()` / `writeBoardFile()` for `_board.json`
  - Added `isOldStructure()` detection and `migrateToFlatStructure()` auto-migration
  - `parseTaskFile()` now derives status from file content
  - CRUD functions no longer need status parameter in paths
  - Added `ensureDirectories()` for flat structure
  - Excluded special files (NOTES.md, ROADMAP.md, README.md) from task list

- `server/routes/tasks.js` - Simplified routes:
  - `PUT /:filename` (was `/:status/:filename`)
  - `DELETE /:filename` (was `/:status/:filename`)
  - `POST /move` body now just `{ filename, toStatus }`

- `server/services/watcher.js` - Changed `depth: 1` to `depth: 0`

- `server/services/configService.js` - New projects get `_board.json` instead of subfolders

**Frontend changes:**
- `src/lib/api.ts` - Simplified signatures (removed status params)
- `src/hooks/useTasks.ts` - Updated to match new API
- `src/components/KanbanBoard.tsx` - Updated all call sites
- `src/components/TaskPanel.tsx` - Updated copy path to `tasks/${filename}`

**Migration:** Runs automatically on first `getAllTasks()` call when old structure detected. Moves all .md files to root, consolidates order files into `_board.json`, removes empty subfolders.

