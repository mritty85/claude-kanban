# Light Mode UI

## Id
task_1765366680393

## Status
done

## Tags
- new-functionality

## Description
On some monitors, it's a challenge to read the text on dark mode and it's more than just an increase the font size issue. I'd like to intro a light/dark mode toggle so the user can decide what they want to use.

## Acceptance Criteria
- [ ] iOS-style toggle at the bottom of the ProjectSwitcher dropdown (single click, no submenu)
- [ ] Continue to use purple as primary accent (may need darker shade for light mode contrast)
- [ ] Tags in edit modal continue to work correctly in both themes
- [ ] Selection persists via localStorage across sessions and project switches
- [ ] Default to dark mode on first visit
- [ ] Smooth CSS transition animation when toggling themes

## Notes
- Purple accent (#9333ea) works on dark backgrounds but may need adjustment for light mode contrast
- Consider whether tag colors need light-mode variants or if current colors work on light backgrounds
