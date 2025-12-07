import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const STATUSES = ['ideation', 'backlog', 'planning', 'implementing', 'uat', 'done'];

export function getTasksDir() {
  return process.env.TASKS_DIR || path.resolve(process.cwd(), '..', 'tasks');
}

export async function ensureDirectories() {
  const tasksDir = getTasksDir();
  for (const status of STATUSES) {
    await fs.mkdir(path.join(tasksDir, status), { recursive: true });
  }
}

export async function getAllTasks() {
  const tasksDir = getTasksDir();
  const tasks = [];

  for (const status of STATUSES) {
    const statusDir = path.join(tasksDir, status);
    try {
      const files = await fs.readdir(statusDir);
      const mdFiles = files.filter(f => f.endsWith('.md')).sort();

      for (const filename of mdFiles) {
        const filePath = path.join(statusDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const task = parseTaskFile(content, filename, status);
        tasks.push(task);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  return tasks;
}

export function parseTaskFile(content, filename, status) {
  const lines = content.split('\n');

  let title = '';
  let description = '';
  let tags = [];
  let acceptanceCriteria = [];
  let notes = '';
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim().toLowerCase();
    } else if (currentSection === 'tags' && line.startsWith('- ')) {
      tags.push(line.slice(2).trim());
    } else if (currentSection === 'description' && line.trim()) {
      description += (description ? '\n' : '') + line;
    } else if (currentSection === 'acceptance criteria' && line.startsWith('- [')) {
      const checked = line.includes('[x]') || line.includes('[X]');
      const text = line.replace(/- \[[ xX]\] /, '').trim();
      acceptanceCriteria.push({ text, checked });
    } else if (currentSection === 'notes' && line.trim()) {
      notes += (notes ? '\n' : '') + line;
    }
  }

  const priority = parseInt(filename.split('-')[0], 10) || 99;

  return {
    id: `${status}/${filename}`,
    filename,
    status,
    priority,
    title,
    description: description.trim(),
    tags,
    acceptanceCriteria,
    notes: notes.trim()
  };
}

export function serializeTask(task) {
  let content = `# ${task.title}\n\n`;
  content += `## Status\n${task.status}\n\n`;
  content += `## Tags\n`;
  for (const tag of task.tags || []) {
    content += `- ${tag}\n`;
  }
  content += `\n## Description\n${task.description || ''}\n\n`;
  content += `## Acceptance Criteria\n`;
  for (const criterion of task.acceptanceCriteria || []) {
    const checkbox = criterion.checked ? '[x]' : '[ ]';
    content += `- ${checkbox} ${criterion.text}\n`;
  }
  content += `\n## Notes\n${task.notes || ''}\n`;
  return content;
}

export async function createTask(task) {
  const tasksDir = getTasksDir();
  const statusDir = path.join(tasksDir, task.status);

  const files = await fs.readdir(statusDir).catch(() => []);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const nextPriority = mdFiles.length + 1;
  const paddedPriority = String(nextPriority).padStart(2, '0');
  const slug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const filename = `${paddedPriority}-${slug}.md`;

  const content = serializeTask({ ...task, status: task.status });
  await fs.writeFile(path.join(statusDir, filename), content, 'utf-8');

  return { ...task, filename, id: `${task.status}/${filename}` };
}

export async function updateTask(status, filename, updates) {
  const tasksDir = getTasksDir();
  const filePath = path.join(tasksDir, status, filename);

  const content = await fs.readFile(filePath, 'utf-8');
  const existingTask = parseTaskFile(content, filename, status);
  const updatedTask = { ...existingTask, ...updates };

  const newContent = serializeTask(updatedTask);
  await fs.writeFile(filePath, newContent, 'utf-8');

  return updatedTask;
}

export async function moveTask(fromStatus, filename, toStatus, newPriority) {
  const tasksDir = getTasksDir();
  const fromPath = path.join(tasksDir, fromStatus, filename);

  const content = await fs.readFile(fromPath, 'utf-8');
  let task = parseTaskFile(content, filename, fromStatus);
  task.status = toStatus;

  const toDir = path.join(tasksDir, toStatus);
  const files = await fs.readdir(toDir).catch(() => []);
  const mdFiles = files.filter(f => f.endsWith('.md')).sort();

  const priority = newPriority !== undefined ? newPriority : mdFiles.length + 1;
  const paddedPriority = String(priority).padStart(2, '0');
  const slug = filename.replace(/^\d+-/, '').replace('.md', '');
  const newFilename = `${paddedPriority}-${slug}.md`;

  const newContent = serializeTask(task);
  await fs.writeFile(path.join(toDir, newFilename), newContent, 'utf-8');
  await fs.unlink(fromPath);

  return { ...task, filename: newFilename, id: `${toStatus}/${newFilename}` };
}

export async function reorderTasks(status, orderedFilenames) {
  const tasksDir = getTasksDir();
  const statusDir = path.join(tasksDir, status);

  const renames = [];
  for (let i = 0; i < orderedFilenames.length; i++) {
    const oldFilename = orderedFilenames[i];
    const paddedPriority = String(i + 1).padStart(2, '0');
    const slug = oldFilename.replace(/^\d+-/, '').replace('.md', '');
    const newFilename = `${paddedPriority}-${slug}.md`;

    if (oldFilename !== newFilename) {
      renames.push({ oldFilename, newFilename });
    }
  }

  for (const { oldFilename, newFilename } of renames) {
    const oldPath = path.join(statusDir, oldFilename);
    const tempPath = path.join(statusDir, `_temp_${newFilename}`);
    await fs.rename(oldPath, tempPath);
  }

  for (const { newFilename } of renames) {
    const tempPath = path.join(statusDir, `_temp_${newFilename}`);
    const newPath = path.join(statusDir, newFilename);
    await fs.rename(tempPath, newPath);
  }

  return await getAllTasks();
}

export async function deleteTask(status, filename) {
  const tasksDir = getTasksDir();
  const filePath = path.join(tasksDir, status, filename);
  await fs.unlink(filePath);
}

export async function getProjectConfig() {
  const configPath = path.join(getTasksDir(), 'project.json');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { boardName: 'Task Manager' };
  }
}

export async function updateProjectConfig(updates) {
  const configPath = path.join(getTasksDir(), 'project.json');
  const current = await getProjectConfig();
  const updated = { ...current, ...updates };
  await fs.writeFile(configPath, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
