# Add thin grey stroke between status columns

## Status
done

## Tags
- feature-enhancement

## Description
Between each status, please add a thin grey stroke to guide the user's eye on what's stacked within the status column

## Acceptance Criteria
- [x] persistent in the UI
- [x] doesn't interfere with boundaries or drop zones
- [x] full vertical length of the UI, no need to be dynamic per status height of cards

## Notes
Added a 1px vertical divider between columns using `--color-border-subtle`. The divider is placed outside the Column component so it doesn't affect drop zones. Uses `self-stretch` to span full height of the flex container.

Implementation: `KanbanBoard.tsx` lines 192-194
