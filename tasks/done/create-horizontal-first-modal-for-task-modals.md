# Create Horizontal-first modal for task modals

## Id
task_1765192986747

## Status
done

## Tags
- feature-enhancement

## Description
Currently, tall tasks with a lot of acceptance criteria are tough for the user to navigate and see as much as content as possible without scrolling and losing context. 
I'd like to redevelop the modal to be more wide than tall. 
What should be modal, create task: 
class="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
And edit task (same class): 
class="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto"

## Acceptance Criteria
- [ ] All UI functionality works correctly, include expandable fields
- [ ] Make status dropdown and tags a 50/50 or two column to reduce vertical space for that one line. Status being in the left column, tags in the right
- [ ] Title, status, tags, description in the main column left
- [ ] acceptance criteria and notes in the main column right
- [ ] Save and cancel remain in the bottom right corner

## Notes

