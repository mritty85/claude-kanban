import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Check, Pencil } from 'lucide-react';
import type { Task, TaskFormData, TaskStatus, TaskTag, AcceptanceCriterion } from '../types/task';
import { STATUSES, STATUS_LABELS, TAGS, TAG_LABELS } from '../types/task';

interface TaskModalProps {
  task: Task | null;
  onSave: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
}

const tagStyles: Record<TaskTag, { bg: string; text: string; selected: string }> = {
  'new-functionality': { bg: 'bg-[#2e1f5e]/50', text: 'text-[#a78bfa]', selected: 'bg-[#2e1f5e] ring-2 ring-[#a78bfa]' },
  'feature-enhancement': { bg: 'bg-[#1e3a5f]/50', text: 'text-[#7dd3fc]', selected: 'bg-[#1e3a5f] ring-2 ring-[#7dd3fc]' },
  'bug': { bg: 'bg-[#4a1d1d]/50', text: 'text-[#f87171]', selected: 'bg-[#4a1d1d] ring-2 ring-[#f87171]' },
  'refactor': { bg: 'bg-[#1a3d3d]/50', text: 'text-[#5eead4]', selected: 'bg-[#1a3d3d] ring-2 ring-[#5eead4]' }
};

export function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('ideation');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriterion[]>([]);
  const [notes, setNotes] = useState('');
  const [newCriterion, setNewCriterion] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setDescription(task.description);
      setTags(task.tags);
      setAcceptanceCriteria(task.acceptanceCriteria);
      setNotes(task.notes);
    }
  }, [task]);

  function toggleTag(tag: TaskTag) {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  }

  function addCriterion() {
    if (newCriterion.trim()) {
      setAcceptanceCriteria([...acceptanceCriteria, { text: newCriterion.trim(), checked: false }]);
      setNewCriterion('');
    }
  }

  function toggleCriterion(index: number) {
    const updated = [...acceptanceCriteria];
    updated[index].checked = !updated[index].checked;
    setAcceptanceCriteria(updated);
  }

  function removeCriterion(index: number) {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
  }

  function startEditCriterion(index: number) {
    setEditingIndex(index);
    setEditingText(acceptanceCriteria[index].text);
  }

  function saveEditCriterion() {
    if (editingIndex !== null && editingText.trim()) {
      const updated = [...acceptanceCriteria];
      updated[editingIndex].text = editingText.trim();
      setAcceptanceCriteria(updated);
    }
    setEditingIndex(null);
    setEditingText('');
  }

  function cancelEditCriterion() {
    setEditingIndex(null);
    setEditingText('');
  }

  async function copyTaskPath() {
    if (!task) return;
    const path = `tasks/${task.status}/${task.filename}`;
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (newCriterion.trim()) {
      const confirmSave = window.confirm(
        `You have unsaved text in the Acceptance Criteria field:\n\n"${newCriterion.trim()}"\n\nDo you want to save without adding it?`
      );
      if (!confirmSave) return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        status,
        description: description.trim(),
        tags,
        acceptanceCriteria,
        notes: notes.trim()
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
              {task ? 'Edit Task' : 'New Task'}
            </h2>
            {task && (
              <button
                type="button"
                onClick={copyTaskPath}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-bg-elevated)] text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                title="Copy task path for @mention"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-[var(--color-accent-teal)]" />
                    <span className="text-[var(--color-accent-teal)]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Path</span>
                  </>
                )}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
              className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => {
                const isSelected = tags.includes(tag);
                const styles = tagStyles[tag];
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium transition-all ${styles.text} ${isSelected ? styles.selected : styles.bg}`}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={4}
              className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Acceptance Criteria
            </label>
            <div className="space-y-2 mb-3">
              {acceptanceCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={criterion.checked}
                    onChange={() => toggleCriterion(index)}
                    className="rounded"
                    disabled={editingIndex === index}
                  />
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEditCriterion();
                          } else if (e.key === 'Escape') {
                            cancelEditCriterion();
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-emphasis)] rounded text-[12px] text-[var(--color-text-primary)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={saveEditCriterion}
                        className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
                      >
                        <Check size={14} className="text-[var(--color-accent-teal)]" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditCriterion}
                        className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
                      >
                        <X size={14} className="text-[var(--color-text-muted)]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 text-[12px] ${criterion.checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                        {criterion.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditCriterion(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
                      >
                        <Pencil size={14} className="text-[var(--color-text-muted)]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCriterion(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
                      >
                        <Trash2 size={14} className="text-[var(--color-text-muted)]" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCriterion())}
                placeholder="Add criterion..."
                className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
              />
              <button
                type="button"
                onClick={addCriterion}
                className="p-2 bg-[var(--color-bg-elevated)] rounded-[6px] hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                <Plus size={16} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-[var(--color-accent-primary)] rounded-[6px] text-[13px] font-medium text-white hover:bg-[var(--color-accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
