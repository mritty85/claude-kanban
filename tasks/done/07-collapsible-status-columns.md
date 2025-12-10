# Collapsible Status Columns

## Status
done

## Tags
- new-functionality

## Description
Today, it can be challenging to scroll across multiple statuses to review all tasks.
Additionally, sometimes a single task may get completed in other work and be able to skip statuses, but dragging across to done is challenging with the boundaries and detection.
I'd like to introduce a small chevron/expander icon in the top right corner of each status column, vertically inline with the title and task count.
When the user clicks this, it will horizontally collapse the status and hide the cards.

## Acceptance Criteria
- [ ] Smooth open/close animation (CSS transition)
- [ ] Status title and count of tasks displayed vertically in collapsed state
- [ ] Expander icon (chevron) at the top of all collapsed statuses
- [ ] Collapsed columns are completely ignored for drag-and-drop (cards drag over them seamlessly)
- [ ] Icon encased in subtle box to make it easier to spot and click
- [ ] Respects light/dark mode appropriately
- [ ] Multiple columns can be collapsed simultaneously
- [ ] All columns default to expanded on page load (no persistence)

## Notes
- Test vertical text readability with longer status names like "implementing"
- Collapsed column should still show task count prominently so user knows items exist there
- No auto-expand on hover while dragging - keep interaction simple
