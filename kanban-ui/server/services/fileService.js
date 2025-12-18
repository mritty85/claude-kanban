import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getCurrentProjectPath } from './configService.js';

const STATUSES = ['ideation', 'planning', 'backlog', 'implementing', 'uat', 'done'];
const ORDER_FILE = '_order.json';

// Generate a unique task ID (timestamp-based)
export function generateTaskId() {
  return `task_${Date.now()}`;
}

// Generate a slug from title with deduplication
export function generateSlug(title, existingFiles) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);

  if (!existingFiles || existingFiles.length === 0) {
    return `${baseSlug}.md`;
  }

  // Check if base filename exists
  if (!existingFiles.includes(`${baseSlug}.md`)) {
    return `${baseSlug}.md`;
  }

  // Find next available suffix
  let counter = 2;
  while (existingFiles.includes(`${baseSlug}-${counter}.md`)) {
    counter++;
  }
  return `${baseSlug}-${counter}.md`;
}

// Read order file for a status directory
export async function readOrderFile(statusDir) {
  const orderPath = path.join(statusDir, ORDER_FILE);
  try {
    const content = await fs.readFile(orderPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { order: [] };
    }
    throw err;
  }
}

// Write order file for a status directory
export async function writeOrderFile(statusDir, orderData) {
  const orderPath = path.join(statusDir, ORDER_FILE);
  await fs.writeFile(orderPath, JSON.stringify(orderData, null, 2), 'utf-8');
}

export async function getTasksDir() {
  const projectPath = await getCurrentProjectPath();
  return path.join(projectPath, 'tasks');
}

export async function ensureDirectories() {
  const tasksDir = await getTasksDir();
  for (const status of STATUSES) {
    await fs.mkdir(path.join(tasksDir, status), { recursive: true });
  }
}

// Check if project needs migration (no _order.json files exist)
async function needsMigration(tasksDir) {
  for (const status of STATUSES) {
    const orderPath = path.join(tasksDir, status, ORDER_FILE);
    try {
      await fs.access(orderPath);
      return false; // At least one order file exists, no migration needed
    } catch {
      // File doesn't exist, continue checking
    }
  }
  return true; // No order files found
}

