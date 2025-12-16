# Add Copy Path Icon to Card View

## Status
ideation

## Tags
- feature-enhancement

## Description
Add a copy icon to task cards allowing users to quickly copy the file path to clipboard without opening the task panel. Useful for @mentioning tasks in Claude Code.
**Key behavior:**
- Small copy icon in top-right corner of card
- Icon only visible on card hover (keeps cards clean)
- Click copies `tasks/{status}/{filename}` to clipboard
- Shows teal checkmark briefly on success (matches TaskPanel pattern)
- Must NOT interfere with drag-and-drop or card click

## Acceptance Criteria
- [ ] Add Copy icon (lucide-react) to top-right corner of Card component
- [ ] Icon only visible on card hover (opacity transition)
- [ ] Click handler copies task path to clipboard (`tasks/${task.status}/${task.filename}`)
- [ ] Icon changes to teal Check icon for 2s after successful copy
- [ ] `e.stopPropagation()` prevents card onClick from firing
- [ ] `e.preventDefault()` on pointerdown prevents drag initiation
- [ ] Icon has sufficient padding for easy click target (~24px)
- [ ] Icon positioned with `absolute` inside `relative` card container
- [ ] Hover state: icon becomes more visible (opacity or color change)

## Notes
**Implementation challenge:** The Card component spreads `{...listeners}` on the root div for drag-and-drop. The copy button needs to intercept pointer events to prevent drag.
**Approach:**
```tsx
<button
  onClick={(e) => {
    e.stopPropagation(); // Prevent card click
    copyPath();
  }}
  onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
  className="absolute top-2 right-2 ..."
>
```
**Existing pattern:** TaskPanel already has `copyTaskPath()` function with Check icon feedback - reuse same UX pattern.
