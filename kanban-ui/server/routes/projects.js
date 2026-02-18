import express from 'express';
import {
  listProjects,
  getCurrentProject,
  getProjectById,
  addProject,
  removeProject,
  updateProject,
  setCurrentProject,
  validateProjectPath
} from '../services/configService.js';
import { switchProject, refreshWatcher } from '../services/watcher.js';
import { ensureDirectories, migrateProjectStructure, getProjectConfig, updateProjectConfig } from '../services/fileService.js';
import { asyncHandler, HttpError } from '../middleware.js';

const router = express.Router();

// List all projects
router.get('/', asyncHandler(async (req, res) => {
  const projects = await listProjects();
  res.json(projects);
}));

// Get current project
router.get('/current', asyncHandler(async (req, res) => {
  const project = await getCurrentProject();
  if (!project) {
    throw new HttpError(404, 'No current project set');
  }
  // Get board name from current project's config
  const config = await getProjectConfig();
  res.json({ ...project, boardName: config.boardName });
}));

// Add a new project
router.post('/', asyncHandler(async (req, res) => {
  const { name, path: projectPath, createTasksDir, scaffold } = req.body;

  if (!name || !projectPath) {
    throw new HttpError(400, 'Name and path are required');
  }

  // Validate the path
  const validation = await validateProjectPath(projectPath, createTasksDir, scaffold !== false);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error,
      canCreate: validation.canCreate
    });
  }

  const project = await addProject(name, projectPath);

  // Refresh watcher to include the new project's directory
  await refreshWatcher();

  res.status(201).json({
    ...project,
    tasksCreated: validation.created || false
  });
}));

// Get a specific project
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id);
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }
  res.json(project);
}));

// Update a project
router.put('/:id', asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.body);

  // If name was updated and this is the current project, also update project.json boardName
  if (req.body.name) {
    const current = await getCurrentProject();
    if (current && current.id === req.params.id) {
      await updateProjectConfig({ boardName: req.body.name });
    } else {
      // For non-current projects, we need to update their project.json directly
      // This requires temporarily switching or writing directly to their path
      const targetProject = await getProjectById(req.params.id);
      if (targetProject) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const rootConfigPath = path.default.join(targetProject.path, 'project.json');
        const legacyConfigPath = path.default.join(targetProject.path, 'tasks', 'project.json');
        // Read from root first, then fallback to legacy location
        let config = {};
        try {
          const content = await fs.default.readFile(rootConfigPath, 'utf-8');
          config = JSON.parse(content);
        } catch {
          try {
            const content = await fs.default.readFile(legacyConfigPath, 'utf-8');
            config = JSON.parse(content);
          } catch {
            // No existing config
          }
        }
        config.boardName = req.body.name;
        // Always write to root location
        await fs.default.writeFile(rootConfigPath, JSON.stringify(config, null, 2), 'utf-8');
      }
    }
  }

  res.json(project);
}));

// Delete a project
router.delete('/:id', asyncHandler(async (req, res) => {
  await removeProject(req.params.id);

  // Refresh watcher to stop watching the removed project's directory
  await refreshWatcher();

  res.status(204).send();
}));

// Switch to a project
router.post('/:id/switch', asyncHandler(async (req, res) => {
  const { broadcast } = req.body;
  const projectId = req.params.id;

  // Get the project to validate it exists
  const project = await getProjectById(projectId);
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  // Update global config (needed for getProjectConfig and ensureDirectories)
  await setCurrentProject(projectId);

  // Only broadcast if explicitly requested (CLI usage)
  // UI switches don't need broadcast - the frontend handles its own reload
  // via state change, and the SSE will reconnect with the new projectId
  if (broadcast) {
    await switchProject(projectId);
  }

  // Ensure directories exist for the project
  await ensureDirectories();
  await migrateProjectStructure();

  // Get board name from project's config
  const config = await getProjectConfig();

  res.json({ ...project, boardName: config.boardName });
}));

// Validate a project path (for UI validation before adding)
router.post('/validate-path', asyncHandler(async (req, res) => {
  const { path: projectPath } = req.body;
  if (!projectPath) {
    throw new HttpError(400, 'Path is required');
  }
  const validation = await validateProjectPath(projectPath, false);
  res.json(validation);
}));

export default router;
