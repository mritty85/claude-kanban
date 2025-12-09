import chokidar from 'chokidar';
import { getTasksDir } from './fileService.js';

let watcher = null;
const clients = new Set();

export async function initWatcher() {
  const tasksDir = await getTasksDir();

  // Close existing watcher if any
  if (watcher) {
    await watcher.close();
    watcher = null;
  }

  watcher = chokidar.watch(tasksDir, {
    persistent: true,
    ignoreInitial: true,
    depth: 1,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  watcher.on('all', (event, filePath) => {
    if (!filePath.endsWith('.md')) return;

    const data = JSON.stringify({ event, path: filePath, timestamp: Date.now() });
    for (const client of clients) {
      client.write(`data: ${data}\n\n`);
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  console.log(`Watching for changes in: ${tasksDir}`);
}

export function addSSEClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write('data: {"event":"connected"}\n\n');
  clients.add(res);

  res.on('close', () => {
    clients.delete(res);
  });
}

export function closeWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

// Broadcast a message to all SSE clients
export function broadcastToClients(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    client.write(`data: ${data}\n\n`);
  }
}

// Switch to a different project - reinitializes the watcher and notifies clients
export async function switchProject(projectId) {
  // Reinitialize watcher with new project path (getTasksDir will read from updated config)
  await initWatcher();

  // Notify all SSE clients to refresh their data
  broadcastToClients({
    event: 'project-switched',
    projectId,
    timestamp: Date.now()
  });
}
