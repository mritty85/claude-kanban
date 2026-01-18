import type { Task, TaskFormData, TaskStatus, Project, ProjectFormData, PathValidation } from '../types/task';

const API_BASE = '/api';

export interface ProjectConfig {
  boardName: string;
}

export interface SSEEvent {
  event: string;
  path?: string;
  projectId?: string;
  clientId?: number;
  timestamp: number;
}

// Track the current client ID assigned by the server
let currentClientId: number | null = null;

export function getCurrentClientId(): number | null {
  return currentClientId;
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

export function subscribeToChanges(
  projectId: string,
  onEvent: (event: SSEEvent) => void,
  onReconnect?: () => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectDelay = 30000;

  function connect() {
    const url = `${API_BASE}/tasks/events?project=${encodeURIComponent(projectId)}`;
    eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as SSEEvent;
        reconnectAttempts = 0; // Reset on successful message

        // Track client ID from connected event
        if (data.event === 'connected' && data.clientId) {
          currentClientId = data.clientId;
        }

        onEvent(data);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error, reconnecting...');
      eventSource?.close();

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
      reconnectAttempts++;
      setTimeout(connect, delay);
    };

    eventSource.onopen = () => {
      if (reconnectAttempts > 0 && onReconnect) {
        onReconnect(); // Trigger data refresh after reconnect
      }
    };
  }

  connect();

  // Reconnect when tab becomes visible (after sleep/wake)
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('Tab visible, checking SSE connection...');
      if (eventSource?.readyState === EventSource.CLOSED) {
        connect();
      }
      onReconnect?.(); // Always refresh data when tab becomes visible
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    eventSource?.close();
    currentClientId = null;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
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
  // Note: We don't send clientId here because the SSE subscription will be
  // recreated with the new projectId, which automatically registers the client
  // as watching the correct project. This avoids race conditions.
  const res = await fetch(`${API_BASE}/projects/${id}/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
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

// Project Roadmap API functions

export async function fetchRoadmap(): Promise<string> {
  const res = await fetch(`${API_BASE}/tasks/roadmap`);
  if (!res.ok) throw new Error('Failed to fetch roadmap');
  const data = await res.json();
  return data.content;
}

export async function updateRoadmap(content: string): Promise<string> {
  const res = await fetch(`${API_BASE}/tasks/roadmap`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to update roadmap');
  const data = await res.json();
  return data.content;
}