// Migrate a project: add IDs to tasks, rename files, create order files
async function migrateProject(tasksDir) {
  console.log('Migrating project to stable IDs...');

  for (const status of STATUSES) {
    const statusDir = path.join(tasksDir, status);
    const orderIds = [];

    try {
      const files = await fs.readdir(statusDir);
      // Sort by numeric prefix to preserve current order
      const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_')).sort();

      for (const oldFilename of mdFiles) {
        const filePath = path.join(statusDir, oldFilename);
        const content = await fs.readFile(filePath, 'utf-8');

        // Check if already has ## Id section
        if (content.includes('## Id\n')) {
          // Extract existing ID
          const idMatch = content.match(/## Id\n([^\n]+)/);
          if (idMatch) {
            orderIds.push(idMatch[1].trim());
          }
          continue;
        }

        // Generate ID from file mtime (approximate creation time)
        const stat = await fs.stat(filePath);
        const id = `task_${Math.floor(stat.mtimeMs)}`;

        // Add Id section to content (after title)
        const titleMatch = content.match(/^# [^\n]+\n/);
        let newContent;
        if (titleMatch) {
          const titleEnd = titleMatch[0].length;
          newContent = content.slice(0, titleEnd) + `\n## Id\n${id}\n` + content.slice(titleEnd);
        } else {
          newContent = `## Id\n${id}\n\n` + content;
        }

        // Generate new slug-only filename
        const slug = oldFilename.replace(/^\d+-/, '').replace('.md', '');
        const existingFiles = (await fs.readdir(statusDir)).filter(f => f !== oldFilename);
        let newFilename = `${slug}.md`;

        // Handle duplicates
        if (existingFiles.includes(newFilename)) {
          let counter = 2;
          while (existingFiles.includes(`${slug}-${counter}.md`)) {
            counter++;
          }
          newFilename = `${slug}-${counter}.md`;
        }

        // Write updated content
        await fs.writeFile(path.join(statusDir, newFilename), newContent, 'utf-8');

        // Remove old file if renamed
        if (oldFilename !== newFilename) {
          await fs.unlink(filePath);
        }

        orderIds.push(id);
      }

      // Write order file for this status
      await writeOrderFile(statusDir, { order: orderIds });
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Directory doesn't exist yet, create empty order file
      await fs.mkdir(statusDir, { recursive: true });
      await writeOrderFile(statusDir, { order: [] });
    }
  }

  console.log('Migration complete.');
}

export async function getAllTasks() {
  const tasksDir = await getTasksDir();

  // Check if migration is needed and run it
  if (await needsMigration(tasksDir)) {
    await migrateProject(tasksDir);
  }

  const tasks = [];

  for (const status of STATUSES) {
    const statusDir = path.join(tasksDir, status);
    try {
      const files = await fs.readdir(statusDir);
      const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

      // Build a map of id -> task for this status
      const taskMap = new Map();
      for (const filename of mdFiles) {
        const filePath = path.join(statusDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const task = parseTaskFile(content, filename, status);
        taskMap.set(task.id, task);
      }

      // Read order file and sort tasks
      const orderData = await readOrderFile(statusDir);
      const orderedTasks = [];

      // Add tasks in order file sequence
      for (const id of orderData.order) {
        const task = taskMap.get(id);
        if (task) {
          orderedTasks.push(task);
          taskMap.delete(id);
        }
      }

      // Append any tasks not in order file (e.g., added externally by Claude Code)
      for (const task of taskMap.values()) {
        orderedTasks.push(task);
      }

      tasks.push(...orderedTasks);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  return tasks;
}

export function parseTaskFile(content, filename, status) {
  const lines = content.split('\n');

  let title = '';
  let taskId = '';
  let description = '';
  let tags = [];
  let acceptanceCriteria = [];
  let notes = '';
  let completed = '';
  let epic = '';
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim().toLowerCase();
    } else if (currentSection === 'id' && line.trim()) {
      taskId = line.trim();
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
    } else if (currentSection === 'completed' && line.trim()) {
      completed = line.trim();
    } else if (currentSection === 'epic' && line.trim()) {
      epic = line.trim();
    }
  }

  // Use parsed ID if present, otherwise fallback to composite ID (for unmigrated tasks)
  const id = taskId || `${status}/${filename}`;

  const task = {
    id,
    filename,
    status,
    title,
    description: description.trim(),
    tags,
    acceptanceCriteria,
    notes: notes.trim()
  };

  if (completed) {
    task.completed = completed;
  }

  if (epic) {
    task.epic = epic;
  }

  return task;
}

export function serializeTask(task) {
  let content = `# ${task.title}\n\n`;
  // Include Id section if task has a stable ID (not composite format)
  if (task.id && !task.id.includes('/')) {
    content += `## Id\n${task.id}\n\n`;
  }
  content += `## Status\n${task.status}\n\n`;
  if (task.epic) {
    content += `## Epic\n${task.epic}\n\n`;
  }
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
  if (task.completed) {
    content += `\n## Completed\n${task.completed}\n`;
  }
  return content;
}

export async function createTask(task) {
  const tasksDir = await getTasksDir();
  const statusDir = path.join(tasksDir, task.status);

  // Generate stable ID
  const id = generateTaskId();

  // Generate slug-only filename with deduplication
  const files = await fs.readdir(statusDir).catch(() => []);
  const existingFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
  const filename = generateSlug(task.title, existingFiles);

  // Create task with stable ID
  const taskWithId = { ...task, id, status: task.status };
  const content = serializeTask(taskWithId);
  await fs.writeFile(path.join(statusDir, filename), content, 'utf-8');

  // Append new task ID to order file
  const orderData = await readOrderFile(statusDir);
  orderData.order.push(id);
  await writeOrderFile(statusDir, orderData);

  return { ...taskWithId, filename };
}

export async function updateTask(status, filename, updates) {
  const tasksDir = await getTasksDir();
  const filePath = path.join(tasksDir, status, filename);

  const content = await fs.readFile(filePath, 'utf-8');
  const existingTask = parseTaskFile(content, filename, status);
  const updatedTask = { ...existingTask, ...updates };

  // Auto-set completion date when status changed to Done (via form edit)
  if (updates.status === 'done' && existingTask.status !== 'done') {
    updatedTask.completed = new Date().toISOString();
  }

  const newContent = serializeTask(updatedTask);
  await fs.writeFile(filePath, newContent, 'utf-8');

  return updatedTask;
}

export async function moveTask(fromStatus, filename, toStatus, newPosition) {
  const tasksDir = await getTasksDir();
  const fromDir = path.join(tasksDir, fromStatus);
  const toDir = path.join(tasksDir, toStatus);
  const fromPath = path.join(fromDir, filename);

  const content = await fs.readFile(fromPath, 'utf-8');
  let task = parseTaskFile(content, filename, fromStatus);
  task.status = toStatus;

  // Auto-set completion date when moving to Done
  if (toStatus === 'done') {
    task.completed = new Date().toISOString();
  }

  // Keep the same filename (no renaming)
  const newContent = serializeTask(task);
  await fs.writeFile(path.join(toDir, filename), newContent, 'utf-8');
  await fs.unlink(fromPath);

  // Update order files: remove from source, add to destination
  const fromOrderData = await readOrderFile(fromDir);
  fromOrderData.order = fromOrderData.order.filter(id => id !== task.id);
  await writeOrderFile(fromDir, fromOrderData);

  const toOrderData = await readOrderFile(toDir);
  if (newPosition !== undefined && newPosition >= 0) {
    toOrderData.order.splice(newPosition, 0, task.id);
  } else {
    toOrderData.order.push(task.id);
  }
  await writeOrderFile(toDir, toOrderData);

  return { ...task, filename };
}

// Simplified reorderTasks - only updates order file, no file renames
export async function reorderTasks(status, orderedIds) {
  const tasksDir = await getTasksDir();
  const statusDir = path.join(tasksDir, status);

  // Just update the order file with the new ID sequence
  await writeOrderFile(statusDir, { order: orderedIds });

  return await getAllTasks();
}

export async function deleteTask(status, filename) {
  const tasksDir = await getTasksDir();
  const statusDir = path.join(tasksDir, status);
  const filePath = path.join(statusDir, filename);

  // Read the task to get its ID before deleting
  const content = await fs.readFile(filePath, 'utf-8');
  const task = parseTaskFile(content, filename, status);

  // Delete the file
  await fs.unlink(filePath);

  // Remove from order file
  const orderData = await readOrderFile(statusDir);
  orderData.order = orderData.order.filter(id => id !== task.id);
  await writeOrderFile(statusDir, orderData);
}

export async function getProjectConfig() {
  const tasksDir = await getTasksDir();
  const configPath = path.join(tasksDir, 'project.json');
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { boardName: 'Task Manager' };
  }
}

export async function updateProjectConfig(updates) {
  const tasksDir = await getTasksDir();
  const configPath = path.join(tasksDir, 'project.json');
  const current = await getProjectConfig();
  const updated = { ...current, ...updates };
  await fs.writeFile(configPath, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function getProjectNotes() {
  const tasksDir = await getTasksDir();
  const notesPath = path.join(tasksDir, 'NOTES.md');
  try {
    const content = await fs.readFile(notesPath, 'utf-8');
    return content;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''; // Return empty string if file doesn't exist
    }
    throw err;
  }
}

export async function updateProjectNotes(content) {
  const tasksDir = await getTasksDir();
  const notesPath = path.join(tasksDir, 'NOTES.md');
  await fs.writeFile(notesPath, content, 'utf-8');
  return content;
}
