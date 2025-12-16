# Add 'View More' Functionality to Acceptance Criteria

## Status
backlog

## Epic
UI Enhancements

## Tags
- refactor

## Description
Currently it's a challenge navigating massive Acceptance Criteria lists. I'd like to add some type of expander/see more functionality that caps the visible list to 8 list items — and then either make the area scrollable or some type of pagination/expansion. 
But we can't lose the capability to reorder the list

## Acceptance Criteria
- [ ] Show only first 8 acceptance criteria items by default
- [ ] Display "Show X more" button when list exceeds 8 items
- [ ] Clicking "Show X more" expands to show all items
- [ ] When expanded, show "Show less" button to collapse back to 8
- [ ] Drag-and-drop reordering works on all visible items (expanded state)
- [ ] Collapsed state still allows reordering of visible items (1-8)
- [ ] New criteria added while collapsed should expand the list if it pushes count over 8

## Notes
- Approach: Expand/collapse with state toggle rather than scrollable container
- Avoids nested scroll UX issues within the panel
- User accepts tradeoff: must expand to reorder items beyond position 8
