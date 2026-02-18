import express from 'express';
import { spawn } from 'child_process';
import {
  getLaunchConfigs,
  addLaunchConfig,
  updateLaunchConfig,
  deleteLaunchConfig
} from '../services/fileService.js';
import { getCurrentProjectPath } from '../services/configService.js';
import { asyncHandler, HttpError } from '../middleware.js';

const router = express.Router();

// List all launch configs for current project
router.get('/configs', asyncHandler(async (req, res) => {
  const configs = await getLaunchConfigs();
  res.json(configs);
}));

// Add a new launch config
router.post('/configs', asyncHandler(async (req, res) => {
  const { name, command, workingDir } = req.body;

  if (!name || !command) {
    throw new HttpError(400, 'Name and command are required');
  }

  const config = await addLaunchConfig({ name, command, workingDir });
  res.status(201).json(config);
}));

// Update a launch config
router.put('/configs/:id', asyncHandler(async (req, res) => {
  const { name, command, workingDir } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (command !== undefined) updates.command = command;
  if (workingDir !== undefined) updates.workingDir = workingDir;

  const config = await updateLaunchConfig(req.params.id, updates);
  res.json(config);
}));

// Delete a launch config
router.delete('/configs/:id', asyncHandler(async (req, res) => {
  await deleteLaunchConfig(req.params.id);
  res.status(204).send();
}));

// Launch a terminal with a config
router.post('/:id', asyncHandler(async (req, res) => {
  const configs = await getLaunchConfigs();
  const config = configs.find(c => c.id === req.params.id);

  if (!config) {
    throw new HttpError(404, 'Launch config not found');
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

  // Use AppleScript to create a new tab in existing Ghostty window
  // This ensures the tab is "native" and can be merged with other windows
  // After command exits, prompt to close (avoids "running process" warning on tab close)
  const userShell = process.env.SHELL || '/bin/zsh';
  const shellCommand = `cd "${workingDir}" && ${config.command}; echo ""; echo "Press Enter to close..."; read`;

  // Escape special characters for AppleScript string
  const escapeForAppleScript = (str) => {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  };

  const escapedCommand = escapeForAppleScript(shellCommand);

  const appleScript = `
tell application "Ghostty" to activate
delay 0.3
tell application "System Events"
    keystroke "t" using command down
    delay 0.3
    keystroke "${escapedCommand}"
    keystroke return
end tell
`;

  const child = spawn('osascript', ['-e', appleScript], {
    detached: true,
    stdio: 'ignore'
  });

  // Unref so the parent process doesn't wait for the child
  child.unref();

  res.json({ success: true, name: config.name });
}));

export default router;
