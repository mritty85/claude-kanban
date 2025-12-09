import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.kanban-ui');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const STATUSES = ['ideation', 'planning', 'backlog', 'implementing', 'uat', 'done'];

// Generate a simple ID from name
function generateId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Ensure the config directory and file exist
export async function ensureGlobalConfig() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  try {
    await fs.access(CONFIG_PATH);
  } catch {
    // Config doesn't exist, create default
    const defaultTasksDir = process.env.TASKS_DIR || path.resolve(process.cwd(), '..', 'tasks');
    const projectPath = path.dirname(defaultTasksDir);

    const defaultConfig = {
      currentProject: projectPath,
      projects: [
        {
          id: 'default-project',
          name: 'Default Project',
          path: projectPath,
          lastAccessed: new Date().toISOString()
        }
      ]
    };

    await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log(`Created global config at ${CONFIG_PATH}`);
  }
}

// Read the global config
export async function getGlobalConfig() {
  const content = await fs.readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

// Update the global config
export async function updateGlobalConfig(updates) {
  const current = await getGlobalConfig();
  const updated = { ...current, ...updates };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// Get the current project's root path
export async function getCurrentProjectPath() {
  const config = await getGlobalConfig();
  return config.currentProject;
}

// Get the current project object
export async function getCurrentProject() {
  const config = await getGlobalConfig();
  return config.projects.find(p => p.path === config.currentProject) || null;
}

// Set the current project by ID
export async function setCurrentProject(projectId) {
  const config = await getGlobalConfig();
  const project = config.projects.find(p => p.id === projectId);

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Update lastAccessed
  project.lastAccessed = new Date().toISOString();
  config.currentProject = project.path;

  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  return project;
}

// List all projects
export async function listProjects() {
  const config = await getGlobalConfig();
  return config.projects;
}

// Get a project by ID
export async function getProjectById(projectId) {
  const config = await getGlobalConfig();
  return config.projects.find(p => p.id === projectId) || null;
}

// Add a new project
export async function addProject(name, projectPath) {
  const config = await getGlobalConfig();

  // Validate path exists
  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('Path does not exist');
    }
    throw err;
  }

  // Check for duplicate path
  if (config.projects.some(p => p.path === projectPath)) {
    throw new Error('A project with this path already exists');
  }

  // Generate unique ID
  let id = generateId(name);
  let suffix = 1;
  while (config.projects.some(p => p.id === id)) {
    id = `${generateId(name)}-${suffix}`;
    suffix++;
  }

  const newProject = {
    id,
    name,
    path: projectPath,
    lastAccessed: new Date().toISOString()
  };

  config.projects.push(newProject);
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

  return newProject;
}

// Remove a project by ID
export async function removeProject(projectId) {
  const config = await getGlobalConfig();
  const index = config.projects.findIndex(p => p.id === projectId);

  if (index === -1) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const removed = config.projects.splice(index, 1)[0];

  // If we removed the current project, switch to first available
  if (config.currentProject === removed.path && config.projects.length > 0) {
    config.currentProject = config.projects[0].path;
  }

  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  return removed;
}

// Update a project's metadata
export async function updateProject(projectId, updates) {
  const config = await getGlobalConfig();
  const project = config.projects.find(p => p.id === projectId);

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Only allow updating name (path changes would break things)
  if (updates.name) {
    project.name = updates.name;
  }

  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  return project;
}

// Check if a path has a tasks directory, optionally create it
export async function validateProjectPath(projectPath, createIfMissing = false) {
  const tasksDir = path.join(projectPath, 'tasks');

  try {
    const stats = await fs.stat(tasksDir);
    if (!stats.isDirectory()) {
      return { valid: false, error: 'tasks path exists but is not a directory' };
    }
    return { valid: true, tasksDir };
  } catch (err) {
    if (err.code === 'ENOENT') {
      if (createIfMissing) {
        // Create tasks directory and all status subdirectories
        for (const status of STATUSES) {
          await fs.mkdir(path.join(tasksDir, status), { recursive: true });
        }
        return { valid: true, tasksDir, created: true };
      }
      return { valid: false, error: 'tasks directory does not exist', canCreate: true };
    }
    throw err;
  }
}
