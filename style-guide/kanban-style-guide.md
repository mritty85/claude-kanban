# Style Guide: Local Kanban Task Manager

A visual and interaction design reference for the Kanban UI. Pairs with `kanban-task-manager-prd.md`.

---

## Design Philosophy

**Minimal. Utilitarian. Focused.**

Inspired by Linear's restraint and VS Code's functional density. The interface should feel like a tool, not a destination—it exists to give you visibility into work, then get out of the way.

- No decorative elements that don't serve a purpose
- Information density over whitespace
- Muted base palette with purposeful color accents
- Monospace typography reinforces the "dev tool" aesthetic

---

## Color System

### Base Palette (Dark Mode Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0d0d12` | App background |
| `--bg-surface` | `#16161e` | Cards, panels, modals |
| `--bg-elevated` | `#1e1e28` | Hover states, dropdowns |
| `--border-subtle` | `#2a2a3c` | Dividers, card borders |
| `--border-emphasis` | `#3d3d56` | Focus rings, active borders |
| `--text-primary` | `#e2e2e9` | Headings, primary content |
| `--text-secondary` | `#9090a0` | Descriptions, metadata |
| `--text-muted` | `#5c5c6e` | Placeholders, disabled states |

### Accent Colors

Used sparingly for interactive elements and status indication.

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#7c5cff` | Primary actions, focus states |
| `--accent-primary-hover` | `#8d70ff` | Hover on primary accent |
| `--accent-teal` | `#2dd4bf` | Success states, positive actions |
| `--accent-blue` | `#38bdf8` | Links, informational highlights |

### Tag Colors

Each tag type gets a distinct, muted color. These sit on `--bg-surface` and should feel integrated, not loud.

| Tag | Background | Text |
|-----|------------|------|
| `new-functionality` | `#2e1f5e` | `#a78bfa` |
| `feature-enhancement` | `#1e3a5f` | `#7dd3fc` |
| `bug` | `#4a1d1d` | `#f87171` |
| `refactor` | `#1a3d3d` | `#5eead4` |

**Implementation note:** Use `bg-opacity` or RGBA values to keep tag backgrounds subtle. The text color carries the distinction.

---

## Typography

### Font Stack

```css
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Use JetBrains Mono for everything. The monospace aesthetic reinforces the dev-tool feel and maintains visual consistency.

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Column header | `13px` | `600` | `1.2` |
| Card title | `14px` | `500` | `1.3` |
| Card description | `12px` | `400` | `1.5` |
| Tag label | `11px` | `500` | `1` |
| Form label | `12px` | `500` | `1.2` |
| Form input | `13px` | `400` | `1.4` |
| Button text | `13px` | `500` | `1` |

### Text Truncation

Card descriptions show **2 lines** max, then truncate with ellipsis:

```css
.card-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## Spacing System

Use a 4px base unit. Keep spacing tight—this is a dense, utilitarian interface.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Inline spacing, tag gaps |
| `--space-2` | `8px` | Card padding, element gaps |
| `--space-3` | `12px` | Section spacing |
| `--space-4` | `16px` | Column gaps |
| `--space-5` | `24px` | Major section breaks |

---

## Layout

### Kanban Board

- **6 columns**, equal width, horizontal scroll if viewport is narrow
- **Column gap:** `--space-4` (16px)
- **Card gap:** `--space-2` (8px) vertical stacking
- **Column min-width:** `280px`
- **Column max-width:** `320px`

### Column Structure

```
┌─────────────────────────┐
│ Column Header           │  ← Sticky, uppercase, muted
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Card                │ │  ← Draggable
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Card                │ │
│ └─────────────────────┘ │
│         ...             │
└─────────────────────────┘
```

---

## Components

### Card

The primary UI element. Keep it compact but scannable.

**Structure:**
```
┌───────────────────────────────────┐
│ Title                             │
│ ┌─────┐ ┌──────────────┐ ┌─────┐  │
│ │ tag │ │ tag          │ │ tag │  │
│ └─────┘ └──────────────┘ └─────┘  │
│ Description text that can span    │
│ two lines before truncating...    │
└───────────────────────────────────┘
```

**States:**
| State | Treatment |
|-------|-----------|
| Default | `--bg-surface`, `--border-subtle` border |
| Hover | `--bg-elevated`, `--border-emphasis` border |
| Dragging | Slight scale (`1.02`), elevated shadow, reduced opacity (`0.9`) |
| Drop target | `--accent-primary` dashed border |

**Padding:** `--space-3` (12px)
**Border radius:** `6px`
**Border:** `1px solid var(--border-subtle)`

