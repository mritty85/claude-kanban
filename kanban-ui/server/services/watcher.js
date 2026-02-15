import chokidar from 'chokidar';
import path from 'path';
import { listProjects, getProjectById } from './configService.js';

let watcher = null;
const clients = new Map(); // Map<clientId, { response, projectId }>
let clientIdCounter = 0;
let projectPathMap = new Map(); // Map<watchedPath, projectId>

// Get project ID from a file path by finding which watched directory contains it
// Sort by path length descending so longer (more specific) paths match first
function getProjectIdFromPath(filePath) {
  const entries = [...projectPathMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [watchedPath, projectId] of entries) {
    if (filePath.startsWith(watchedPath)) {
      return projectId;
    }
  }
  return null;
}

export async function initWatcher() {
  const projects = await listProjects();

  // Build project path lookup map — watch tasks/, documentation/, and root project.json
  projectPathMap = new Map();
  const watchPaths = [];

  for (const project of projects) {
    const tasksDir = path.join(project.path, 'tasks');
    const docDir = path.join(project.path, 'documentation');
    const rootConfig = path.join(project.path, 'project.json');

    projectPathMap.set(tasksDir, project.id);
    projectPathMap.set(docDir, project.id);
    projectPathMap.set(rootConfig, project.id);

    watchPaths.push(tasksDir);
    watchPaths.push(docDir);
    watchPaths.push(rootConfig);

    // Watch root-level CLAUDE.md (both casings) for document detection
    const claudeUpper = path.join(project.path, 'CLAUDE.md');
    const claudeLower = path.join(project.path, 'claude.md');
    projectPathMap.set(claudeUpper, project.id);
    projectPathMap.set(claudeLower, project.id);
    watchPaths.push(claudeUpper);
    watchPaths.push(claudeLower);
  }

  // Close existing watcher if any
  if (watcher) {
    await watcher.close();
    watcher = null;
  }

  if (watchPaths.length === 0) {
    console.log('No projects to watch');
    return;
  }

  watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    depth: 0, // Flat structure: only watch /tasks/*.md, not subfolders
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  watcher.on('all', (event, filePath) => {
    // Only handle markdown and json files
    if (!filePath.endsWith('.md') && !filePath.endsWith('.json')) return;

    const projectId = getProjectIdFromPath(filePath);
    if (!projectId) return;

    const data = JSON.stringify({ event, path: filePath, projectId, timestamp: Date.now() });

    // Only send to clients watching this project
    for (const [, client] of clients) {
      if (client.projectId === projectId) {
        client.response.write(`data: ${data}\n\n`);
      }
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  console.log(`Watching for changes in ${watchPaths.length} project(s): ${watchPaths.join(', ')}`);
}

export function addSSEClient(res, projectId) {
  const clientId = ++clientIdCounter;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ event: 'connected', clientId, projectId })}\n\n`);
  clients.set(clientId, { response: res, projectId });

  res.on('close', () => {
    clients.delete(clientId);
  });

  return clientId;
}

// Update which project a client is watching
export function updateClientProject(clientId, newProjectId) {
  const client = clients.get(clientId);
  if (client) {
    client.projectId = newProjectId;
    client.response.write(`data: ${JSON.stringify({
      event: 'project-switched',
      clientId,
      projectId: newProjectId,
      timestamp: Date.now()
    })}\n\n`);
    return true;
  }
  return false;
}

export function closeWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

// Broadcast a message to all SSE clients (used for global events)
export function broadcastToClients(message) {
  const data = JSON.stringify(message);
  for (const [, client] of clients) {
    client.response.write(`data: ${data}\n\n`);
  }
}

// Broadcast a message only to clients watching a specific project
export function broadcastToProject(projectId, message) {
  const data = JSON.stringify({ ...message, projectId });
  for (const [, client] of clients) {
    if (client.projectId === projectId) {
      client.response.write(`data: ${data}\n\n`);
    }
  }
}

// Refresh watcher when projects are added or removed
export async function refreshWatcher() {
  await initWatcher();
}

// Switch to a different project - for per-client switching
export async function switchProject(projectId, clientId = null) {
  if (clientId) {
    // Per-client switch only - just update the client's project context
    return updateClientProject(clientId, projectId);
  }

  // Global switch (CLI compatibility) - notify all clients
  broadcastToClients({
    event: 'project-switched',
    projectId,
    timestamp: Date.now()
  });
}
