import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFormData, TaskStatus } from '../types/task';
import * as api from '../lib/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.fetchTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const unsubscribe = api.subscribeToChanges(() => {
      loadTasks();
    });
    return unsubscribe;
  }, [loadTasks]);

  const createTask = useCallback(async (data: TaskFormData) => {
    const task = await api.createTask(data);
    setTasks(prev => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (status: TaskStatus, filename: string, data: Partial<TaskFormData>) => {
    const task = await api.updateTask(status, filename, data);
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    return task;
  }, []);

  const moveTask = useCallback(async (fromStatus: TaskStatus, filename: string, toStatus: TaskStatus, newPriority?: number) => {
    const task = await api.moveTask(fromStatus, filename, toStatus, newPriority);
    setTasks(prev => {
      const filtered = prev.filter(t => !(t.status === fromStatus && t.filename === filename));
      return [...filtered, task];
    });
    return task;
  }, []);

  const reorderTasks = useCallback(async (status: TaskStatus, orderedFilenames: string[]) => {
    const allTasks = await api.reorderTasks(status, orderedFilenames);
    setTasks(allTasks);
  }, []);

  const deleteTask = useCallback(async (status: TaskStatus, filename: string) => {
    await api.deleteTask(status, filename);
    setTasks(prev => prev.filter(t => !(t.status === status && t.filename === filename)));
  }, []);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    moveTask,
    reorderTasks,
    deleteTask,
    getTasksByStatus,
    refresh: loadTasks
  };
}
