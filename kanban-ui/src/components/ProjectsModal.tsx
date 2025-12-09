import { useState } from 'react';
import { X, Trash2, Pencil, Check, AlertCircle, FolderPlus } from 'lucide-react';
import type { Project, ProjectFormData, PathValidation } from '../types/task';

interface ProjectsModalProps {
  projects: Project[];
  currentProject: Project | null;
  onAdd: (data: ProjectFormData) => Promise<Project & { tasksCreated?: boolean }>;
  onRemove: (id: string) => Promise<void>;
  onUpdateName: (id: string, name: string) => Promise<Project>;
  onSwitch: (id: string) => Promise<void>;
  onValidatePath: (path: string) => Promise<PathValidation>;
  onClose: () => void;
}

export function ProjectsModal({
  projects,
  currentProject,
  onAdd,
  onRemove,
  onUpdateName,
  onSwitch,
  onValidatePath,
  onClose
}: ProjectsModalProps) {
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pathValidation, setPathValidation] = useState<PathValidation | null>(null);
  const [validating, setValidating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function handleValidatePath() {
    if (!newPath.trim()) return;
    setValidating(true);
    setPathValidation(null);
    try {
      const result = await onValidatePath(newPath.trim());
      setPathValidation(result);
    } catch (err) {
      setPathValidation({ valid: false, error: 'Failed to validate path' });
    } finally {
      setValidating(false);
    }
  }

  async function handleAdd(createTasksDir: boolean = false) {
    if (!newName.trim() || !newPath.trim()) return;

    setAdding(true);
    setAddError(null);
    try {
      const result = await onAdd({
        name: newName.trim(),
        path: newPath.trim(),
        createTasksDir
      });
      setNewName('');
      setNewPath('');
      setPathValidation(null);
      if (result.tasksCreated) {
        // Optionally show a success message
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add project');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    if (confirmRemove !== id) {
      setConfirmRemove(id);
      return;
    }
    setRemovingId(id);
    try {
      await onRemove(id);
      setConfirmRemove(null);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await onUpdateName(id, editName.trim());
      setEditingId(null);
      setEditName('');
    } catch {
      // Error handling
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditName(project.name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            Manage Projects
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Project list */}
          <div>
            <h3 className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Your Projects
            </h3>

            {projects.length === 0 ? (
              <div className="text-[13px] text-[var(--color-text-muted)] py-4 text-center bg-[var(--color-bg-elevated)] rounded-[6px]">
                No projects yet. Add your first project below.
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`
                      p-3 rounded-[6px] border
                      ${project.id === currentProject?.id
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]'
                      }
                    `}
                  >
                    {editingId === project.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(project.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(project.id)}
                          className="p-1.5 rounded hover:bg-[var(--color-bg-base)] transition-colors"
                        >
                          <Check size={16} className="text-[var(--color-accent-success)]" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded hover:bg-[var(--color-bg-base)] transition-colors"
                        >
                          <X size={16} className="text-[var(--color-text-muted)]" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => project.id !== currentProject?.id && onSwitch(project.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                              {project.name}
                            </span>
                            {project.id === currentProject?.id && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-accent-primary)] text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                            {project.path}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(project)}
                            className="p-1.5 rounded hover:bg-[var(--color-bg-base)] transition-colors"
                            title="Edit name"
                          >
                            <Pencil size={14} className="text-[var(--color-text-muted)]" />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={() => handleRemove(project.id)}
                              disabled={removingId === project.id}
                              className={`
                                p-1.5 rounded transition-colors
                                ${confirmRemove === project.id
                                  ? 'bg-[var(--color-accent-danger)]/10 hover:bg-[var(--color-accent-danger)]/20'
                                  : 'hover:bg-[var(--color-bg-base)]'
                                }
                              `}
                              title={confirmRemove === project.id ? 'Click again to confirm' : 'Remove project'}
                            >
                              <Trash2
                                size={14}
                                className={confirmRemove === project.id ? 'text-[var(--color-accent-danger)]' : 'text-[var(--color-text-muted)]'}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new project */}
          <div className="border-t border-[var(--color-border-subtle)] pt-5">
            <h3 className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Add New Project
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Project"
                  className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] mb-1.5">
                  Project Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPath}
                    onChange={(e) => {
                      setNewPath(e.target.value);
                      setPathValidation(null);
                    }}
                    onBlur={handleValidatePath}
                    placeholder="/Users/you/projects/my-project"
                    className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none font-mono"
                  />
                </div>
                {validating && (
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                    Validating path...
                  </p>
                )}
                {pathValidation && !pathValidation.valid && (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded bg-[var(--color-accent-danger)]/10 border border-[var(--color-accent-danger)]/20">
                    <AlertCircle size={14} className="text-[var(--color-accent-danger)] flex-shrink-0 mt-0.5" />
                    <div className="text-[12px] text-[var(--color-text-primary)]">
                      {pathValidation.error}
                      {pathValidation.canCreate && (
                        <button
                          onClick={() => handleAdd(true)}
                          disabled={adding || !newName.trim()}
                          className="ml-2 text-[var(--color-accent-primary)] hover:underline"
                        >
                          Create tasks folder
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {pathValidation && pathValidation.valid && (
                  <p className="text-[11px] text-[var(--color-accent-success)] mt-1.5">
                    Path is valid
                  </p>
                )}
              </div>

              {addError && (
                <div className="flex items-start gap-2 p-2 rounded bg-[var(--color-accent-danger)]/10 border border-[var(--color-accent-danger)]/20">
                  <AlertCircle size={14} className="text-[var(--color-accent-danger)] flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-[var(--color-text-primary)]">{addError}</span>
                </div>
              )}

              <button
                onClick={() => handleAdd(false)}
                disabled={adding || !newName.trim() || !newPath.trim() || (pathValidation !== null && !pathValidation.valid)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent-primary)] rounded-[6px] text-[13px] font-medium text-white hover:bg-[var(--color-accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FolderPlus size={16} />
                {adding ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
