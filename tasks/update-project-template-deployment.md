# Update Project Template & Folder Structure

## Id
task_1771152117406

## Status
uat

## Tags
- feature-enhancement
- refactor

## Description
Restructure the project folder convention so that each registered project follows a standardized template. Instead of stuffing everything into `/tasks/`, give each concern its own folder at the project root.

### Current structure (everything in /tasks/)
```
{project}/
└── tasks/
    ├── _board.json
    ├── project.json        # Project config
    ├── NOTES.md            # Project notes
    ├── ROADMAP.md          # Roadmap
    └── *.md                # Task files
```

### Target structure
```
{project}/
├── project.json              # Project config (moved to root)
├── CLAUDE.md                 # Skeleton with sections to fill in
├── .claude/
│   └── commands/             # Reusable slash commands
├── documentation/
│   ├── prd.md                # Product requirements (new)
│   ├── roadmap.md            # Roadmap (moved from tasks/)
│   └── notes.md              # Project notes (moved from tasks/)
├── tasks/
│   ├── _board.json           # Column ordering (stays here)
│   └── *.md                  # Task files (stay here)
├── prototypes/
├── style-guide/
└── src/
```

### What the kanban app owns
The app only needs to read/write files it actively manages. Other folders (`prototypes/`, `style-guide/`, `src/`, `.claude/`) are scaffolded for convention but not touched by the app afterward.

**App-managed files:**
- `{project}/project.json` — board name, launch configs
- `{project}/tasks/` — task files + `_board.json`
- `{project}/documentation/notes.md` — project notes
- `{project}/documentation/roadmap.md` — project roadmap
- `{project}/documentation/prd.md` — product requirements doc (new, same panel UX as notes/roadmap)

### Work breakdown

#### 1. Move `project.json` to project root
- Update `fileService.js`: change path construction from `{tasksDir}/project.json` to `{projectPath}/project.json`
- Affects: `readProjectConfig()`, `writeProjectConfig()`, `getLaunchConfigs()`, `addLaunchConfig()`, `updateLaunchConfig()`, `deleteLaunchConfig()`
- The tasks route config endpoints (`GET/PUT /api/tasks/config`) also need updating

#### 2. Move notes & roadmap to `documentation/`
- Update `fileService.js`: change `getProjectNotes()`, `updateProjectNotes()`, `getProjectRoadmap()`, `updateProjectRoadmap()` to read/write from `{projectPath}/documentation/` instead of `{tasksDir}/`
- Rename files: `NOTES.md` → `notes.md`, `ROADMAP.md` → `roadmap.md` (lowercase to match template convention)
- Remove `NOTES.md` and `ROADMAP.md` from the `EXCLUDED_FILES` array in `getAllTasks()` (no longer needed since they won't be in `/tasks/`)

#### 3. Add PRD support
- New functions in `fileService.js`: `getProjectPrd()`, `updateProjectPrd()` — same pattern as notes/roadmap
- New API endpoints: `GET /api/tasks/prd`, `PUT /api/tasks/prd` (or consider moving doc endpoints to their own route prefix)
- New frontend hook: `useProjectPrd.ts` (clone of `useProjectNotes.ts`)
- New frontend component: `PrdPanel.tsx` (clone of `NotesPanel.tsx`)
- Wire into sidebar alongside Notes and Roadmap buttons

#### 4. Auto-migration for existing projects
- On project load, detect the old structure (files in `/tasks/`) and offer/perform migration:
  - If `{tasksDir}/project.json` exists but `{projectPath}/project.json` doesn't → move it up
  - If `{tasksDir}/NOTES.md` exists but `{projectPath}/documentation/notes.md` doesn't → move it
  - If `{tasksDir}/ROADMAP.md` exists but `{projectPath}/documentation/roadmap.md` doesn't → move it
  - Create `documentation/` directory if it doesn't exist during migration
- Log migration actions to console for visibility
- Fallback: if new location doesn't exist but old location does, read from old location (graceful degradation)

#### 5. New project scaffolding
- When registering a new project, create the full template structure:
  - `project.json` at root (with default boardName)
  - `tasks/` with empty `_board.json`
  - `documentation/` with empty `prd.md`, `roadmap.md`, `notes.md`
  - `CLAUDE.md` skeleton at root
  - Empty directories: `prototypes/`, `style-guide/`, `src/`, `.claude/commands/`
- Update `validateProjectPath()` and project creation flow in `configService.js`
- Add option in UI to scaffold vs. just register (for existing projects that already have content)

#### 6. Update file watcher
- The watcher currently only watches `/tasks/` for changes. It should also watch `documentation/` for note/roadmap/prd changes so SSE updates fire when those files are edited externally (e.g., by Claude Code).
- Watch `project.json` at the project root for config changes.

### API endpoint decision
Keep all endpoints under `/api/tasks/` — just change the backend path resolution. Renaming routes is pure churn with zero user value. The API surface can be restructured later if needed, and by then there'll be a better sense of whether `/api/docs/` even makes sense as a namespace.

### File watcher note
Watching `documentation/` is required, not optional. The existing notes and roadmap hooks (`useProjectNotes.ts`, `useProjectRoadmap.ts`) already subscribe to SSE events and live-reload when external edits happen (e.g., Claude Code editing a file). Moving files to `documentation/` without expanding the watcher would regress this behavior. The new PRD panel should follow the same pattern.

## Acceptance Criteria
- [ ] `project.json` is read/written from project root (`{projectPath}/project.json`)
- [ ] Notes are read/written from `{projectPath}/documentation/notes.md`
- [ ] Roadmap is read/written from `{projectPath}/documentation/roadmap.md`
- [ ] New PRD panel available in UI, reading/writing `{projectPath}/documentation/prd.md`
- [ ] Auto-migration moves files from old locations on project load
- [ ] Fallback reads from old location if new location doesn't exist yet
- [ ] New project registration scaffolds the full template structure
- [ ] File watcher detects changes in `documentation/` folder
- [ ] File watcher detects changes to root `project.json`
- [ ] `EXCLUDED_FILES` list in `getAllTasks()` cleaned up (no longer needed for moved files)
- [ ] Existing projects with old structure continue to work (backwards compat)
- [ ] All launch config operations work with `project.json` at new location

## Notes
**Supersedes:** `change-tasks-to-project-management-folder-naming-c.md` — that task proposed renaming `/tasks/` to `/project-management/`. This task takes a different approach: keep `/tasks/` for tasks, give everything else its own folder.

**Migration is non-destructive:** Files are moved, not deleted. If migration fails mid-way, the fallback logic reads from whichever location has the file.

**Folders the app scaffolds but doesn't manage:** `prototypes/`, `style-guide/`, `src/`, `.claude/commands/` are created empty as project convention scaffolding. The app never reads/writes to them. They can be removed from scaffolding if the user prefers minimal setup.

**CLAUDE.md template:** The scaffolded CLAUDE.md should be a minimal skeleton with section headers (Project Overview, Architecture, Development, etc.) — enough structure to be useful but not prescriptive. Content depends on the project.
