# Slide-Out Task Editor Panel

## Status
done

## Tags
- feature-enhancement

## Description
### Overview
Replace the current TaskModal with a full-height slide-out panel from the right edge. This gives long-form content (descriptions, acceptance criteria, notes) the space it deserves while maintaining the Kanban board context.
### Design Decisions
- **Full replacement** - No modal fallback; panel is the only editing experience
- **~65-75% viewport width** - Panel dominant, board dimmed but visible at left edge
- **No live preview** - Keep it simple with larger textareas; markdown renders on save
- **Smooth animations** - Slide-in/out transitions, subtle easing for polish
### Layout Concept
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Board Header                                                                │
├────────────────────┬────────────────────────────────────────────────────────┤
│                    │  ┌──────────────────────────────────────────────────┐  │
│   Kanban Columns   │  │  Task Title                            [×]      │  │
│   (dimmed/blurred) │  ├──────────────────────────────────────────────────┤  │
│                    │  │                                                  │  │
│   ┌───┐ ┌───┐      │  │  Status: [dropdown]     Tags: [multi-select]    │  │
│   │   │ │   │      │  │                                                  │  │
│   │   │ │   │      │  │  ─────────────────────────────────────────────   │  │
│   │   │ │   │      │  │                                                  │  │
│   │   │ │   │      │  │  Description                                     │  │
│   │   │ │   │      │  │  ┌────────────────────────────────────────────┐  │  │
│   │   │ │   │      │  │  │                                            │  │  │
│   └───┘ └───┘      │  │  │  (large textarea, ~40% of panel height)    │  │  │
│                    │  │  │                                            │  │  │
│   Click outside    │  │  │                                            │  │  │
│   to close         │  │  └────────────────────────────────────────────┘  │  │
│                    │  │                                                  │  │
│                    │  │  Acceptance Criteria                             │  │
│                    │  │  ┌────────────────────────────────────────────┐  │  │
│                    │  │  │  (medium textarea, ~25% of panel height)   │  │  │
│                    │  │  └────────────────────────────────────────────┘  │  │
│                    │  │                                                  │  │
│                    │  │  Notes                                           │  │
│                    │  │  ┌────────────────────────────────────────────┐  │  │
│                    │  │  │  (medium textarea, ~20% of panel height)   │  │  │
│                    │  │  └────────────────────────────────────────────┘  │  │
│                    │  │                                                  │  │
│                    │  │         [Delete]              [Save]            │  │
│                    │  └──────────────────────────────────────────────────┘  │
└────────────────────┴────────────────────────────────────────────────────────┘
```
### Animation Details
- **Open:** Panel slides in from right (300-400ms, ease-out)
- **Close:** Panel slides out to right (250ms, ease-in)
- **Backdrop:** Board dims with semi-transparent overlay (fade in/out with panel)
- **Optional:** Subtle scale-down of board content (0.98) for depth effect
### Field Layout Changes
- **Compact row:** Status dropdown + Tags multi-select (horizontal, top of panel)
- **Title:** Large input, prominent at top
- **Description:** Biggest textarea (~40% of available height), auto-grows if needed
- **Acceptance Criteria:** Medium textarea (~25%), keeps `- [ ]` markdown format
- **Notes:** Medium textarea (~20%)
- **Actions:** Sticky footer with Delete (left) and Save (right)
---

## Acceptance Criteria
- [ ] Create `components/TaskPanel.tsx` to replace `TaskModal.tsx`
- [ ] Implement slide-in/out animation (CSS transforms + transitions)
- [ ] Add backdrop overlay with click-outside-to-close
- [ ] Wire up open/close state in `KanbanBoard.tsx`
- [ ] Ensure keyboard accessibility (Escape to close, focus trap)
- [ ] Horizontal compact row for Status + Tags at top
- [ ] Large title input with appropriate styling
- [ ] Description textarea taking ~40% of panel body height
- [ ] Acceptance Criteria textarea taking ~25%
- [ ] Notes textarea taking ~20%
- [ ] Sticky footer with action buttons
- [ ] Panel goes full-width on narrow viewports (<768px)
- [ ] Textareas adjust proportionally
- [ ] Touch-friendly close gesture (swipe right to dismiss?)
- [ ] Remove old `TaskModal.tsx` after panel is stable
- [ ] Smooth animation easing (test different curves)
- [ ] Transition backdrop opacity synced with panel position
- [ ] Focus first field on open (title for new, description for edit?)

## Notes
- Reference: `sample_task.md` shows the level of detail a well-structured task needs
- Tailwind's `transition-transform` and `duration-300` should handle most animation needs
- Consider `framer-motion` only if CSS transitions feel insufficient
- Board columns stay interactive when panel is closed; dimmed but visible when open
- Acceptance Criteria stays free-form markdown (not structured checkbox list) for flexibility
