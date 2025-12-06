# Kanban UI Deployment Guide

## Quick Start (New Project)

### 1. Copy the Kanban UI to your project

```bash
# From your project root
cp -r ~/path/to/kanban-ui ./kanban

# Or if you keep a template
cp -r ~/templates/kanban-ui ./kanban
```

### 2. Install dependencies

```bash
cd kanban
npm install
```

### 3. Create task directories

```bash
mkdir -p tasks/{ideation,backlog,ready,in-progress,uat,done}
```

Or let the server create them automatically on first run.

### 4. Start the Kanban UI

```bash
cd kanban
npm start
```

Opens at `http://localhost:5173`

---

## Project Structure After Setup

```
/your-project/
  /kanban/                  ← Kanban UI app
    /src/
    /server/
    package.json
    CLAUDE.md               ← For improving the tool itself
  /tasks/                   ← Task files (created automatically or manually)
    /ideation/
    /backlog/
    /ready/
    /in-progress/
    /uat/
    /done/
  /src/                     ← Your actual project code
  CLAUDE.md                 ← Your project's Claude instructions
```

---

## Configuring Claude Code for Your Project

### Option A: Add to Project's CLAUDE.md

Add this section to your project's `CLAUDE.md` file:

```markdown
## Task Management

This project uses a file-based Kanban system for task management.

### Task Location
Tasks are stored as markdown files in `/tasks/{status}/` directories:
- `/tasks/ideation/` - Rough ideas, not yet defined
- `/tasks/backlog/` - Defined but not prioritized
- `/tasks/ready/` - Ready for Claude to pick up (START HERE)
- `/tasks/in-progress/` - Currently being worked on
- `/tasks/uat/` - Complete, awaiting review
- `/tasks/done/` - Accepted and finished

### Working on Tasks

When asked to work on tasks:
1. Read the top file in `/tasks/ready/` (lowest number prefix)
2. Move the file to `/tasks/in-progress/`
3. Update the `## Status` field to `in-progress`
4. Implement the work described
5. Check off acceptance criteria as completed
6. Add notes to `## Notes` section for any decisions or blockers
7. When complete, move file to `/tasks/uat/`
8. Update the `## Status` field to `uat`
9. Check `/tasks/ready/` for next task

### Task File Format

```markdown
# {Title}

## Status
ready

## Tags
- new-functionality | feature-enhancement | bug | refactor

## Description
{What needs to be done}

## Acceptance Criteria
- [ ] Criterion one
- [ ] Criterion two

## Notes
{Add implementation notes here}
```

### If Blocked

If you encounter a blocker or need clarification:
1. Update the `## Notes` section with your question/blocker
2. Leave the task in its current state
3. Stop and ask for guidance
```

### Option B: Standalone Instructions File

Create `/tasks/CLAUDE-INSTRUCTIONS.md` in the tasks directory:

```markdown
# Task Management Instructions for Claude

## Overview
This directory contains tasks in a Kanban workflow. Each subdirectory represents a status column.

## Workflow
1. Check `/ready/` for tasks to work on
2. Pick the top task (lowest number prefix = highest priority)
3. Move to `/in-progress/` and update status
4. Complete the work
5. Move to `/uat/` when done

## File Format
Tasks are markdown with sections: Status, Tags, Description, Acceptance Criteria, Notes

## Priority
Files are numbered: `01-task.md` is higher priority than `02-task.md`

## When Stuck
Update the Notes section and ask for help. Don't move the task.
```

---

## Prompts for Claude Code

### Starting a Work Session

```
Please check /tasks/ready/ and begin working on the highest priority task.
Follow the task management workflow in CLAUDE.md.
```

### Checking Task Status

```
What tasks are currently in progress? What's in the ready queue?
```

### Creating Tasks via Claude

```
Create a new task in /tasks/backlog/ for: [description]
Use the standard task file format with appropriate tags.
```

### Reviewing Completed Work

```
Check /tasks/uat/ and summarize what's ready for review.
```

### Moving Tasks After Review

```
I've reviewed 01-feature-name.md in /tasks/uat/ - it looks good.
Please move it to /tasks/done/.
```

---

## Tips

### Keep the UI Running
Run `npm start` in the `/kanban` directory while working. The UI auto-updates when files change.

### Manual Task Creation
You can create `.md` files directly in the task directories. The UI will pick them up automatically.

### Priority Management
- Drag cards in the UI to reorder (renames files with new numbers)
- Or manually rename files: `01-` is highest priority

### Multiple Projects
Each project gets its own `/tasks` directory. The Kanban UI reads from `../tasks` relative to where it runs.

### Custom Tasks Directory
Set the `TASKS_DIR` environment variable:
```bash
TASKS_DIR=/path/to/tasks npm start
```

---

## Recommended Workflow

1. **You:** Add tasks to Ideation/Backlog via the UI
2. **You:** Move prioritized tasks to Ready
3. **Claude:** Works through Ready queue → In Progress → UAT
4. **You:** Review UAT items, move to Done or back to Ready with feedback
5. **Repeat**

The UI gives you visibility; Claude operates on the same files autonomously.
