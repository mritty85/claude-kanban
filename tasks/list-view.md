# List view

## Id
task_1768949772500

## Status
done

## Tags
- new-functionality

## Description
Add an alternative list view to complement the kanban board. List view displays tasks in a compact table format grouped by status, making it easier to scan and review large projects. Users toggle between views via an icon button in the header.

## Acceptance Criteria
- [x] Add view toggle icon button in header (right of Launch Terminal button)
- [x] Icon indicates current view (grid icon for kanban, list icon for list)
- [x] Click toggles between views
- [x] View preference is session-only (resets to kanban on refresh)
- [x] Tasks grouped by status sections (Ideation, Planning, Backlog, etc.)
- [x] Each section is collapsible with expand/collapse toggle
- [x] Sections default to expanded
- [x] Section header shows status name and task count
- [x] Columns: Task Name, Epic, Tags
- [x] Task name is primary column (wider)
- [x] Epic displays as pill/badge (same styling as card footer)
- [x] Tags display as small colored pills (same styling as cards)
- [x] Click anywhere on row opens task panel (same as card click)
- [x] Hover state to indicate clickable
- [x] Tasks within each section ordered by `_order.json` (same as kanban)
- [x] Search bar filters list view (same behavior as kanban)
- [x] Tag filter dropdown works on list view (same behavior as kanban)
- [x] List view is read-only for ordering
- [x] Switch to kanban view to reorder tasks

## Notes
**Header layout with toggle:**
```
[Project ▼] [Launch Terminal] [📋|▤] [Search...] [Filters ▼]  ─  [Roadmap] [Notes]
                              ↑ view toggle
```

**List view mockup:**
```
▼ Backlog (3)
┌──────────────────────────────────────────────────────────────┐
│ Task Name                        │ Epic       │ Tags         │
├──────────────────────────────────────────────────────────────┤
│ Add user authentication          │ Auth       │ feature      │
│ Fix login redirect bug           │ Auth       │ bug          │
│ Update API documentation         │ —          │ docs         │
└──────────────────────────────────────────────────────────────┘

▶ Implementing (1)  ← collapsed

▼ Done (5)
...
```

**Key files to create/modify:**
- `src/components/ListView.tsx` (new) - list view component
- `src/components/ListSection.tsx` (new) - collapsible status section
- `src/components/KanbanBoard.tsx` - add toggle, conditionally render view
- `src/components/ViewToggle.tsx` (new) - toggle button component

**Future enhancements (out of scope for v1):**
- Created/completed date columns (requires schema change)
- Drag-and-drop reordering in list view
- Sortable columns (click header to sort)
- Persist view preference per-project
- Bulk selection and actions

---

**Session Notes (2026-01-22):**

Implementation complete. Files created/modified:
- `src/components/ListSection.tsx` - Collapsible section with ChevronDown/ChevronRight toggle, task rows with title/epic/tags columns
- `src/components/ListView.tsx` - Container that maps STATUSES to ListSection components
- `src/components/KanbanBoard.tsx` - Added `viewMode` state, toggle button (List/LayoutGrid icons), conditional rendering

Key implementation decisions:
- Skipped separate `ViewToggle.tsx` component - toggle is simple enough to inline in KanbanBoard header
- Toggle button placed between Launch and SearchBar (slight deviation from mockup which showed it right of SearchBar)
- Epic column uses `getEpicColor()` for consistent hash-based coloring
- Tags column reuses existing `Tag` component for consistent styling
- Empty sections show "No tasks" message instead of hiding entirely

Bug fix during implementation:
- Initial version had sections clipping tasks due to `h-full` + `overflow-hidden` combination
- Fixed by removing height constraints from ListView and using conditional `overflow-y-auto` on main element for list view

All filters work: search, tag filter, epic filter, and done column date filter/sort all apply to list view via `getFilteredTasksByStatus()`.

## Completed
2026-02-09T09:58:51.456Z
