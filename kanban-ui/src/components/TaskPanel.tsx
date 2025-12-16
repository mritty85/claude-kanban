import { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { X, Plus, Trash2, Copy, Check, Pencil, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskFormData, TaskStatus, TaskTag, AcceptanceCriterion } from '../types/task';
import { STATUSES, STATUS_LABELS, TAGS, TAG_LABELS } from '../types/task';
import { EpicCombobox } from './EpicCombobox';

function formatRelativeTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'Saved just now';
  if (diffSeconds < 60) return `Saved ${diffSeconds}s ago`;
  if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;
  if (diffHours < 24) return `Saved ${diffHours}h ago`;
  return `Saved on ${date.toLocaleDateString()}`;
}

interface TaskPanelProps {
  isOpen: boolean;
  task: Task | null;
  availableEpics: string[];
  onSave: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: (task: Task) => Promise<void>;
}

const tagStyles: Record<TaskTag, { bg: string; text: string; selected: string }> = {
  'new-functionality': { bg: 'bg-[var(--color-tag-new-bg)]/50', text: 'text-[var(--color-tag-new-text)]', selected: 'bg-[var(--color-tag-new-bg)] ring-2 ring-[var(--color-tag-new-text)]' },
  'feature-enhancement': { bg: 'bg-[var(--color-tag-feature-bg)]/50', text: 'text-[var(--color-tag-feature-text)]', selected: 'bg-[var(--color-tag-feature-bg)] ring-2 ring-[var(--color-tag-feature-text)]' },
  'bug': { bg: 'bg-[var(--color-tag-bug-bg)]/50', text: 'text-[var(--color-tag-bug-text)]', selected: 'bg-[var(--color-tag-bug-bg)] ring-2 ring-[var(--color-tag-bug-text)]' },
  'refactor': { bg: 'bg-[var(--color-tag-refactor-bg)]/50', text: 'text-[var(--color-tag-refactor-text)]', selected: 'bg-[var(--color-tag-refactor-bg)] ring-2 ring-[var(--color-tag-refactor-text)]' },
  'devops': { bg: 'bg-[var(--color-tag-devops-bg)]/50', text: 'text-[var(--color-tag-devops-text)]', selected: 'bg-[var(--color-tag-devops-bg)] ring-2 ring-[var(--color-tag-devops-text)]' }
};

interface SortableCriterionProps {
  id: string;
  criterion: AcceptanceCriterion;
  index: number;
  isDraggingAny: boolean;
  editingIndex: number | null;
  editingText: string;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  autoResize: (element: HTMLTextAreaElement) => void;
}

