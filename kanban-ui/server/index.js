import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import projectsRouter from './routes/projects.js';
import { ensureDirectories } from './services/fileService.js';
import { initWatcher } from './services/watcher.js';
import { ensureGlobalConfig, getCurrentProjectPath } from './services/configService.js';

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  // Ensure global config exists (creates default if first run)
  await ensureGlobalConfig();

  const projectPath = await getCurrentProjectPath();
  console.log(`Active project: ${projectPath}`);

  await ensureDirectories();
  await initWatcher();

  app.listen(PORT, () => {
    console.log(`Kanban API server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
