# Limit Visible Tasks in Done Column

## Id
task_1765968350387

## Status
backlog

## Tags
- feature-enhancement

## Description
**Problem:** The Done column accumulates many tasks over time, making the board unwieldy to scroll—especially on machines with long project histories.
**Goal:** Limit visible tasks in Done to a manageable number, with a way to reveal more.
**Constraint:** The column uses `SortableContext` from dnd-kit. Hidden tasks won't be valid drop targets for reordering. However, dropping INTO Done (from other columns) still works since the column itself is a drop zone.

## Acceptance Criteria
- [ ] Done column shows maximum of 10 tasks by default
- [ ] "View more" button appears when there are >10 tasks
- [ ] Button reveals additional tasks (10 at a time or all remaining)
- [ ] Task count in header still shows total (e.g., "42" not "10")
- [ ] Dropping tasks into Done column still works correctly
- [ ] Hidden tasks are still searchable/filterable (they appear if they match)

## Notes
- Consider applying same pattern to UAT if it grows large
- Could make the limit configurable in project settings later
- Related: If we disable reordering in Done (per task #02), the drop target concern becomes moot
