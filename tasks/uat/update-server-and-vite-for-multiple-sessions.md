# Update Server and Vite for Multiple Sessions

## Id
task_1768751449754

## Status
uat

## Tags
- bug

## Description
Multiple browser tabs caused conflicts because the server had a single global `currentProject` - switching projects in one tab affected all tabs. SSE events were broadcast to ALL clients regardless of which project they were viewing.

## Acceptance Criteria
- [x] Each browser tab can view a different project independently
- [x] Switching projects in one tab doesn't affect other tabs
- [x] File change events only go to tabs viewing that project
- [x] Task creation/editing works without hanging
- [x] Server watches all registered projects simultaneously

## Notes

### Problem
1. Server had single global `currentProject` - switching in one tab affected all tabs
2. SSE broadcast to ALL clients regardless of which project they were viewing
3. File watcher only watched the current project's directory

### Solution: Per-Connection Project Tracking

**Server Changes (`server/services/watcher.js`):**
- Changed `clients` from `Set` to `Map<clientId, {response, projectId}>`
- Now watches ALL registered projects simultaneously via chokidar
- Builds `projectPathMap` to determine which project a file change belongs to
- Broadcasts file change events only to clients watching that specific project
- Added `refreshWatcher()` for when projects are added/removed

**Server Changes (`server/routes/tasks.js`):**
- SSE endpoint accepts `?project=<projectId>` query parameter
- Falls back to current project if not specified

**Server Changes (`server/routes/projects.js`):**
- Switch endpoint always updates global config (needed for `getProjectConfig`)
- Only broadcasts to all clients if `{broadcast: true}` is passed (CLI usage)
- UI switches don't broadcast - frontend handles its own reload via state change

**Frontend Changes (`src/lib/api.ts`):**
- `subscribeToChanges()` now takes `projectId` as first parameter
- Tracks `currentClientId` assigned by server on SSE connect

**Frontend Changes (`src/hooks/useTasks.ts`):**
- Accepts `projectId: string | null` parameter
- Only subscribes to SSE when projectId is available

**Frontend Changes (`src/hooks/useProjectNotes.ts`, `useProjectRoadmap.ts`):**
- Accept `isOpen` parameter in addition to `projectId`
- Only create SSE connections when panel is actually open
- This was critical - having 3 constant SSE connections was exhausting browser's 6-connection limit

**Frontend Changes (`src/components/KanbanBoard.tsx`):**
- Calls `useProjects()` before `useTasks()` to get `currentProject`
- Passes `currentProject?.id` to `useTasks`, `NotesPanel`, and `RoadmapPanel`

### Key Fix: Connection Limit Issue
The original implementation had NotesPanel and RoadmapPanel always creating SSE connections even when hidden. With 3 SSE connections per tab, this could exhaust the browser's 6-connection-per-domain limit, causing POST requests to hang indefinitely. Fixed by only subscribing when panels are open.

