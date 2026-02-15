import fs from 'fs/promises';
import path from 'path';
import { getCurrentProjectPath } from './configService.js';

const STATUSES = ['ideation', 'planning', 'backlog', 'implementing', 'uat', 'done'];
const BOARD_FILE = '_board.json';

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

// Read board file (column ordering)
export async function readBoardFile(tasksDir) {
  const boardPath = path.join(tasksDir, BOARD_FILE);
  try {
    const content = await fs.readFile(boardPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Return empty columns structure
      return {
        columns: STATUSES.reduce((acc, status) => {
          acc[status] = [];
          return acc;
        }, {})
      };
    }
    throw err;
  }
}

// Write board file (column ordering)
export async function writeBoardFile(tasksDir, boardData) {
  const boardPath = path.join(tasksDir, BOARD_FILE);
  await fs.writeFile(boardPath, JSON.stringify(boardData, null, 2), 'utf-8');
}

export async function getTasksDir() {
  const projectPath = await getCurrentProjectPath();
  return path.join(projectPath, 'tasks');
}

export async function getProjectDir() {
  return await getCurrentProjectPath();
}

export async function getDocumentationDir() {
  const projectDir = await getProjectDir();
  return path.join(projectDir, 'documentation');
}

// Ensure tasks and documentation directories exist (flat structure)
export async function ensureDirectories() {
  const tasksDir = await getTasksDir();
  await fs.mkdir(tasksDir, { recursive: true });

  const docDir = await getDocumentationDir();
  await fs.mkdir(docDir, { recursive: true });

  // Ensure _board.json exists
  const boardPath = path.join(tasksDir, BOARD_FILE);
  try {
    await fs.access(boardPath);
  } catch {
    // Create empty board file
    const boardData = {
      columns: STATUSES.reduce((acc, status) => {
        acc[status] = [];
        return acc;
      }, {})
    };
    await fs.writeFile(boardPath, JSON.stringify(boardData, null, 2), 'utf-8');
  }
}

