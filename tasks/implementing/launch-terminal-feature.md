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

**Ghostty "open as tab" limitation (macOS) - SOLVED:**
- Ghostty's `+new-window` CLI action only works on Linux/GTK, not macOS
- No built-in config option to open new instances as tabs in existing window
- Direct binary invocation (`/Applications/Ghostty.app/Contents/MacOS/ghostty`) creates windows that can't be merged with existing Ghostty windows
- `open -na Ghostty --args` also didn't work for merging

**AppleScript solution (2025-01-22):**
- Used AppleScript via `osascript` to create "native" tabs that integrate properly:
  ```applescript
  tell application "Ghostty" to activate
  delay 0.3
  tell application "System Events"
      keystroke "t" using command down
      delay 0.3
      keystroke "{command}"
      keystroke return
  end tell
  ```
- Requires Accessibility permissions for the terminal running the server (e.g., Ghostty)
- Tabs created this way can be merged with other Ghostty windows normally
- Trade-off: Ghostty comes to foreground when launching (acceptable)

**Window stays open after command exits:**
- Added `; echo ""; echo "Press Enter to close..."; read` suffix to commands
- Keeps tab open after Ctrl+C or normal exit, allowing time to merge windows
- Using `echo` + `read` instead of `read -p` for zsh compatibility
- Previous attempts: `exec $SHELL` worked but triggered "running process" warning on tab close

**Shell compatibility:**
- Uses `$SHELL` environment variable (falls back to `/bin/zsh`)
- Escape function for AppleScript strings handles quotes and backslashes

**Future considerations:**
- Abstract terminal app (iTerm, Terminal.app support)
- Linux/Windows support
- Default configs for new projects (auto-detect package.json, etc.)
