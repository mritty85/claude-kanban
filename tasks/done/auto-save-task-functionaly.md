# Auto-save Task Functionality

## Id
task_1765883654815

## Status
done

## Tags
- feature-enhancement

## Description
Add auto-save functionality when editing existing tasks to prevent losing work. Uses a hybrid approach where content fields auto-save, but structural changes (status, new task creation) remain explicit actions.
**Key behavior:**
- **Existing tasks**: Auto-save content fields with 1.5s debounce
- **Status changes**: Remain explicit/immediate (triggers file move to different column)
- **New tasks**: Keep explicit "Create Task" button (file must exist before auto-save)
- **Title**: Auto-save with debounce, but only if non-empty (validation)
- Subtle "Saved" indicator in footer with relative timestamp
- No more "unsaved changes" warnings for content - it's always saved
**Fields by save behavior:**
| Field | Behavior |
|-------|----------|
| Title | Debounced auto-save (if non-empty) |
| Status | Explicit immediate save (moves file) |
| Epic | Debounced auto-save |
| Tags | Immediate auto-save on toggle |
| Description | Debounced auto-save |
| Acceptance Criteria | See below |
| Notes | Debounced auto-save |
| Completed date | Immediate auto-save |
**Acceptance criteria field behavior:**
- Checkbox toggle: Immediate save
- Reorder (drag-drop): Save after drop
- Add new criterion: Save after adding
- Edit criterion text: Debounced save after confirming edit
- Remove criterion: Immediate save

## Acceptance Criteria
- [x] Add debounced auto-save (1.5s) for: description, notes (safety net for long text)
- [x] Header shows "Saved" indicator with relative timestamp for existing tasks
- [x] Header shows "Saving..." indicator during save operations
- [x] Keep explicit "Save Changes" button for all other fields (title, status, tags, epic, completed, AC)
- [x] Keep "Create Task" button for new tasks
- [x] Escape key still closes panel

## Notes
**Dependency:** Implement "Project Notes Functionality" task first. Extract the `useAutoSave` hook from that simpler implementation, then apply it here.
**Implementation approach:**
- Reuse `useAutoSave` hook from NotesPanel (accepts save function and debounce delay)
- Track which fields have changed since last save
- Debounce groups related changes (e.g., typing in description)
- Immediate saves don't debounce (checkbox, tag toggle, reorder)
- Status change is handled separately - calls moveTask API immediately
- For new tasks, auto-save activates only after initial creation
- Consider: after "Create Task", switch to edit mode with auto-save enabled
**UX considerations:**
- "Saved just now" / "Saved 2m ago" in footer (same pattern as NotesPanel)
- Brief "Saving..." state visible but not intrusive
- If save fails, show error and retry option
- Status dropdown could show brief confirmation toast when status changes
---
**Implementation completed 2025-12-16 (simplified approach):**
After testing, simplified to auto-save only for long text fields as a safety net:
- **Auto-save (1.5s debounce):** Description, Notes only
- **Explicit Save Changes button:** Title, Status, Tags, Epic, Completed date, Acceptance Criteria
Changes made:
- Added auto-save state (`autoSaving`, `lastSaved`) and debounce ref to TaskPanel
- Added `formatRelativeTime()` helper (from NotesPanel pattern)
- Description and Notes trigger debounced auto-save on change
- Save indicator in header shows "Saving..." / "Saved X ago"
- 10-second interval updates relative timestamp
- All other fields require explicit "Save Changes" click

## Completed
2025-12-18T10:51:14.629Z
