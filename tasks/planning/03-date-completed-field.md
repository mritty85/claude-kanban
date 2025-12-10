# Task Date Completed Field

## Status
planning

## Tags
- new-functionality

## Description
When a task is moved to Done, auto-set a completion timestamp. This enables using the Done column as a pseudo-changelog, sortable by completion date.
Legacy tasks without this field will simply display no date—no migration or backfill required.

## Acceptance Criteria
- [ ] Auto-set completion date when task moves to Done status
- [ ] Moving back to Done overwrites with the most recent date (no clearing when leaving Done)
- [ ] Date field visible and editable in TaskModal (allows manual backfill)
- [ ] Display format: date only in UI (e.g., "Dec 10, 2024")
- [ ] Storage format: ISO 8601 datetime in markdown (`## Completed\n2024-12-10T15:45:00Z`)
- [ ] Completion date visible on Card in Done column
- [ ] Gracefully handle tasks without completion date (show nothing or "—")

## Notes
- Field is optional—existing tasks work without modification
- Editable field allows manual backfill for important historical tasks
- Future task: filtering/sorting by completion date (see 04-update-filtering-to-included-completed-date.md)
