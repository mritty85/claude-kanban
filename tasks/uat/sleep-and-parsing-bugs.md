# Sleep and Parsing Bugs

## Id
task_1768605727560

## Status
uat

## Tags
- bug

## Description
Two bugs affecting app reliability:

1. **SSE Connection Stale After Sleep/Wake**: After computer wakes from sleep, SSE connections become stale but don't signal errors, causing the UI to stop receiving updates (tasks, notes, roadmap don't refresh).

2. **Markdown Parsing Corrupts Content**: Pasting markdown with `## ` headers (like `## Problem`) into task descriptions caused content loss - the parser interpreted them as task file section delimiters.

## Acceptance Criteria
- [x] SSE reconnects automatically after sleep/wake
- [x] Tab visibility change triggers data refresh
- [x] Exponential backoff on SSE connection errors
- [x] Description/notes can contain `## ` markdown headers without corruption
- [x] Empty lines in description/notes are preserved

## Notes
### Fix 1: SSE Reconnection (src/lib/api.ts)
Updated `subscribeToChanges()` to:
- Accept optional `onReconnect` callback for data refresh
- Implement reconnection with exponential backoff (1s → 2s → 4s... up to 30s)
- Listen for `visibilitychange` event to detect sleep/wake
- Automatically refresh data when tab becomes visible

Updated hooks to pass refresh callbacks:
- `useTasks.ts` - passes `loadTasks`
- `useProjectNotes.ts` - passes callback that respects `isEditingRef`
- `useProjectRoadmap.ts` - passes callback that respects `isEditingRef`

### Fix 2: Markdown Parsing (server/services/fileService.js)
Updated `parseTaskFile()` to:
- Define `FREEFORM_SECTIONS = ['description', 'notes']`
- Only treat `## ` as section header if it matches a KNOWN_SECTION
- Preserve `## ` patterns as content when inside description/notes
- Preserve empty lines (removed `&& line.trim()` filter)

Reference doc: `SLEEP-WAKE-FIX.md` in project root

