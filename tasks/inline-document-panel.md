# Inline Document Panel with Sidebar Navigation

## Id
task_1739635200000

## Status
uat

## Tags
- feature-enhancement

## Description
Rearchitect the DocumentPanel from a full-viewport modal overlay to an inline panel that emerges from the right edge of the sidebar, leaving the sidebar fully visible and interactive. This enables a fluid document-browsing workflow: click a doc in the sidebar, read/edit it, click another doc — all without closing and reopening panels.

### Current Behavior
```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │  Board content                               │
│ (210px)  │                                              │
│          │                                              │
│ DOCS     │                                              │
│  Notes ◄─┼── click opens full-viewport overlay ──────► │
│  Roadmap │  ┌─────────────────────────┐                 │
│  PRD     │  │ DocumentPanel (fixed)   │  ← covers      │
│          │  │ left:0, z-50            │    sidebar      │
│          │  │ + dark backdrop inset-0 │    entirely     │
│          │  └─────────────────────────┘                 │
└──────────┴──────────────────────────────────────────────┘
```
- Panel: `fixed top-0 left-0`, slides from left edge of viewport
- Backdrop: `fixed inset-0 bg-black/50` covers everything including sidebar
- Sidebar is completely blocked while a document is open
- Switching docs requires: close panel → click new doc → panel reopens

### New Behavior
```
┌──────────┬───────────────────┬──────────────────────────┐
│ Sidebar  │ Document Panel    │  Board content            │
│ (210px)  │ (~550px)          │  (flex-1, compresses)     │
│          │                   │                           │
│ DOCS     │  Notes            │                           │
│ ► Notes  │  ───────────────  │  Columns compress but     │
│   Roadmap│  content here...  │  remain usable            │
│   PRD    │                   │                           │
│          │  [Save & Close]   │                           │
└──────────┴───────────────────┴──────────────────────────┘
```
- Panel is a flex child in the layout, positioned between sidebar and board
- Sidebar remains fully visible and clickable at all times
- Clicking a different doc in the sidebar switches panel content (flush-save first)
- Clicking the active doc again closes the panel (toggle behavior)
- Board content compresses naturally — columns still function
- No dark backdrop overlay

### Interaction Model

| User action | Result |
|---|---|
| Click doc in sidebar (panel closed) | Panel opens with that doc |
| Click **different** doc in sidebar (panel open) | Flush-save current → load new doc (no close/reopen animation) |
| Click **same** doc in sidebar (panel open) | Flush-save → close panel (toggle) |
| Press Escape | Flush-save → close panel |
| Click X button in panel header | Flush-save → close panel |
| Click "Save & Close" button | Flush-save → close panel |

### Layout Architecture

**Current:** Panel and backdrop are `fixed`-positioned elements rendered outside the flex flow, layered above everything via z-index.

**New:** Panel becomes a flex child in the main layout container.

```tsx
<div className="h-full flex">
  <Sidebar />                    {/* w-[210px] flex-shrink-0 — unchanged */}

  {openDocumentSlug && (
    <DocumentPanel />            {/* w-[550px] flex-shrink-0 — NEW position */}
  )}

  <div className="flex-1">      {/* Board content — compresses when panel open */}
    <header>...</header>
    <main>...</main>
  </div>
</div>
```

### Panel Transition

- **Open:** Panel width animates from 0 → 550px (or similar). Use a wrapper div with `overflow: hidden` and `transition: width 250ms ease-out` to avoid text reflow during animation. The inner panel content stays at fixed width.
- **Close:** Width animates 550px → 0, then element unmounts or hides.
- **Switch docs:** No width animation — content fades or swaps instantly since panel is already open.

### Key Implementation Details

1. **Remove backdrop overlay** — No more `fixed inset-0 bg-black/50`. The panel lives in-flow.

2. **Change panel positioning** — From `fixed top-0 left-0` to a flex child. Remove `z-50`.

3. **Border change** — Panel gets `border-r` on its right edge (facing the board), not `border-r` on its left (was facing away from sidebar in old design).

4. **Handle `onOpenDocument` toggle logic** — In `KanbanBoard.tsx`, the callback currently does `setOpenDocumentSlug(slug)`. Change to:
   - If `slug === openDocumentSlug`: flush-save, then `setOpenDocumentSlug(null)` (close/toggle)
   - If `slug !== openDocumentSlug`: flush-save current doc, then `setOpenDocumentSlug(newSlug)` (switch)

5. **`useDocument` hook must handle slug changes** — Currently `activeSlug` is derived from `slug` prop. When slug changes (doc switch), the hook needs to:
   - Flush-save the previous doc's content
   - Reset internal state (content, lastSaved, isEditing)
   - Load the new doc
   - A `useEffect` cleanup or a ref tracking previousSlug can handle this

6. **Panel width** — `w-[550px]` or thereabouts. Should feel spacious for editing but not swallow the board. The board content area (`flex-1`) will compress. At minimum viewport widths, columns may get tight — this is acceptable for the document-editing use case.

7. **Escape key** — Should still close the panel. No change to keybinding behavior.

8. **TaskPanel interaction** — TaskPanel slides from the right (`fixed right-0`). It should continue to work independently. Both can theoretically be open simultaneously (doc panel on left in-flow, task panel overlaying from right). No conflict.

### Files to Modify

| File | Change |
|---|---|
| `src/components/DocumentPanel.tsx` | Remove fixed positioning, backdrop, and z-indexing. Change to flex child layout. Add width transition wrapper. Handle slug switching (content swap without close/reopen). |
| `src/components/KanbanBoard.tsx` | Move `<DocumentPanel>` from after the flex container into the flex flow (between sidebar and main content). Update `onOpenDocument` callback to support toggle and switch behavior. Expose `flushSave` or handle save-before-switch logic. |
| `src/hooks/useDocument.ts` | Handle slug transitions gracefully — flush-save old doc content before loading new doc when slug changes. Reset editing state on slug change. |

### Out of Scope
- Resizable panel width (drag to resize) — future enhancement
- Split view (two docs side by side) — future enhancement
- Tab bar for multiple open docs — future enhancement
- Markdown preview/rendering — separate task

## Acceptance Criteria
- [x] Document panel renders inline as a flex child between sidebar and board content
- [x] Sidebar remains fully visible and interactive when panel is open
- [x] Clicking a doc in sidebar opens the panel with that doc's content
- [x] Clicking a different doc switches content without close/reopen (flush-saves first)
- [x] Clicking the currently-open doc in sidebar toggles the panel closed
- [x] No dark backdrop overlay — panel is in-flow, not modal
- [x] Board content compresses naturally when panel is open
- [x] Panel open/close animates smoothly (width transition)
- [x] Escape key still closes the panel
- [x] X button and Save & Close button still close the panel
- [x] Auto-save (5s debounce) continues to work as before
- [x] SSE-driven reload still works when panel is open
- [x] TaskPanel (right slide-out) still works independently

## Notes
- The VS Code analogy: sidebar is the file explorer, panel is the editor, board is the terminal/output. They coexist without modals.
- This is a UX improvement specifically for the document workflow — users browsing/editing multiple docs in a session shouldn't have to fight modal open/close cycles.