// Check if project uses old structure (status subfolders with .md files)
async function isOldStructure(tasksDir) {
  for (const status of STATUSES) {
    const statusDir = path.join(tasksDir, status);
    try {
      const files = await fs.readdir(statusDir);
      const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
      if (mdFiles.length > 0) {
        return true; // Found .md files in a status subfolder
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Directory doesn't exist, continue checking
    }
  }
  return false;
}

// Check if project already has flat structure (_board.json exists AND no tasks remain in subfolders)
async function hasFlatStructure(tasksDir) {
  try {
    await fs.access(path.join(tasksDir, BOARD_FILE));
  } catch {
    return false;
  }

  // _board.json exists, but check if subfolders still have task files (incomplete migration)
  if (await isOldStructure(tasksDir)) {
    return false;
  }

  return true;
}

// Migrate from old structure to flat structure
async function migrateToFlatStructure(tasksDir) {
  console.log('Migrating project to flat folder structure...');

  // Read existing board data if present (partial re-migration)
  let boardData;
  try {
    boardData = await readBoardFile(tasksDir);
  } catch {
    boardData = { columns: {} };
  }

  for (const status of STATUSES) {
    const statusDir = path.join(tasksDir, status);
    const orderedIds = [];

    try {
      // Read old order file if it exists
      let oldOrder = [];
      try {
        const orderPath = path.join(statusDir, '_order.json');
        const orderContent = await fs.readFile(orderPath, 'utf-8');
        const orderData = JSON.parse(orderContent);
        oldOrder = orderData.order || [];
      } catch {
        // No order file, will use file order
      }

      const files = await fs.readdir(statusDir);
      const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

      // Build a map of id -> filename for ordering
      const idToFile = new Map();
      for (const filename of mdFiles) {
        const filePath = path.join(statusDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract task ID from content
        const idMatch = content.match(/## Id\n([^\n]+)/);
        const taskId = idMatch ? idMatch[1].trim() : `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        idToFile.set(taskId, { filename, content });
      }

      // Add tasks in order (ordered first, then unordered)
      for (const id of oldOrder) {
        if (idToFile.has(id)) {
          orderedIds.push(id);
          const { filename, content } = idToFile.get(id);

          // Move file to tasks root
          const oldPath = path.join(statusDir, filename);
          const newPath = path.join(tasksDir, filename);

          // Check if file already exists at destination (shouldn't happen, but handle it)
          try {
            await fs.access(newPath);
            // File exists, add suffix
            const baseName = filename.replace('.md', '');
            const newFilename = `${baseName}-${status}.md`;
            await fs.writeFile(path.join(tasksDir, newFilename), content, 'utf-8');
          } catch {
            // File doesn't exist, safe to move
            await fs.writeFile(newPath, content, 'utf-8');
          }

          await fs.unlink(oldPath);
          idToFile.delete(id);
        }
      }

      // Handle remaining unordered tasks
      for (const [id, { filename, content }] of idToFile) {
        orderedIds.push(id);

        const oldPath = path.join(statusDir, filename);
        const newPath = path.join(tasksDir, filename);

        try {
          await fs.access(newPath);
          const baseName = filename.replace('.md', '');
          const newFilename = `${baseName}-${status}.md`;
          await fs.writeFile(path.join(tasksDir, newFilename), content, 'utf-8');
        } catch {
          await fs.writeFile(newPath, content, 'utf-8');
        }

        await fs.unlink(oldPath);
      }

      // Remove old order file
      try {
        await fs.unlink(path.join(statusDir, '_order.json'));
      } catch {
        // Ignore if doesn't exist
      }

      // Remove empty status directory
      try {
        const remaining = await fs.readdir(statusDir);
        if (remaining.length === 0 || (remaining.length === 1 && remaining[0] === '.DS_Store')) {
          // Remove .DS_Store if present
          try {
            await fs.unlink(path.join(statusDir, '.DS_Store'));
          } catch {
            // Ignore
          }
          await fs.rmdir(statusDir);
        }
      } catch {
        // Ignore errors removing directory
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    // Append newly migrated IDs to existing column (avoid duplicates)
    const existing = boardData.columns[status] || [];
    const existingSet = new Set(existing);
    const newIds = orderedIds.filter(id => !existingSet.has(id));
    boardData.columns[status] = [...existing, ...newIds];
  }

  // Write the new board file
  await writeBoardFile(tasksDir, boardData);

  console.log('Migration complete.');
}

export async function getAllTasks() {
  const tasksDir = await getTasksDir();

  // Check if migration is needed (skip if _board.json already exists)
  if (!(await hasFlatStructure(tasksDir)) && await isOldStructure(tasksDir)) {
    await migrateToFlatStructure(tasksDir);
  }

  // Read all .md files from tasks root
  let files;
  try {
    files = await fs.readdir(tasksDir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  // Exclude special project files (NOTES.md, ROADMAP.md, etc.)
  const EXCLUDED_FILES = ['NOTES.md', 'ROADMAP.md', 'README.md'];
  const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_') && !EXCLUDED_FILES.includes(f));

  // Build a map of id -> task
  const taskMap = new Map();
  for (const filename of mdFiles) {
    const filePath = path.join(tasksDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const task = parseTaskFile(content, filename);
    taskMap.set(task.id, task);
  }

  // Read board file for ordering
  const boardData = await readBoardFile(tasksDir);

  // Group tasks by status, sorted by board order
  // Unordered tasks appear at TOP of their column
  const tasks = [];

  for (const status of STATUSES) {
    const columnOrder = boardData.columns[status] || [];
    const statusTasks = [];

    // Find all tasks with this status
    const tasksForStatus = [];
    for (const [id, task] of taskMap) {
      if (task.status === status) {
        tasksForStatus.push(task);
      }
    }

    // Separate ordered and unordered
    const orderedTasks = [];
    const unorderedTasks = [];

    for (const task of tasksForStatus) {
      if (columnOrder.includes(task.id)) {
        orderedTasks.push(task);
      } else {
        unorderedTasks.push(task);
      }
    }

    // Sort ordered tasks by their position in columnOrder
    orderedTasks.sort((a, b) => {
      return columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id);
    });

    // Unordered tasks go at TOP, then ordered tasks
    statusTasks.push(...unorderedTasks, ...orderedTasks);
    tasks.push(...statusTasks);
  }

  return tasks;
}

export function parseTaskFile(content, filename) {
  const lines = content.split('\n');

  // Known sections that we parse into structured fields
  const KNOWN_SECTIONS = ['id', 'status', 'tags', 'description', 'acceptance criteria', 'notes', 'completed', 'epic'];
  // Sections that can contain freeform multi-line content (including ## patterns)
  const FREEFORM_SECTIONS = ['description', 'notes'];

  let title = '';
  let taskId = '';
  let status = 'ideation'; // Default status
  let description = '';
  let tags = [];
  let acceptanceCriteria = [];
  let notes = '';
  let completed = '';
  let epic = '';
  let additionalContent = '';
  let currentSection = '';
  let inUnknownSection = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
      inUnknownSection = false;
    } else if (line.startsWith('## ')) {
      const sectionName = line.slice(3).trim().toLowerCase();
      // Only treat as section header if it's a KNOWN section
      // This allows description/notes to contain arbitrary ## markdown headers
      if (KNOWN_SECTIONS.includes(sectionName)) {
        currentSection = sectionName;
        inUnknownSection = false;
      } else if (FREEFORM_SECTIONS.includes(currentSection)) {
        // We're in a freeform section - treat ## as content, not a section header
        if (currentSection === 'description') {
          description += (description ? '\n' : '') + line;
        } else if (currentSection === 'notes') {
          notes += (notes ? '\n' : '') + line;
        }
      } else {
        // Unknown section outside of freeform sections - capture it
        inUnknownSection = true;
        currentSection = '';
        additionalContent += (additionalContent ? '\n' : '') + line;
      }
    } else if (inUnknownSection) {
      // Continue capturing unknown section content
      additionalContent += '\n' + line;
    } else if (currentSection === 'id' && line.trim()) {
      taskId = line.trim();
    } else if (currentSection === 'status' && line.trim()) {
      const parsedStatus = line.trim().toLowerCase();
      // Validate status
      if (STATUSES.includes(parsedStatus)) {
        status = parsedStatus;
      }
    } else if (currentSection === 'tags' && line.startsWith('- ')) {
      tags.push(line.slice(2).trim());
    } else if (currentSection === 'description') {
      // Preserve all lines including empty ones for proper markdown formatting
      description += (description ? '\n' : '') + line;
    } else if (currentSection === 'acceptance criteria' && line.startsWith('- [')) {
      const checked = line.includes('[x]') || line.includes('[X]');
      const text = line.replace(/- \[[ xX]\] /, '').trim();
      acceptanceCriteria.push({ text, checked });
    } else if (currentSection === 'notes') {
      // Preserve all lines including empty ones for proper markdown formatting
      notes += (notes ? '\n' : '') + line;
    } else if (currentSection === 'completed' && line.trim()) {
      completed = line.trim();
    } else if (currentSection === 'epic' && line.trim()) {
      epic = line.trim();
    }
  }

  // Use parsed ID if present, otherwise fallback to generated ID
  const id = taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

  // Preserve any unknown sections (trimmed to remove leading/trailing whitespace)
  const trimmedAdditional = additionalContent.trim();
  if (trimmedAdditional) {
    task.additionalContent = trimmedAdditional;
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
  // Preserve any additional content (unknown ## sections) at the end
  if (task.additionalContent) {
    content += `\n${task.additionalContent}\n`;
  }
  return content;
}

export async function createTask(task) {
  const tasksDir = await getTasksDir();

  // Generate stable ID
  const id = generateTaskId();

  // Generate slug-only filename with deduplication
  let files;
  try {
    files = await fs.readdir(tasksDir);
  } catch {
    files = [];
  }
  const existingFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
  const filename = generateSlug(task.title, existingFiles);

  // Create task with stable ID
  const taskWithId = { ...task, id, status: task.status };
  const content = serializeTask(taskWithId);
  await fs.writeFile(path.join(tasksDir, filename), content, 'utf-8');

  // Add new task ID to board file at TOP of column
  const boardData = await readBoardFile(tasksDir);
  if (!boardData.columns[task.status]) {
    boardData.columns[task.status] = [];
  }
  boardData.columns[task.status].unshift(id); // Add at TOP
  await writeBoardFile(tasksDir, boardData);

  return { ...taskWithId, filename };
}

export async function updateTask(filename, updates) {
  const tasksDir = await getTasksDir();
  const filePath = path.join(tasksDir, filename);

  const content = await fs.readFile(filePath, 'utf-8');
  const existingTask = parseTaskFile(content, filename);
  const oldStatus = existingTask.status;
  const updatedTask = { ...existingTask, ...updates };

  // Auto-set completion date when status changed to Done (via form edit)
  if (updates.status === 'done' && oldStatus !== 'done') {
    updatedTask.completed = new Date().toISOString();
  }

  const newContent = serializeTask(updatedTask);
  await fs.writeFile(filePath, newContent, 'utf-8');

  // If status changed, update board file
  if (updates.status && updates.status !== oldStatus) {
    const boardData = await readBoardFile(tasksDir);

    // Remove from old column
    if (boardData.columns[oldStatus]) {
      boardData.columns[oldStatus] = boardData.columns[oldStatus].filter(id => id !== existingTask.id);
    }

    // Add to new column at TOP
    if (!boardData.columns[updates.status]) {
      boardData.columns[updates.status] = [];
    }
    boardData.columns[updates.status].unshift(existingTask.id);

    await writeBoardFile(tasksDir, boardData);
  }

  return updatedTask;
}

export async function moveTask(filename, toStatus, newPosition) {
  const tasksDir = await getTasksDir();
  const filePath = path.join(tasksDir, filename);

  const content = await fs.readFile(filePath, 'utf-8');
  let task = parseTaskFile(content, filename);
  const fromStatus = task.status;
  task.status = toStatus;

  // Auto-set completion date when moving to Done
  if (toStatus === 'done') {
    task.completed = new Date().toISOString();
  }

  // Update the file with new status
  const newContent = serializeTask(task);
  await fs.writeFile(filePath, newContent, 'utf-8');

  // Update board file
  const boardData = await readBoardFile(tasksDir);

  // Remove from source column
  if (boardData.columns[fromStatus]) {
    boardData.columns[fromStatus] = boardData.columns[fromStatus].filter(id => id !== task.id);
  }

  // Add to destination column
  if (!boardData.columns[toStatus]) {
    boardData.columns[toStatus] = [];
  }

  if (newPosition !== undefined && newPosition >= 0) {
    boardData.columns[toStatus].splice(newPosition, 0, task.id);
  } else {
    // Add at TOP if no position specified
    boardData.columns[toStatus].unshift(task.id);
  }

  await writeBoardFile(tasksDir, boardData);

  return { ...task, filename };
}

// Simplified reorderTasks - only updates board file
export async function reorderTasks(status, orderedIds) {
  const tasksDir = await getTasksDir();
  const boardData = await readBoardFile(tasksDir);

  // Update the column with new order
  boardData.columns[status] = orderedIds;

  await writeBoardFile(tasksDir, boardData);

  return await getAllTasks();
}

export async function deleteTask(filename) {
  const tasksDir = await getTasksDir();
  const filePath = path.join(tasksDir, filename);

  // Read the task to get its ID and status before deleting
  const content = await fs.readFile(filePath, 'utf-8');
  const task = parseTaskFile(content, filename);

  // Delete the file
  await fs.unlink(filePath);

  // Remove from board file
  const boardData = await readBoardFile(tasksDir);
  if (boardData.columns[task.status]) {
    boardData.columns[task.status] = boardData.columns[task.status].filter(id => id !== task.id);
    await writeBoardFile(tasksDir, boardData);
  }
}

export async function getProjectConfig() {
  const projectDir = await getProjectDir();
  const tasksDir = await getTasksDir();

  // Primary: project root
  const rootConfigPath = path.join(projectDir, 'project.json');
  try {
    const content = await fs.readFile(rootConfigPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    // Fallback: tasks/project.json (pre-migration)
    const legacyConfigPath = path.join(tasksDir, 'project.json');
    try {
      const content = await fs.readFile(legacyConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { boardName: 'Task Manager' };
    }
  }
}

export async function updateProjectConfig(updates) {
  const projectDir = await getProjectDir();
  const configPath = path.join(projectDir, 'project.json');
  const current = await getProjectConfig();
  const updated = { ...current, ...updates };
  await fs.writeFile(configPath, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function getProjectNotes() {
  const docDir = await getDocumentationDir();
  const tasksDir = await getTasksDir();

  // Primary: documentation/notes.md
  const newPath = path.join(docDir, 'notes.md');
  try {
    return await fs.readFile(newPath, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Fallback: tasks/NOTES.md (pre-migration)
  const legacyPath = path.join(tasksDir, 'NOTES.md');
  try {
    return await fs.readFile(legacyPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
}

export async function updateProjectNotes(content) {
  const docDir = await getDocumentationDir();
  await fs.mkdir(docDir, { recursive: true });
  const notesPath = path.join(docDir, 'notes.md');
  await fs.writeFile(notesPath, content, 'utf-8');
  return content;
}

export async function getProjectRoadmap() {
  const docDir = await getDocumentationDir();
  const tasksDir = await getTasksDir();

  // Primary: documentation/roadmap.md
  const newPath = path.join(docDir, 'roadmap.md');
  try {
    return await fs.readFile(newPath, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Fallback: tasks/ROADMAP.md (pre-migration)
  const legacyPath = path.join(tasksDir, 'ROADMAP.md');
  try {
    return await fs.readFile(legacyPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
}

export async function updateProjectRoadmap(content) {
  const docDir = await getDocumentationDir();
  await fs.mkdir(docDir, { recursive: true });
  const roadmapPath = path.join(docDir, 'roadmap.md');
  await fs.writeFile(roadmapPath, content, 'utf-8');
  return content;
}

export async function getProjectPrd() {
  const docDir = await getDocumentationDir();
  const prdPath = path.join(docDir, 'prd.md');
  try {
    return await fs.readFile(prdPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return '';
    throw err;
  }
}

export async function updateProjectPrd(content) {
  const docDir = await getDocumentationDir();
  await fs.mkdir(docDir, { recursive: true });
  const prdPath = path.join(docDir, 'prd.md');
  await fs.writeFile(prdPath, content, 'utf-8');
  return content;
}

// Auto-migration: move project files from tasks/ to new locations
export async function migrateProjectStructure() {
  const projectDir = await getProjectDir();
  const tasksDir = await getTasksDir();
  const docDir = await getDocumentationDir();

  // Migrate tasks/project.json → project.json
  const oldConfig = path.join(tasksDir, 'project.json');
  const newConfig = path.join(projectDir, 'project.json');
  await migrateFile(oldConfig, newConfig, 'project.json');

  // Migrate tasks/NOTES.md → documentation/notes.md
  const oldNotes = path.join(tasksDir, 'NOTES.md');
  const newNotes = path.join(docDir, 'notes.md');
  await migrateFile(oldNotes, newNotes, 'NOTES.md → documentation/notes.md');

  // Migrate tasks/ROADMAP.md → documentation/roadmap.md
  const oldRoadmap = path.join(tasksDir, 'ROADMAP.md');
  const newRoadmap = path.join(docDir, 'roadmap.md');
  await migrateFile(oldRoadmap, newRoadmap, 'ROADMAP.md → documentation/roadmap.md');
}

async function migrateFile(oldPath, newPath, label) {
  try {
    await fs.access(oldPath);
  } catch {
    return; // Old file doesn't exist, nothing to migrate
  }

  // Ensure target directory exists
  await fs.mkdir(path.dirname(newPath), { recursive: true });

  try {
    await fs.access(newPath);
    // New location already exists — remove old file
    await fs.unlink(oldPath);
    console.log(`Migration: removed stale ${label} (new location already exists)`);
  } catch {
    // New location doesn't exist — move the file
    const content = await fs.readFile(oldPath, 'utf-8');
    await fs.writeFile(newPath, content, 'utf-8');
    await fs.unlink(oldPath);
    console.log(`Migration: moved ${label}`);
  }
}

// Launch config functions

export function generateLaunchConfigId() {
  return `lc_${Date.now()}`;
}

export async function getLaunchConfigs() {
  const config = await getProjectConfig();
  return config.launchConfigs || [];
}

export async function addLaunchConfig(configData) {
  const config = await getProjectConfig();
  const launchConfigs = config.launchConfigs || [];
  const newConfig = {
    id: generateLaunchConfigId(),
    name: configData.name,
    command: configData.command
  };
  // Only include workingDir if it's provided and non-empty
  if (configData.workingDir?.trim()) {
    newConfig.workingDir = configData.workingDir.trim();
  }
  launchConfigs.push(newConfig);
  await updateProjectConfig({ launchConfigs });
  return newConfig;
}

export async function updateLaunchConfig(id, updates) {
  const config = await getProjectConfig();
  const launchConfigs = config.launchConfigs || [];
  const index = launchConfigs.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error('Launch config not found');
  }
  // Handle workingDir specially - remove if empty, otherwise update
  const updatedConfig = { ...launchConfigs[index] };
  if (updates.name !== undefined) updatedConfig.name = updates.name;
  if (updates.command !== undefined) updatedConfig.command = updates.command;
  if (updates.workingDir !== undefined) {
    if (updates.workingDir?.trim()) {
      updatedConfig.workingDir = updates.workingDir.trim();
    } else {
      delete updatedConfig.workingDir;
    }
  }
  launchConfigs[index] = updatedConfig;
  await updateProjectConfig({ launchConfigs });
  return launchConfigs[index];
}

export async function deleteLaunchConfig(id) {
  const config = await getProjectConfig();
  const launchConfigs = config.launchConfigs || [];
  const filtered = launchConfigs.filter(c => c.id !== id);
  if (filtered.length === launchConfigs.length) {
    throw new Error('Launch config not found');
  }
  await updateProjectConfig({ launchConfigs: filtered });
}
