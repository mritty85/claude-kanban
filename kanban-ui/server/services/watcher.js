import chokidar from 'chokidar';
import { getTasksDir } from './fileService.js';

let watcher = null;
const clients = new Set();

export function initWatcher() {
  const tasksDir = getTasksDir();

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
