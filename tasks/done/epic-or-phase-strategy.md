# Epic Field for Task Grouping

## Id
task_1765450030151

## Status
done

## Tags
- new-functionality

## Description
Add an optional "Epic" text field to tasks for lightweight grouping of related work. No explicit sequencing—just visual grouping with color coding. Handle dependencies manually via task naming conventions when needed.

## Acceptance Criteria
- [x] Add optional `epic` text field to task data model
- [x] Add Epic field to TaskPanel form (text input with autocomplete from existing epics)
- [x] Display epic label on Card above the title, top-left corner
- [x] Auto-assign consistent color per epic string (hash string → color from palette)
- [x] Epic label on card uses assigned color as background or accent
- [x] Add "Epic" option to filter dropdown to filter by epic
- [x] Update markdown parser/serializer to handle new `## Epic` section
- [x] Empty/no epic = no badge displayed on card

## Notes
- Keep it simple: just grouping, no phases or blocking logic
- Color assignment: hash the epic string to pick from a preset palette (6-8 colors)
- Same epic string across tasks = same color, automatically
- Sequencing handled manually via task title prefixes if needed (e.g., "1. Setup API", "2. Build UI")
- Single user workflow—no collaboration complexity needed
- Autocomplete pulls from all tasks including Done (allows reusing old epic names)

## Completed
2025-12-11T10:47:10.150Z
