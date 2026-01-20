# Launch Terminal feature

## Id
task_1737417900000

## Status
implementing

## Tags
- new-functionality

## Description
Add a "Launch Terminal" button to the header that opens a modal for managing and executing launch configurations. Each project can define multiple launch configs (dev servers, Claude Code sessions, etc.) that spawn Ghostty terminal windows with the specified commands.

This simplifies the workflow of starting servers and Claude sessions without building full IDE-style process management—just launch and interact in the real terminal.

## Acceptance Criteria
- [x] Add `launchConfigs` array to project.json schema
- [x] Create `POST /api/launch` endpoint that spawns Ghostty with command
- [x] Endpoint constructs: `/Applications/Ghostty.app/Contents/MacOS/ghostty -e "cd {projectPath} && {command}"`
- [x] Add CRUD endpoints for launch configs (or extend existing project config endpoints)
- [x] Move Roadmap button to right side of header
- [x] Move Notes button to right side of header (next to Roadmap)
- [x] Add "Launch Terminal" button after project switcher (left side)
- [x] Header layout: `[Project ▼] [Launch Terminal] [Search] [Filters]  ─  [Roadmap] [Notes]`
- [x] Create LaunchModal component
- [x] Display list of configured launch commands for current project
- [x] Show config name and command preview for each item
- [x] Click on config row to launch immediately (no confirmation)
- [x] Modal stays open after launch (user may want to launch multiple)
- [x] Close modal via X button or click outside
- [x] Add "Add Launch Config" button at bottom of modal
- [x] Add form shows name and command fields
- [x] Delete button on each config row (with confirmation)
- [x] Edit mode for modifying existing configs (separate from list view)
- [x] Generate unique IDs for new configs (lc_timestamp pattern)

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

**Implementation notes:**
- Added optional `workingDir` field to launch configs - can be relative (to project root) or absolute path
- Ghostty's `-e` flag requires wrapping compound commands in a shell: `spawn(ghostty, ['-e', '/bin/bash', '-c', shellCommand])`
- Without the `/bin/bash -c` wrapper, commands with `&&` fail because Ghostty passes them directly to login

**Ghostty "open as tab" limitation (macOS):**
- Ghostty's `+new-window` CLI action only works on Linux/GTK, not macOS
- No built-in config option to open new instances as tabs in existing window
- Possible workaround: AppleScript to activate Ghostty → simulate Cmd+T → execute command
- Decided to skip for now - always opens new window. Revisit if needed.

**Future considerations:**
- Abstract terminal app (iTerm, Terminal.app support)
- Linux/Windows support
- Default configs for new projects (auto-detect package.json, etc.)
- Open as tab in existing Ghostty window (requires AppleScript workaround on macOS)
