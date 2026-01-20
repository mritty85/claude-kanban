# Launch Terminal feature

## Id
task_1737417900000

## Status
backlog

## Tags
- new-functionality

## Description
Add a "Launch Terminal" button to the header that opens a modal for managing and executing launch configurations. Each project can define multiple launch configs (dev servers, Claude Code sessions, etc.) that spawn Ghostty terminal windows with the specified commands.

This simplifies the workflow of starting servers and Claude sessions without building full IDE-style process management—just launch and interact in the real terminal.

## Acceptance Criteria
- [ ] Add `launchConfigs` array to project.json schema
- [ ] Create `POST /api/launch` endpoint that spawns Ghostty with command
- [ ] Endpoint constructs: `/Applications/Ghostty.app/Contents/MacOS/ghostty -e "cd {projectPath} && {command}"`
- [ ] Add CRUD endpoints for launch configs (or extend existing project config endpoints)
- [ ] Move Roadmap button to right side of header
- [ ] Move Notes button to right side of header (next to Roadmap)
- [ ] Add "Launch Terminal" button after project switcher (left side)
- [ ] Header layout: `[Project ▼] [Launch Terminal] [Search] [Filters]  ─  [Roadmap] [Notes]`
- [ ] Create LaunchModal component
- [ ] Display list of configured launch commands for current project
- [ ] Show config name and command preview for each item
- [ ] Click on config row to launch immediately (no confirmation)
- [ ] Modal stays open after launch (user may want to launch multiple)
- [ ] Close modal via X button or click outside
- [ ] Add "Add Launch Config" button at bottom of modal
- [ ] Add form shows name and command fields
- [ ] Delete button on each config row (with confirmation)
- [ ] Edit mode for modifying existing configs (separate from list view)
- [ ] Generate unique IDs for new configs (lc_timestamp pattern)

## Notes
**Data model (project.json):**
```json
{
  "boardName": "Kanban UI",
  "launchConfigs": [
    { "id": "lc_1737417900001", "name": "Dev Server", "command": "npm run dev" },
    { "id": "lc_1737417900002", "name": "Claude Code", "command": "claude" },
    { "id": "lc_1737417900003", "name": "Express API", "command": "cd server && npm start" }
  ]
}
```

**Design decisions:**
- Launch immediately on click (no "Run" confirmation)
- Modal stays open after launch (common to start server + Claude)
- Edit mode is separate view, not inline editing
- No process tracking—just spawn and detach
- macOS/Ghostty specific for now (could abstract later)

**Key files to create/modify:**
- `server/routes/launch.js` (new) - spawn endpoint
- `server/services/fileService.js` - launchConfigs in project.json read/write
- `src/components/LaunchModal.tsx` (new) - modal component
- `src/components/KanbanBoard.tsx` - header layout changes
- `src/lib/api.ts` - launch API functions

**Future considerations:**
- Abstract terminal app (iTerm, Terminal.app support)
- Linux/Windows support
- Default configs for new projects (auto-detect package.json, etc.)
