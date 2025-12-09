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
import { switchProject } from '../services/watcher.js';
import { ensureDirectories, getProjectConfig, updateProjectConfig } from '../services/fileService.js';

const router = express.Router();

// List all projects
router.get('/', async (req, res) => {
  try {
    const projects = await listProjects();
    // Enrich with board names from each project's project.json
    const enriched = await Promise.all(
      projects.map(async (project) => {
        try {
          // Temporarily we can't easily get another project's config
          // since getProjectConfig uses current project
          // For now, just return without boardName enrichment
          return project;
        } catch {
          return project;
        }
      })
    );
    res.json(enriched);
  } catch (err) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Get current project
router.get('/current', async (req, res) => {
  try {
    const project = await getCurrentProject();
    if (!project) {
      return res.status(404).json({ error: 'No current project set' });
    }
    // Get board name from current project's config
    const config = await getProjectConfig();
    res.json({ ...project, boardName: config.boardName });
  } catch (err) {
    console.error('Error getting current project:', err);
    res.status(500).json({ error: 'Failed to get current project' });
  }
});

// Add a new project
router.post('/', async (req, res) => {
  try {
    const { name, path: projectPath, createTasksDir } = req.body;

    if (!name || !projectPath) {
      return res.status(400).json({ error: 'Name and path are required' });
    }

    // Validate the path
    const validation = await validateProjectPath(projectPath, createTasksDir);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        canCreate: validation.canCreate
      });
    }

    const project = await addProject(name, projectPath);
    res.status(201).json({
      ...project,
      tasksCreated: validation.created || false
    });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get a specific project
router.get('/:id', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('Error getting project:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
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
          const configPath = path.default.join(targetProject.path, 'tasks', 'project.json');
          try {
            const content = await fs.default.readFile(configPath, 'utf-8');
            const config = JSON.parse(content);
            config.boardName = req.body.name;
            await fs.default.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
          } catch {
            // project.json may not exist yet, create it
            await fs.default.writeFile(configPath, JSON.stringify({ boardName: req.body.name }, null, 2), 'utf-8');
          }
        }
      }
    }

    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    await removeProject(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error removing project:', err);
    res.status(400).json({ error: err.message });
  }
});

// Switch to a project
router.post('/:id/switch', async (req, res) => {
  try {
    const project = await setCurrentProject(req.params.id);

    // Ensure directories exist for the new project
    await ensureDirectories();

    // Switch watcher and notify clients
    await switchProject(req.params.id);

    // Get board name from new project's config
    const config = await getProjectConfig();

    res.json({ ...project, boardName: config.boardName });
  } catch (err) {
    console.error('Error switching project:', err);
    res.status(400).json({ error: err.message });
  }
});

// Validate a project path (for UI validation before adding)
router.post('/validate-path', async (req, res) => {
  try {
    const { path: projectPath } = req.body;
    if (!projectPath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    const validation = await validateProjectPath(projectPath, false);
    res.json(validation);
  } catch (err) {
    console.error('Error validating path:', err);
    res.status(500).json({ error: 'Failed to validate path' });
  }
});

export default router;