function SortableCriterion({
  id,
  criterion,
  index,
  isDraggingAny,
  editingIndex,
  editingText,
  onToggle,
  onEdit,
  onRemove,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  autoResize
}: SortableCriterionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEditing = editingIndex === index;
  const shouldDim = isDraggingAny && !isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group transition-opacity ${isDragging ? 'opacity-100 scale-[1.02] z-10' : ''} ${shouldDim ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <input
        type="checkbox"
        checked={criterion.checked}
        onChange={onToggle}
        className="rounded"
        disabled={isEditing}
      />
      {isEditing ? (
        <>
          <textarea
            value={editingText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            rows={1}
            className="flex-1 px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-emphasis)] rounded text-[12px] text-[var(--color-text-primary)] focus:outline-none overflow-hidden min-h-[28px]"
          />
          <button
            type="button"
            onClick={onSaveEdit}
            className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
          >
            <Check size={14} className="text-[var(--color-accent-teal)]" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
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
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
          >
            <Pencil size={14} className="text-[var(--color-text-muted)]" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-all"
          >
            <Trash2 size={14} className="text-[var(--color-text-muted)]" />
          </button>
        </>
      )}
    </div>
  );
}

export function TaskPanel({ isOpen, task, availableEpics, onSave, onClose, onDelete }: TaskPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [completed, setCompleted] = useState<string>('');
  const [epic, setEpic] = useState<string>('');

  // Auto-save state
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for debounce
  const saveTimeoutRef = useRef<number | null>(null);

  // Force re-render for relative time display
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  // Reset form when task changes or panel opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setStatus(task.status);
        setDescription(task.description);
        setTags(task.tags);
        setAcceptanceCriteria(task.acceptanceCriteria);
        setNotes(task.notes);
        setCompleted(task.completed || '');
        setEpic(task.epic || '');
      } else {
        // Reset to defaults for new task
        setTitle('');
        setStatus('ideation');
        setDescription('');
        setTags([]);
        setAcceptanceCriteria([]);
        setNotes('');
        setCompleted('');
        setEpic('');
      }
      setNewCriterion('');
      setEditingIndex(null);
      setEditingText('');
      setCopied(false);
      // Reset auto-save state
      setLastSaved(null);
      setAutoSaving(false);
    }
  }, [task, isOpen]);

  // Update relative time display every 10 seconds
  useEffect(() => {
    if (!lastSaved || !task) return;
    const interval = setInterval(() => {
      forceUpdate();
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSaved, task]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-focus title only for new tasks
  useEffect(() => {
    if (isOpen && !task) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, task]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build current form data for auto-save
  const getCurrentFormData = useCallback((): TaskFormData => ({
    title: title.trim(),
    status,
    description: description.trim(),
    tags,
    acceptanceCriteria,
    notes: notes.trim(),
    completed: completed || undefined,
    epic: epic.trim() || undefined
  }), [title, status, description, tags, acceptanceCriteria, notes, completed, epic]);

  // Perform the save operation (for existing tasks only)
  const performAutoSave = useCallback(async (data: TaskFormData) => {
    if (!task) return; // Only auto-save existing tasks
    if (!data.title) return; // Don't save with empty title

    setAutoSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [task, onSave]);

  // Debounced auto-save (1.5s delay)
  const triggerDebouncedSave = useCallback(() => {
    if (!task) return; // Only for existing tasks
    if (!title.trim()) return; // Validate title

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      performAutoSave(getCurrentFormData());
    }, 1500);
  }, [task, title, getCurrentFormData, performAutoSave]);

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

  function handleCriteriaReorder(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(String(active.id).replace('criterion-', ''));
    const newIndex = parseInt(String(over.id).replace('criterion-', ''));

    setAcceptanceCriteria(arrayMove(acceptanceCriteria, oldIndex, newIndex));
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

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        status,
        description: description.trim(),
        tags,
        acceptanceCriteria,
        notes: notes.trim(),
        completed: completed || undefined,
        epic: epic.trim() || undefined
      });
      onClose(); // Close panel after explicit save
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task || !onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(task);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out'
        }}
        className="fixed top-0 right-0 h-full w-full md:w-[70vw] max-w-[900px] bg-[var(--color-bg-surface)] border-l border-[var(--color-border-subtle)] z-50 flex flex-col"
      >
        {/* Close button - absolute top right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-[var(--color-bg-elevated)] transition-colors z-10"
        >
          <X size={20} className="text-[var(--color-text-muted)]" />
        </button>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Title row with save indicator and Copy Path button */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                required
                className="flex-1 px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
              />
              {/* Save indicator for existing tasks */}
              {task && (
                <span className="text-[12px] text-[var(--color-text-muted)] whitespace-nowrap">
                  {autoSaving ? 'Saving...' : formatRelativeTime(lastSaved)}
                </span>
              )}
              {task && (
                <button
                  type="button"
                  onClick={copyTaskPath}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-bg-elevated)] text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors"
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

            {/* Compact row: Status + Completed */}
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="sm:w-48 shrink-0">
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

              {/* Completed Date - only show for done status or if already set */}
              {(status === 'done' || completed) && (
                <div className="sm:w-48 shrink-0">
                  <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                    Completed
                  </label>
                  <input
                    type="datetime-local"
                    value={completed ? (() => {
                      const date = new Date(completed);
                      const offset = date.getTimezoneOffset();
                      const local = new Date(date.getTime() - offset * 60000);
                      return local.toISOString().slice(0, 16);
                    })() : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCompleted(new Date(e.target.value).toISOString());
                      } else {
                        setCompleted('');
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Epic */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Epic
              </label>
              <EpicCombobox
                value={epic}
                onChange={setEpic}
                availableEpics={availableEpics}
                placeholder="Select or type epic..."
              />
            </div>

            {/* Tags */}
            <div className="mb-5">
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

            {/* Description - largest textarea */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  triggerDebouncedSave();
                }}
                placeholder="Describe the task..."
                className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none min-h-[200px]"
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Acceptance Criteria
              </label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveDragId(String(e.active.id))}
                onDragEnd={handleCriteriaReorder}
              >
                <SortableContext
                  items={acceptanceCriteria.map((_, i) => `criterion-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mb-3">
                    {acceptanceCriteria.map((criterion, index) => (
                      <SortableCriterion
                        key={`criterion-${index}`}
                        id={`criterion-${index}`}
                        criterion={criterion}
                        index={index}
                        isDraggingAny={activeDragId !== null}
                        editingIndex={editingIndex}
                        editingText={editingText}
                        onToggle={() => toggleCriterion(index)}
                        onEdit={() => startEditCriterion(index)}
                        onRemove={() => removeCriterion(index)}
                        onEditTextChange={setEditingText}
                        onSaveEdit={saveEditCriterion}
                        onCancelEdit={cancelEditCriterion}
                        autoResize={autoResize}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2">
                <textarea
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addCriterion();
                    }
                  }}
                  placeholder="Add criterion..."
                  rows={1}
                  className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none overflow-hidden min-h-[36px]"
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

            {/* Notes */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  triggerDebouncedSave();
                }}
                placeholder="Additional notes..."
                className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none min-h-[120px]"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] shrink-0">
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[var(--color-tag-bug-text)]/30 rounded-[6px] text-[13px] font-medium text-[var(--color-tag-bug-text)] hover:bg-[var(--color-tag-bug-bg)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
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
          </div>
        </form>
      </div>
    </>
  );
}
