# Update auto-save

## Id
task_1765968891342

## Status
done

## Tags
- feature-enhancement

## Description
- Add auto-save time, increase to 5 seconds
- Stop cursor from moving to top of field and flashing/flickering on a refresh (and auto scroll to top)
Related tasks:
tasks/done/14-project-notes-functionality.md
tasks/uat/02-auto-save-task-functionaly.md

## Acceptance Criteria
- [x] Increase TaskPanel auto-save debounce from 1.5s to 5s
- [x] Increase NotesPanel auto-save debounce from 1.5s to 5s
- [x] Fix TaskPanel cursor/flickering by adding grace period after auto-save
- [x] Fix NotesPanel race condition by adding grace period after save
- [x] Test both panels to confirm cursor stays in place after auto-save

## Notes
**Root cause of flickering:** When auto-save writes to file, chokidar detects the change and broadcasts an SSE event. This causes useTasks to reload all tasks, which updates the task prop, which triggers the useEffect that resets form state - including cursor position.
**Fix approach:**
- Added `lastAutoSaveTimeRef` to track when we last saved
- In the form reset useEffect, check if we're within a 2-second grace period
- If so, skip resetting description/notes fields (the auto-saved fields)
- Same pattern applied to NotesPanel via `lastSaveTimeRef`

## Completed
2025-12-18T10:51:16.596Z
