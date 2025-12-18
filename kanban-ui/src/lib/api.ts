import type { Task, TaskFormData, TaskStatus, Project, ProjectFormData, PathValidation } from '../types/task';

const API_BASE = '/api';

export interface ProjectConfig {
  boardName: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(status: TaskStatus, filename: string, data: Partial<TaskFormData>): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${status}/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function moveTask(fromStatus: TaskStatus, filename: string, toStatus: TaskStatus, newPriority?: number): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromStatus, filename, toStatus, newPriority })
  });
  if (!res.ok) throw new Error('Failed to move task');
  return res.json();
}

export async function reorderTasks(status: TaskStatus, orderedIds: string[]): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, orderedIds })
  });
  if (!res.ok) throw new Error('Failed to reorder tasks');
  return res.json();
}

export async function deleteTask(status: TaskStatus, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${status}/${encodeURIComponent(filename)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export function subscribeToChanges(onEvent: (event: { event: string; path: string; timestamp: number }) => void): () => void {
  const eventSource = new EventSource(`${API_BASE}/tasks/events`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {
      // Ignore parse errors
    }
  };

  eventSource.onerror = () => {
    console.error('SSE connection error, will attempt reconnect');
  };

  return () => eventSource.close();
}

export async function fetchConfig(): Promise<ProjectConfig> {
  const res = await fetch(`${API_BASE}/tasks/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateConfig(data: Partial<ProjectConfig>): Promise<ProjectConfig> {
  const res = await fetch(`${API_BASE}/tasks/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update config');
  return res.json();
}

// Project management API functions

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchCurrentProject(): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/current`);
  if (!res.ok) throw new Error('Failed to fetch current project');
  return res.json();
}

export async function addProject(data: ProjectFormData): Promise<Project & { tasksCreated?: boolean }> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add project');
  }
  return res.json();
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to remove project');
}

export async function updateProject(id: string, data: Partial<ProjectFormData>): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function switchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}/switch`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to switch project');
  return res.json();
}

export async function validateProjectPath(path: string): Promise<PathValidation> {
  const res = await fetch(`${API_BASE}/projects/validate-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  if (!res.ok) throw new Error('Failed to validate path');
  return res.json();
}

// Project Notes API functions

export async function fetchNotes(): Promise<string> {
  const res = await fetch(`${API_BASE}/tasks/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  const data = await res.json();
  return data.content;
}

export async function updateNotes(content: string): Promise<string> {
  const res = await fetch(`${API_BASE}/tasks/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to update notes');
  const data = await res.json();
  return data.content;
}
