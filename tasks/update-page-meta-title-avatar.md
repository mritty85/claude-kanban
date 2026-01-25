# Update Page Meta Title + Avatar

## Id
task_1765882149477

## Status
done

## Tags
- feature-enhancement

## Description
Update the browser tab title and favicon from Vite defaults to Project Kanban branding.
**Changes:**
- Title: "kanban-ui" → "Project Kanban"
- Favicon: vite.svg → kanban.svg (using Lucide's Kanban icon)

## Acceptance Criteria
- [x] Update `<title>` in index.html to "Project Kanban"
- [x] Add kanban.svg to /public folder (Lucide Kanban icon, colored with accent purple #a78bfa)
- [x] Update favicon link in index.html to use kanban.svg
- [x] Remove unused vite.svg from /public folder

## Notes
**Favicon source:** Lucide icons (https://lucide.dev/icons/kanban) - same library used throughout the app. SVG can be downloaded and color-adjusted to match the app's accent purple.
**Alternative:** If you'd prefer a different icon, other good Lucide options are `LayoutDashboard`, `Columns3`, or `ClipboardList`.

## Completed
2025-12-16T10:49:09.477Z
