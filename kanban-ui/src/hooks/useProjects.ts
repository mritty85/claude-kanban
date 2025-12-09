import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectFormData } from '../types/task';
import * as api from '../lib/api';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const [projectsList, current] = await Promise.all([
        api.fetchProjects(),
        api.fetchCurrentProject()
      ]);
      setProjects(projectsList);
      setCurrentProject(current);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const addProject = useCallback(async (data: ProjectFormData) => {
    const project = await api.addProject(data);
    setProjects(prev => [...prev, project]);
    return project;
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await api.removeProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    // If we removed the current project, refresh to get new current
    if (currentProject?.id === id) {
      const newCurrent = await api.fetchCurrentProject();
      setCurrentProject(newCurrent);
    }
  }, [currentProject?.id]);

  const updateProjectName = useCallback(async (id: string, name: string) => {
    const project = await api.updateProject(id, { name });
    // Update both name and boardName since the backend syncs them
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, boardName: name } : p));
    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, name, boardName: name } : null);
    }
    return project;
  }, [currentProject?.id]);

  const switchToProject = useCallback(async (id: string) => {
    const project = await api.switchProject(id);
    setCurrentProject(project);
    // Update lastAccessed in local state
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, lastAccessed: new Date().toISOString() } : p
    ));
    return project;
  }, []);

  const validatePath = useCallback(async (path: string) => {
    return api.validateProjectPath(path);
  }, []);

  return {
    projects,
    currentProject,
    loading,
    error,
    addProject,
    removeProject,
    updateProjectName,
    switchToProject,
    validatePath,
    refresh: loadProjects
  };
}
