import express from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask,
  getProjectConfig,
  updateProjectConfig,
  getProjectNotes,
  updateProjectNotes,
  getProjectRoadmap,
  updateProjectRoadmap
} from '../services/fileService.js';
import { addSSEClient } from '../services/watcher.js';
import { getCurrentProject } from '../services/configService.js';

const router = express.Router();

router.get('/events', async (req, res) => {
  let projectId = req.query.project;

  // If no project specified, use the current project from global config
  if (!projectId) {
    const current = await getCurrentProject();
    projectId = current?.id;
  }

  if (!projectId) {
    return res.status(400).json({ error: 'No project specified and no current project set' });
  }

  addSSEClient(res, projectId);
});

router.get('/', async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.json(tasks);
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Simplified move - no fromStatus needed
router.post('/move', async (req, res) => {
  try {
    const { filename, toStatus, newPriority } = req.body;
    const task = await moveTask(filename, toStatus, newPriority);
    res.json(task);
  } catch (err) {
    console.error('Error moving task:', err);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

router.post('/reorder', async (req, res) => {
  try {
    const { status, orderedIds } = req.body;
    const tasks = await reorderTasks(status, orderedIds);
    res.json(tasks);
  } catch (err) {
    console.error('Error reordering tasks:', err);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

router.get('/config', async (req, res) => {
  try {
    const config = await getProjectConfig();
    res.json(config);
  } catch (err) {
    console.error('Error getting config:', err);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const config = await updateProjectConfig(req.body);
    res.json(config);
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.get('/notes', async (req, res) => {
  try {
    const content = await getProjectNotes();
    res.json({ content });
  } catch (err) {
    console.error('Error getting notes:', err);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

router.put('/notes', async (req, res) => {
  try {
    const { content } = req.body;
    await updateProjectNotes(content);
    res.json({ content });
  } catch (err) {
    console.error('Error updating notes:', err);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

router.get('/roadmap', async (req, res) => {
  try {
    const content = await getProjectRoadmap();
    res.json({ content });
  } catch (err) {
    console.error('Error getting roadmap:', err);
    res.status(500).json({ error: 'Failed to get roadmap' });
  }
});

router.put('/roadmap', async (req, res) => {
  try {
    const { content } = req.body;
    await updateProjectRoadmap(content);
    res.json({ content });
  } catch (err) {
    console.error('Error updating roadmap:', err);
    res.status(500).json({ error: 'Failed to update roadmap' });
  }
});

// Wildcard routes MUST come last (after specific routes like /config, /notes, /roadmap)
router.put('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const task = await updateTask(filename, req.body);
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await deleteTask(filename);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
