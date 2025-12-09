# Kanban UI Deployment Guide

## Overview

The Kanban UI is a **centralized tool** that can manage tasks across multiple projects. You install it once, then register any project that has (or needs) a `/tasks` folder.

**Key concepts:**
- **One installation** of kanban-ui serves all your projects
- **Global config** at `~/.kanban-ui/config.json` tracks registered projects
- **Each project** has its own `/tasks` folder (can be git-tracked per project)
- **Ports:** Vite runs on `5190`, Express API on `3050` (to avoid conflicts with project dev servers)

---

## Quick Start (New Machine Setup)

### 1. Clone or copy the Kanban UI once

```bash
# Clone to a permanent location (pick one)
git clone <your-kanban-repo> ~/tools/kanban-ui

# Or copy from another machine
scp -r user@other-machine:~/tools/kanban-ui ~/tools/kanban-ui
```

### 2. Install dependencies

```bash
cd ~/tools/kanban-ui
npm install
```

### 3. Start the server

```bash
npm start
```

This will:
- Create `~/.kanban-ui/config.json` automatically (first run only)
- Register the parent directory as "Default Project"
- Start Vite on `http://localhost:5190`
- Start Express API on `http://localhost:3050`

### 4. Open the UI and add your projects

1. Open `http://localhost:5190` in your browser
2. Click the project dropdown (top-left) → **"Manage Projects..."**
3. Add each project:
   - **Name:** Human-readable name (e.g., "Budget App")
   - **Path:** Absolute path to project root (e.g., `/Users/you/projects/budget-app`)
4. If the project doesn't have a `tasks/` folder, you'll be prompted to create it

### 5. Switch between projects

Use the dropdown in the header to switch. Tasks reload automatically.

---

## Adding a New Project

### From the UI (recommended)
1. Click project dropdown → "Manage Projects..."
2. Enter name and absolute path
3. Click "Add Project"
4. If no `tasks/` folder exists, click "Create tasks folder"

### What gets created
```
/your-project/
  /tasks/
    /ideation/
    /planning/
    /backlog/
    /implementing/
    /uat/
    /done/
    project.json          ← Stores board name (auto-created)
```

---

## Configuration Files

### Global Config: `~/.kanban-ui/config.json`
```json
{
  "currentProject": "/Users/you/projects/budget-app",
  "projects": [
    {
      "id": "budget-app",
      "name": "Budget App",
      "path": "/Users/you/projects/budget-app",
      "lastAccessed": "2025-12-09T12:00:00Z"
    },
    {
      "id": "website",
      "name": "Company Website",
      "path": "/Users/you/projects/website",
      "lastAccessed": "2025-12-08T10:00:00Z"
    }
  ]
}
```

- **Machine-specific:** This file is NOT shared between machines
- **Auto-created:** First run creates it with a default project
- **Editable:** You can manually edit this file if needed

### Per-Project Config: `{project}/tasks/project.json`
```json
{
  "boardName": "Budget App"
}
```

- **Shared:** This file IS in your project and can be git-tracked
- **Board name:** Displayed in the header when this project is active

---

## Work Machine Setup (Second Computer)

Since `~/.kanban-ui/config.json` is machine-specific, you'll need to re-register your projects on each machine.

### Steps:
1. Clone/copy `kanban-ui` to a permanent location
2. `cd kanban-ui && npm install`
3. `npm start`
4. Open `http://localhost:5190`
5. Add each project via "Manage Projects..."
   - Use the paths on THIS machine (they may differ from your personal computer)

### Example
Personal machine:
```
/Users/mritty/projects/budget-app
```

Work machine:
```
/Users/msmith/dev/budget-app
```

Both point to the same git repo, just different local paths.

---

## Project Structure

```
~/.kanban-ui/
  config.json                 ← Global config (machine-specific)

~/tools/kanban-ui/            ← Kanban UI installation (one per machine)
  /src/
  /server/
  package.json

~/projects/budget-app/        ← Your project
  /tasks/                     ← Task storage (git-tracked)
    /ideation/
    /planning/
    /backlog/
    /implementing/
    /uat/
    /done/
    project.json
  /src/                       ← Your project code
  CLAUDE.md

~/projects/website/           ← Another project
  /tasks/
    ...
```

---

## Configuring Claude Code for Your Project

Add this to your project's `CLAUDE.md`:

```markdown
## Task Management

This project uses a file-based Kanban system for task management.

### Task Location
Tasks are stored as markdown files in `/tasks/{status}/` directories:
- `/tasks/ideation/` - Rough ideas, not yet defined
- `/tasks/planning/` - Needs design/discussion before ready
- `/tasks/backlog/` - Fully planned and ready to be picked up
- `/tasks/implementing/` - Currently being worked on
- `/tasks/uat/` - Complete, awaiting review
- `/tasks/done/` - Accepted and finished

### Working on Tasks

When asked to work on tasks:
1. Read the top file in `/tasks/backlog/` (lowest number prefix = highest priority)
2. Move the file to `/tasks/implementing/`
3. Update the `## Status` field to `implementing`
4. Implement the work described
5. Check off acceptance criteria as completed
6. Add notes to `## Notes` section for any decisions
7. When complete, move file to `/tasks/uat/`
8. Update the `## Status` field to `uat`

### Task File Format

```markdown
# {Title}

## Status
planning

## Tags
- new-functionality | feature-enhancement | bug | refactor

## Description
{What needs to be done}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two

## Notes
{Implementation notes}
```
```

---

## Running the Kanban UI

### Development (default)
```bash
cd ~/tools/kanban-ui
npm start
```
- Vite: `http://localhost:5190`
- API: `http://localhost:3050`

### Custom ports (if needed)
```bash
PORT=4000 npm run server  # API on port 4000
```

Edit `vite.config.ts` to change Vite port and proxy target.

---

## Tips

### Keep the UI Running
Run `npm start` in a terminal while working. The UI auto-updates when task files change (via SSE).

### Manual Task Creation
Create `.md` files directly in task directories. The UI picks them up automatically via file watching.

### Editing Project Names
Click the project dropdown → "Manage Projects..." → click the pencil icon next to a project name.

### Priority Management
- Drag cards in the UI to reorder (renames files with new priority numbers)
- Or manually rename: `01-` is highest priority, `02-` is next, etc.

### If Node Modules Break After Copying
```bash
rm -rf node_modules && npm install
```
Symlinks in `node_modules/.bin/` can break when copying. Fresh install fixes it.

---

## Troubleshooting

### "Port already in use"
Another process is using 5190 or 3050. Either:
- Kill the other process
- Or change ports in `server/index.js` and `vite.config.ts`

### Projects not showing up
Check `~/.kanban-ui/config.json` exists and has valid paths for this machine.

### Tasks not loading
- Verify the project path exists
- Check that `{path}/tasks/` directory exists
- Look at terminal for server errors

### UI not updating
- Check SSE connection (browser dev tools → Network → EventStream)
- Restart the server: `npm start`
