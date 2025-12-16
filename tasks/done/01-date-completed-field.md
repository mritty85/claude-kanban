# Task Date Completed Field

## Status
done

## Epic
Task Management

## Tags
- new-functionality

## Description
When a task is moved to Done, auto-set a completion timestamp. This enables using the Done column as a pseudo-changelog, sortable by completion date.
Legacy tasks without this field will simply display no date—no migration or backfill required.

## Acceptance Criteria
- [x] Auto-set completion date when task moves to Done status
- [x] Moving back to Done overwrites with the most recent date (no clearing when leaving Done)
- [x] Date field visible and editable in TaskModal (allows manual backfill)
- [x] Display format: date only in UI (e.g., "Dec 10, 2024")
- [x] Storage format: ISO 8601 datetime in markdown (`## Completed\n2024-12-10T15:45:00Z`)
- [x] Completion date visible on Card in Done column
- [x] Gracefully handle tasks without completion date (show nothing or "—")

## Notes
- Field is optional—existing tasks work without modification
- Editable field allows manual backfill for important historical tasks
- Future task: filtering/sorting by completion date (see 04-update-filtering-to-included-completed-date.md)

## Completed
2025-12-11T12:00:00.000Z
