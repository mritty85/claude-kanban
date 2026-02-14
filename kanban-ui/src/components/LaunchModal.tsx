import { useState, useEffect } from 'react';
import { X, Play, Plus, Pencil, Trash2, Check, AlertCircle, Terminal } from 'lucide-react';
import type { LaunchConfig, LaunchConfigFormData } from '../types/task';
import {
  fetchLaunchConfigs,
  addLaunchConfig,
  updateLaunchConfig as updateLaunchConfigApi,
  deleteLaunchConfig as deleteLaunchConfigApi,
  launchTerminal
} from '../lib/api';

interface LaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'add' | 'edit';

export function LaunchModal({ isOpen, onClose }: LaunchModalProps) {
  const [configs, setConfigs] = useState<LaunchConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchFeedback, setLaunchFeedback] = useState<string | null>(null);

  // Form state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingConfig, setEditingConfig] = useState<LaunchConfig | null>(null);
  const [formName, setFormName] = useState('');
  const [formCommand, setFormCommand] = useState('');
  const [formWorkingDir, setFormWorkingDir] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  async function loadConfigs() {
    setLoading(true);
    try {
      const data = await fetchLaunchConfigs();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to load launch configs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch(config: LaunchConfig) {
    setLaunching(config.id);
    setLaunchFeedback(null);
    try {
      await launchTerminal(config.id);
      setLaunchFeedback(`Launched: ${config.name}`);
      setTimeout(() => setLaunchFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to launch:', err);
      setLaunchFeedback('Failed to launch terminal');
      setTimeout(() => setLaunchFeedback(null), 3000);
    } finally {
      setLaunching(null);
    }
  }

  function handleStartAdd() {
    setViewMode('add');
    setFormName('');
    setFormCommand('');
    setFormWorkingDir('');
    setFormError(null);
    setEditingConfig(null);
  }

  function handleStartEdit(config: LaunchConfig) {
    setViewMode('edit');
    setEditingConfig(config);
    setFormName(config.name);
    setFormCommand(config.command);
    setFormWorkingDir(config.workingDir || '');
    setFormError(null);
  }

  function handleCancelForm() {
    setViewMode('list');
    setFormName('');
    setFormCommand('');
    setFormWorkingDir('');
    setFormError(null);
    setEditingConfig(null);
  }

  async function handleSaveForm() {
    if (!formName.trim() || !formCommand.trim()) {
      setFormError('Name and command are required');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (viewMode === 'add') {
        const newConfig = await addLaunchConfig({
          name: formName.trim(),
          command: formCommand.trim(),
          workingDir: formWorkingDir.trim() || undefined
        });
        setConfigs([...configs, newConfig]);
      } else if (viewMode === 'edit' && editingConfig) {
        const updated = await updateLaunchConfigApi(editingConfig.id, {
          name: formName.trim(),
          command: formCommand.trim(),
          workingDir: formWorkingDir.trim() || undefined
        });
        setConfigs(configs.map(c => c.id === updated.id ? updated : c));
      }
      handleCancelForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeleting(true);
    try {
      await deleteLaunchConfigApi(id);
      setConfigs(configs.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-full max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] font-display">
              {viewMode === 'list' ? 'Launch Terminal' : viewMode === 'add' ? 'Add Launch Config' : 'Edit Launch Config'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {viewMode === 'list' ? (
            <>
              {/* Launch feedback toast */}
              {launchFeedback && (
                <div className="mb-4 px-3 py-2 rounded-[6px] bg-[var(--color-accent-success)]/10 border border-[var(--color-accent-success)]/20 text-[13px] text-[var(--color-accent-success)]">
                  {launchFeedback}
                </div>
              )}

              {loading ? (
                <div className="text-[13px] text-[var(--color-text-muted)] text-center py-8">
                  Loading...
                </div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8">
                  <Terminal size={32} className="text-[var(--color-text-muted)] mx-auto mb-3" />
                  <p className="text-[13px] text-[var(--color-text-muted)]">
                    No launch configurations yet.
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                    Add commands like "npm run dev" or "claude" to quickly launch terminals.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {configs.map(config => (
                    <div
                      key={config.id}
                      className="group flex items-center gap-3 p-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-emphasis)] transition-colors"
                    >
                      {/* Launch button */}
                      <button
                        onClick={() => handleLaunch(config)}
                        disabled={launching === config.id}
                        className="flex-shrink-0 p-2 rounded-[6px] bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-hover)] disabled:opacity-50 transition-colors"
                        title="Launch"
                      >
                        <Play size={16} className={launching === config.id ? 'animate-pulse' : ''} />
                      </button>

                      {/* Config info - clickable to launch */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleLaunch(config)}
                      >
                        <div className="text-[13px] font-bold text-[var(--color-text-primary)] font-display">
                          {config.name}
                        </div>
                        <div className="text-[12px] text-[var(--color-text-muted)] font-body truncate">
                          {config.workingDir && <span className="text-[var(--color-text-muted)]">{config.workingDir}/</span>}
                          {config.command}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(config)}
                          className="p-1.5 rounded hover:bg-[var(--color-bg-base)] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} className="text-[var(--color-text-muted)]" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          disabled={deleting && confirmDeleteId === config.id}
                          className={`p-1.5 rounded transition-colors ${
                            confirmDeleteId === config.id
                              ? 'bg-[var(--color-accent-danger)]/10 hover:bg-[var(--color-accent-danger)]/20'
                              : 'hover:bg-[var(--color-bg-base)]'
                          }`}
                          title={confirmDeleteId === config.id ? 'Click again to confirm' : 'Delete'}
                        >
                          <Trash2
                            size={14}
                            className={confirmDeleteId === config.id ? 'text-[var(--color-accent-danger)]' : 'text-[var(--color-text-muted)]'}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Add/Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Dev Server"
                  autoFocus
                  className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] mb-1.5">
                  Command
                </label>
                <input
                  type="text"
                  value={formCommand}
                  onChange={(e) => setFormCommand(e.target.value)}
                  placeholder="npm run dev"
                  className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none font-body"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveForm();
                    if (e.key === 'Escape') handleCancelForm();
                  }}
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--color-text-muted)] mb-1.5">
                  Working Directory <span className="text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formWorkingDir}
                  onChange={(e) => setFormWorkingDir(e.target.value)}
                  placeholder="kanban-ui"
                  className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none font-body"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveForm();
                    if (e.key === 'Escape') handleCancelForm();
                  }}
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                  Relative to project root, or absolute path. Leave empty for project root.
                </p>
              </div>

              {formError && (
                <div className="flex items-start gap-2 p-2 rounded bg-[var(--color-accent-danger)]/10 border border-[var(--color-accent-danger)]/20">
                  <AlertCircle size={14} className="text-[var(--color-accent-danger)] flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-[var(--color-text-primary)]">{formError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--color-border-subtle)]">
          {viewMode === 'list' ? (
            <>
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Plus size={16} />
                Add Config
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                disabled={saving || !formName.trim() || !formCommand.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] rounded-[6px] text-[13px] font-medium text-white hover:bg-[var(--color-accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