### Tags

Small, pill-shaped badges. Should feel like metadata, not decoration.

**Sizing:**
- Padding: `2px 8px`
- Border radius: `4px`
- Font: `11px`, weight `500`

**Spacing:** `--space-1` (4px) gap between tags

### Column Header

Minimal, almost invisible. The column content is what matters.

- Uppercase, letter-spacing `0.05em`
- Color: `--text-muted`
- Font: `13px`, weight `600`
- Padding-bottom: `--space-3`
- Optional: task count badge (same style as tags, neutral color)

### Buttons

Two variants: primary (accent) and ghost (minimal).

**Primary:**
- Background: `--accent-primary`
- Text: `#ffffff`
- Padding: `8px 16px`
- Border radius: `6px`
- Hover: `--accent-primary-hover`

**Ghost:**
- Background: transparent
- Text: `--text-secondary`
- Border: `1px solid var(--border-subtle)`
- Hover: `--bg-elevated`, text becomes `--text-primary`

### Form Inputs

Clean, borderless appearance that activates on focus.

- Background: `--bg-elevated`
- Border: `1px solid transparent` → `--border-emphasis` on focus
- Border radius: `6px`
- Padding: `10px 12px`
- Focus: subtle box-shadow with `--accent-primary` at low opacity

### Modal / Side Panel

For task creation and editing.

- Background: `--bg-surface`
- Border: `1px solid var(--border-subtle)`
- Border radius: `8px`
- Overlay: `rgba(0, 0, 0, 0.6)` backdrop
- Max-width: `480px`
- Padding: `--space-5` (24px)

---

## Interaction & Motion

Keep animations functional, not decorative. Everything should feel snappy.

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Hover transitions | `150ms` | `ease-out` |
| Card drag | `200ms` | `ease-in-out` |
| Modal open/close | `200ms` | `ease-out` |
| Column reorder | `250ms` | `ease-in-out` |

### Drag & Drop

- **Pickup:** Slight scale up (`1.02`), add shadow
- **Dragging:** Reduce opacity to `0.9`, cursor `grabbing`
- **Drop zone:** Show dashed border with `--accent-primary`
- **Drop:** Animate card into position, remove shadow

### Focus States

All interactive elements need visible focus for keyboard navigation:

```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

---

## Iconography

Use a minimal icon set. Lucide or Heroicons (outline style) work well.

**Size:** `16px` for inline, `20px` for buttons
**Color:** `--text-secondary`, becomes `--text-primary` on hover

Common icons needed:
- `plus` — Add task
- `search` — Search input
- `filter` — Filter dropdown
- `grip-vertical` — Drag handle (optional, or just make whole card draggable)
- `x` — Close modal
- `check` — Acceptance criteria
- `circle` — Unchecked criteria

---

## Project Identification

When this template is dropped into a new project, surface the project context with a simple header.

**Placement:** Top-left of the board, above columns
**Content:** Project name + optional type label

```
┌──────────────────────────────────────────────────────────┐
│  Kanban · Client Portal Redesign                         │
└──────────────────────────────────────────────────────────┘
```

**Styling:**
- Project name: `--text-primary`, `16px`, weight `600`
- "Kanban ·" prefix: `--text-muted`, weight `400`

This should be hardcoded per project in a config file or environment variable.

---

## CSS Variables Summary

```css
:root {
  /* Base */
  --bg-base: #0d0d12;
  --bg-surface: #16161e;
  --bg-elevated: #1e1e28;
  --border-subtle: #2a2a3c;
  --border-emphasis: #3d3d56;
  
  /* Text */
  --text-primary: #e2e2e9;
  --text-secondary: #9090a0;
  --text-muted: #5c5c6e;
  
  /* Accents */
  --accent-primary: #7c5cff;
  --accent-primary-hover: #8d70ff;
  --accent-teal: #2dd4bf;
  --accent-blue: #38bdf8;
  
  /* Tags */
  --tag-new-bg: #2e1f5e;
  --tag-new-text: #a78bfa;
  --tag-feature-bg: #1e3a5f;
  --tag-feature-text: #7dd3fc;
  --tag-bug-bg: #4a1d1d;
  --tag-bug-text: #f87171;
  --tag-refactor-bg: #1a3d3d;
  --tag-refactor-text: #5eead4;
  
  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  
  /* Motion */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-in-out;
}
```

---

## File Reference

Keep this file at `/kanban-ui/STYLE-GUIDE.md` alongside the component source.

When implementing, reference this guide for all visual decisions. If something isn't covered here, default to: **minimal, muted, monospace**.
