# Change tasks to project management folder naming convention

## Id
task_1768948578134

## Status
planning

## Tags
- feature-enhancement

## Description
Rename the default task folder from `/tasks/` to `/project-management/` to better reflect the expanded scope of contents (tasks, roadmap, notes, project config). Make the folder name configurable per-project to allow gradual migration without breaking existing setups.

## Acceptance Criteria
- [ ] Add `folderName` property to project entries in global config schema
- [ ] Add `defaultFolderName` to global config (default: `"project-management"`)
- [ ] Update `configService.js` to read folder name per-project, falling back to default
- [ ] Update `getTasksDir()` in `fileService.js` to use configured folder name
- [ ] Update `validateProjectPath()` to check for configured folder name
- [ ] Update project registration to use default folder name for new projects
- [ ] Update watcher to use configured folder name when switching projects
- [ ] Existing projects with `/tasks/` continue working (backwards compatible)
- [ ] New projects default to `/project-management/`
- [ ] Add UI option in project settings to view/change folder name (optional)

## Notes
**Motivation:** The `/tasks/` folder now contains more than just tasks—it includes ROADMAP.md, project.json config, and potentially notes. "project-management" better describes this scope.

**Migration path:** No forced migration. Users can:
1. Rename folder manually in filesystem
2. Update `folderName` in global config (or let app detect it)
3. Or keep using `/tasks/` indefinitely

**Config schema change:**
```json
// ~/.kanban-ui/config.json
{
  "defaultFolderName": "project-management",
  "projects": [
    {
      "id": "abc123",
      "name": "Kanban UI",
      "path": "/path/to/project",
      "folderName": "tasks"  // optional, falls back to defaultFolderName
    }
  ]
}
```

**Key files to modify:**
- `server/services/configService.js` - folder name resolution
- `server/services/fileService.js` - `getTasksDir()` function
- `server/services/watcher.js` - path construction
- `server/routes/projects.js` - project validation/registration
