# List view

## Id
task_1768949772500

## Status
planning

## Tags
- new-functionality

## Description
Add an alternative list view to complement the kanban board. List view displays tasks in a compact table format grouped by status, making it easier to scan and review large projects. Users toggle between views via an icon button in the header.

## Acceptance Criteria

### Toggle UI
- [ ] Add view toggle icon button in header (right of Launch Terminal button)
- [ ] Icon indicates current view (grid icon for kanban, list icon for list)
- [ ] Click toggles between views
- [ ] View preference is session-only (resets to kanban on refresh)

### List View Layout
- [ ] Tasks grouped by status sections (Ideation, Planning, Backlog, etc.)
- [ ] Each section is collapsible with expand/collapse toggle
- [ ] Sections default to expanded
- [ ] Section header shows status name and task count

### Task Rows
- [ ] Columns: Task Name, Epic, Tags
- [ ] Task name is primary column (wider)
- [ ] Epic displays as pill/badge (same styling as card footer)
- [ ] Tags display as small colored pills (same styling as cards)
- [ ] Click anywhere on row opens task panel (same as card click)
- [ ] Hover state to indicate clickable

### Ordering & Filtering
- [ ] Tasks within each section ordered by `_order.json` (same as kanban)
- [ ] Search bar filters list view (same behavior as kanban)
- [ ] Tag filter dropdown works on list view (same behavior as kanban)

### No Drag-and-Drop
- [ ] List view is read-only for ordering
- [ ] Switch to kanban view to reorder tasks

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
