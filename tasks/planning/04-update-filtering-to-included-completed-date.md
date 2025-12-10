# Filter and Sort Done Column by Completion Date

## Status
planning

## Tags
- new-functionality

## Description
Extend the existing filter dropdown to support filtering and sorting the Done column by completion date. This enables using Done as a changelog—quickly see recent completions or find tasks from a specific time period.
Depends on: 03-date-completed-field.md

## Acceptance Criteria
- [ ] Add sort option for Done column: by completion date (newest/oldest first)
- [ ] Default remains priority-based ordering until user selects date sort
- [ ] Sort option only affects Done column; other columns retain priority ordering
- [ ] Add date filter section to existing FilterDropdown (expand dropdown width as needed)
- [ ] Preset options: "Last 7 days", "Last 30 days", "This month", "This year"
- [ ] Custom date range picker for specific start/end dates
- [ ] Date filter applies to Done column only
- [ ] Done column always visible, even if no tasks match filter (shows empty state)
- [ ] Tasks without completion date excluded when date filter is active
- [ ] Tag filter + date filter use AND logic (tasks must match both)
- [ ] Tag filter continues to apply to all columns as it does today
- [ ] Date filter only affects Done column

## Notes
- Requires completion date field to be implemented first (03-date-completed-field.md)
- Consider showing active filter indicator when date filter is applied
- Tasks without `completedAt` won't appear when date filter is active (acceptable since those are legacy tasks)
