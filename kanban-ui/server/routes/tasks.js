import express from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask,
  getProjectConfig,
  updateProjectConfig
} from '../services/fileService.js';
import { addSSEClient } from '../services/watcher.js';
import { getCurrentProject } from '../services/configService.js';
import { asyncHandler } from '../middleware.js';

const router = express.Router();

router.get('/events', asyncHandler(async (req, res) => {
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
}));

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await getAllTasks();
  res.json(tasks);
}));

router.post('/', asyncHandler(async (req, res) => {
  const task = await createTask(req.body);
  res.status(201).json(task);
}));

// Simplified move - no fromStatus needed
router.post('/move', asyncHandler(async (req, res) => {
  const { filename, toStatus, newPriority } = req.body;
  const task = await moveTask(filename, toStatus, newPriority);
  res.json(task);
}));

router.post('/reorder', asyncHandler(async (req, res) => {
  const { status, orderedIds } = req.body;
  const tasks = await reorderTasks(status, orderedIds);
  res.json(tasks);
}));

router.get('/config', asyncHandler(async (req, res) => {
  const config = await getProjectConfig();
  res.json(config);
}));

router.put('/config', asyncHandler(async (req, res) => {
  const config = await updateProjectConfig(req.body);
  res.json(config);
}));

// Wildcard routes MUST come last (after specific routes like /config)
router.put('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const task = await updateTask(filename, req.body);
  res.json(task);
}));

router.delete('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  await deleteTask(filename);
  res.status(204).send();
}));

export default router;
