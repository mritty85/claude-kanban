import express from 'express';
import { spawn } from 'child_process';
import {
  getLaunchConfigs,
  addLaunchConfig,
  updateLaunchConfig,
  deleteLaunchConfig
} from '../services/fileService.js';
import { getCurrentProjectPath } from '../services/configService.js';

const router = express.Router();

// List all launch configs for current project
router.get('/configs', async (req, res) => {
  try {
    const configs = await getLaunchConfigs();
    res.json(configs);
  } catch (err) {
    console.error('Error listing launch configs:', err);
    res.status(500).json({ error: 'Failed to list launch configs' });
  }
});

// Add a new launch config
router.post('/configs', async (req, res) => {
  try {
    const { name, command, workingDir } = req.body;

    if (!name || !command) {
      return res.status(400).json({ error: 'Name and command are required' });
    }

    const config = await addLaunchConfig({ name, command, workingDir });
    res.status(201).json(config);
  } catch (err) {
    console.error('Error adding launch config:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update a launch config
router.put('/configs/:id', async (req, res) => {
  try {
    const { name, command, workingDir } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (command !== undefined) updates.command = command;
    if (workingDir !== undefined) updates.workingDir = workingDir;

    const config = await updateLaunchConfig(req.params.id, updates);
    res.json(config);
  } catch (err) {
    console.error('Error updating launch config:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete a launch config
router.delete('/configs/:id', async (req, res) => {
  try {
    await deleteLaunchConfig(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting launch config:', err);
    res.status(400).json({ error: err.message });
  }
});

// Launch a terminal with a config
router.post('/:id', async (req, res) => {
  try {
    const configs = await getLaunchConfigs();
    const config = configs.find(c => c.id === req.params.id);

    if (!config) {
      return res.status(404).json({ error: 'Launch config not found' });
    }

    const projectPath = await getCurrentProjectPath();

    // Determine working directory - use config's workingDir if set, otherwise project root
    let workingDir = projectPath;
    if (config.workingDir) {
      // If workingDir is relative, resolve it against project path
      if (config.workingDir.startsWith('/')) {
        workingDir = config.workingDir;
      } else {
        workingDir = `${projectPath}/${config.workingDir}`;
      }
    }

    // Spawn Ghostty terminal with the command
    // Ghostty's -e flag executes commands directly, so we need to wrap
    // compound commands (cd && ...) in a shell invocation
    const ghosttyPath = '/Applications/Ghostty.app/Contents/MacOS/ghostty';
    const shellCommand = `cd "${workingDir}" && ${config.command}`;

    const child = spawn(ghosttyPath, ['-e', '/bin/bash', '-c', shellCommand], {
      detached: true,
      stdio: 'ignore'
    });

    // Unref so the parent process doesn't wait for the child
    child.unref();

    res.json({ success: true, name: config.name });
  } catch (err) {
    console.error('Error launching terminal:', err);
    res.status(500).json({ error: 'Failed to launch terminal' });
  }
});

export default router;
