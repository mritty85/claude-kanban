import type { Task, TaskFormData, TaskStatus } from '../types/task';

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

export async function reorderTasks(status: TaskStatus, orderedFilenames: string[]): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, orderedFilenames })
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
