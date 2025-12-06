import express from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask
} from '../services/fileService.js';
import { addSSEClient } from '../services/watcher.js';

const router = express.Router();

router.get('/events', (req, res) => {
  addSSEClient(res);
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

router.put('/:status/:filename', async (req, res) => {
  try {
    const { status, filename } = req.params;
    const task = await updateTask(status, filename, req.body);
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.post('/move', async (req, res) => {
  try {
    const { fromStatus, filename, toStatus, newPriority } = req.body;
    const task = await moveTask(fromStatus, filename, toStatus, newPriority);
    res.json(task);
  } catch (err) {
    console.error('Error moving task:', err);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

router.post('/reorder', async (req, res) => {
  try {
    const { status, orderedFilenames } = req.body;
    const tasks = await reorderTasks(status, orderedFilenames);
    res.json(tasks);
  } catch (err) {
    console.error('Error reordering tasks:', err);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

router.delete('/:status/:filename', async (req, res) => {
  try {
    const { status, filename } = req.params;
    await deleteTask(status, filename);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
