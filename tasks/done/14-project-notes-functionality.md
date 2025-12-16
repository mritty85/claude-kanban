# Project Notes Functionality

## Status
done

## Tags
- new-functionality

## Description
Add a single "Project Notes" feature to allow users to keep free-form notes that don't belong within a specific task. Useful for tracking miscellaneous information, context, or things that belong in other documentation.
**Key behavior:**
- Notes icon button to the left of the project selector in the header
- Panel slides out from the LEFT side (mirroring the TaskPanel which slides from the right)
- Panel same dimensions as TaskPanel (`w-full md:w-[70vw] max-w-[900px]`)
- Simple markdown text editor (textarea, no preview needed)
- **Auto-save with 1.5s debounce** - saves automatically after user stops typing
- Subtle "Saved" indicator with relative timestamp in footer
- Saves to `/tasks/NOTES.md` in the current project's tasks folder
- File is accessible to Claude Code via the filesystem
- Notes are per-project (each project has its own NOTES.md)
- Auto-loads existing content when opening panel
- Real-time updates via SSE when file is modified externally (e.g., by Claude)

## Acceptance Criteria
- [x] Add `NotesPanel.tsx` component with left-slide animation (translateX(-100%) → 0)
- [x] Add notes icon button (FileText or StickyNote from lucide-react) left of ProjectSwitcher
- [x] Panel has backdrop overlay matching TaskPanel styling
- [x] Panel has header with title "Project Notes" and close button
- [x] Panel has textarea for editing markdown content (full height, monospace font)
- [x] Auto-save with ~1.5s debounce after typing stops
- [x] Footer shows subtle "Saved" indicator with timestamp (e.g., "Saved just now" or "Saved 2m ago")
- [x] Footer has Close button (no Cancel/Save - auto-save handles persistence)
- [x] Escape key closes the panel
- [x] Add `useProjectNotes.ts` hook for state management (content, loading, saving, lastSaved)
- [x] Add backend endpoints: GET/PUT `/api/tasks/notes` in tasks.js routes
- [x] Add `getProjectNotes()` and `updateProjectNotes()` functions to fileService.js
- [x] GET endpoint returns empty string if NOTES.md doesn't exist (not an error)
- [x] PUT endpoint creates NOTES.md if it doesn't exist (upsert behavior)
- [x] Notes file stored as `NOTES.md` in project's /tasks directory
- [x] SSE broadcasts changes when NOTES.md is modified (watcher already covers this)
- [x] Handle SSE updates gracefully - only reload if panel is closed or content matches (avoid overwriting active edits)
- [x] Add API functions `fetchNotes()` and `updateNotes()` to src/lib/api.ts
- [x] Notes persist correctly across project switches
- [x] Loading state shown while fetching initial content

## Notes
**Lazy file creation:**
- NOTES.md is NOT created when a project is registered or on panel open
- File only created on first save (when user actually types something)
- This avoids empty NOTES.md files in projects where the feature isn't used
- Works cleanly for existing projects pulled to new machines
**Implementation approach:**
- Model NotesPanel after TaskPanel structure but simpler (no form fields, just textarea)
- Slide direction is opposite (from left, not right)
- Can reuse same backdrop/z-index pattern
- File watcher in watcher.js should already detect NOTES.md changes since it watches the /tasks directory
- Auto-save uses debounce: save 1.5s after user stops typing
- "Saved" indicator updates relative time (just now → 1m ago → 2m ago, etc.)
- SSE conflict handling: if panel open and user is editing, don't overwrite with external changes (could show a subtle notification instead)

## Completed
2025-12-16T10:49:45.441Z
