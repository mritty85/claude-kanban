import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import { ensureDirectories } from './services/fileService.js';
import { initWatcher } from './services/watcher.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await ensureDirectories();
  initWatcher();

  app.listen(PORT, () => {
    console.log(`Kanban API server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
