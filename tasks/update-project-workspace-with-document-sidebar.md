# Update Project Workspace with Document Sidebar

## Id
task_1771104463845

## Status
implementing

## Tags
- new-functionality
- feature-enhancement

## Description
Add a left sidebar to the board layout that houses document panels (Roadmap, Notes), the Launch Terminal button, and the Board/List view toggle. This declutters the header and gives frequently-used tools a persistent, dedicated home.

**Reference prototype:** `style-guide/sidebar-prototype.html`

### Layout Change

**Current layout:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Project ▾] [Launch] [View]   [Search] [Filter] [Roadmap] [Notes] [+New] │
├──────────────────────────────────────────────────────────────────────────┤
│ Ideation | Planning | Backlog | Implementing | UAT | Done                │
└──────────────────────────────────────────────────────────────────────────┘
```

**New layout:**
```
┌──────────┬───────────────────────────────────────────────────┐
│ Project ▾│  Board Name   14 tasks   [Search] [Filter] [+New] │
│          ├───────────────────────────────────────────────────┤
│ [Board]  │                                                    │
│ [List]   │  Ideation | Planning | Backlog | Impl | UAT | Done │
│──────────│                                                    │
│ TOOLS    │                                                    │
│ Launch   │                                                    │
│──────────│                                                    │
│ DOCS     │                                                    │
│ Roadmap  │                                                    │
│ Notes    │                                                    │
│          │                                                    │
│     Settings                                                  │
└──────────┴───────────────────────────────────────────────────┘
```

### What moves to the sidebar

| Control | Currently | Sidebar location |
|---|---|---|
| ProjectSwitcher | Header left | Sidebar top |
| Board/List toggle | Header left (icon button) | Sidebar segmented control below project |
| Launch Terminal | Header left (button) | Sidebar "Tools" section |
| Roadmap | Header right (button) | Sidebar "Documents" section |
| Notes | Header right (button) | Sidebar "Documents" section |

### What stays in the header

| Control | Notes |
|---|---|
| Board name + task count | Left side, display font |
| SearchBar | Right side, unchanged |
| FilterDropdown | Right side, unchanged |
| + New Task | Right side, primary action, unchanged |

### Sidebar Specs

- **Width:** ~210px fixed, dark background (`--color-bg-elevated` or similar)
- **Border:** right border using `--color-border-subtle`
- **Project switcher:** Icon + project name + chevron, triggers existing project dropdown
- **View toggle:** Segmented control (Board / List) with icons, replaces the header toggle button
- **Section labels:** "TOOLS" and "DOCUMENTS" — 10px uppercase, muted color, 0.08em tracking
- **Sidebar items:** Icon + label, 12.5px Instrument Sans, hover highlight, active state with left accent bar
- **Launch Terminal:** Shows existing badge with config count
- **Roadmap / Notes:** Click opens the existing slide-out panels (RoadmapPanel, NotesPanel) — no behavior change, just trigger location moves
- **Settings:** Footer item at bottom of sidebar, future use

### Implementation Approach

1. **Create `Sidebar.tsx` component** — new component with its own nav state
2. **Refactor `KanbanBoard.tsx` layout** — wrap in flex container: `<Sidebar />` + main content area
3. **Move state triggers** — `setIsLaunchModalOpen`, `setIsRoadmapPanelOpen`, `setIsNotesPanelOpen`, `viewMode`/`setViewMode` passed as props to Sidebar
4. **Remove moved buttons from header** — Launch, View toggle, Roadmap, Notes buttons removed from header JSX
5. **Move ProjectSwitcher** — from header to sidebar top
6. **Simplify header** — board name + count on left, search + filter + new task on right

### Files to Modify

| File | Change |
|---|---|
| `kanban-ui/src/components/Sidebar.tsx` | **New** — sidebar component |
| `kanban-ui/src/components/KanbanBoard.tsx` | Refactor layout, move state triggers, simplify header |
| `kanban-ui/src/index.css` | Add sidebar CSS variables if needed |

### Out of Scope (for now)

- Additional document types (CLAUDE.md, PRD) — will be added later
- Sidebar collapse/expand toggle
- Sidebar keyboard shortcuts

## Acceptance Criteria
- [ ] Left sidebar renders with ~210px width next to the board
- [ ] ProjectSwitcher appears at top of sidebar and functions as before
- [ ] Board/List view toggle in sidebar as segmented control, replaces header icon button
- [ ] "Tools" section with Launch Terminal item that opens LaunchModal
- [ ] "Documents" section with Roadmap and Notes items that open their existing panels
- [ ] Header simplified to: board name + count | search + filter + new task
- [ ] All existing functionality preserved — panels, modals, view switching work as before
- [ ] Sidebar uses project design system (Instrument Sans display, Source Code Pro body, dark palette)

## Notes
- Prototype reviewed and approved: `style-guide/sidebar-prototype.html`
- Tools section positioned above Documents section per user preference
- Roadmap and Notes panels continue to slide from left — sidebar just changes where the trigger lives
