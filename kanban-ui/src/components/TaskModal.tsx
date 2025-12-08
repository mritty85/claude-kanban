import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Check, Pencil, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  'refactor': { bg: 'bg-[#1a3d3d]/50', text: 'text-[#5eead4]', selected: 'bg-[#1a3d3d] ring-2 ring-[#5eead4]' },
  'devops': { bg: 'bg-[#4a3d1d]/50', text: 'text-[#fbbf24]', selected: 'bg-[#4a3d1d] ring-2 ring-[#fbbf24]' }
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

export function TaskModal({ task, onSave, onClose }: TaskModalProps) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

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

      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] w-[80vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-5">
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

            {/* Status and Tags side-by-side */}
            <div className="flex gap-3">
              <div className="flex-1">
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

              <div className="flex-1">
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
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                placeholder="Describe the task..."
                className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none overflow-hidden min-h-[100px]"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <div>
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

            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                placeholder="Additional notes..."
                className="w-full px-3 py-2.5 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none overflow-hidden min-h-[76px]"
              />
            </div>
          </div>

          {/* Footer - spans both columns */}
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
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
