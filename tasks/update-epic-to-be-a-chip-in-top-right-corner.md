# Update Epic Display to Footer Bar

## Id
task_1768751564357

## Status
done

## Epic
UI Enhancements

## Tags
- feature-enhancement

## Description
Update the epic display on task cards to visually distinguish it from tags. Currently epics use a small pill above the title (similar to tags), making it harder to scan the board and identify related tasks within an epic.

**Design:** Full-width colored bar at the BOTTOM of the card (footer style) with left-aligned text. This keeps the task title and tags in a consistent position across all cards, while the epic bar provides a clear visual grouping indicator when scanning the board.

The epic color system (`utils/epicColors.ts`) should remain unchanged.

## Acceptance Criteria
- [x] Epic displays as a full-width bar at the bottom of the card
- [x] Epic text is left-aligned within the bar
- [x] Bar uses existing epic color system (background + text color)
- [x] Cards without epics don't have awkward empty space (no placeholder bar)
- [x] Task title and tags remain in consistent positions regardless of epic presence
- [x] Epic filtering continues to work unchanged

## Notes
- Current implementation: `Card.tsx` lines 51-61 render epic as inline pill above title
- Related task in planning: `update-epic-ui.md` (may want to consolidate or remove)
