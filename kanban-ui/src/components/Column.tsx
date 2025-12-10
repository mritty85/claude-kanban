import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';
import { Card } from './Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Column({ status, tasks, onTaskClick, isCollapsed, onToggleCollapse }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: isCollapsed
  });

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center w-12 flex-shrink-0 rounded-lg p-2 column-transition">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border-subtle)] transition-colors"
          aria-label={`Expand ${STATUS_LABELS[status]} column`}
        >
          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
        </button>

        <h2
          className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-3 whitespace-nowrap"
          style={{ writingMode: 'vertical-lr' }}
        >
          {STATUS_LABELS[status]}
        </h2>

        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] mt-3">
          {tasks.length}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-w-[280px] max-w-[320px] flex-1
        rounded-lg p-2 transition-colors duration-150 column-transition
        ${isOver
          ? 'bg-[var(--color-accent-primary)]/10 ring-2 ring-dashed ring-[var(--color-accent-primary)]'
          : 'bg-transparent'
        }
      `}
    >
      <div className="flex items-center gap-2 pb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
          {tasks.length}
        </span>
        <div className="flex-1" />
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-border-subtle)] transition-colors"
          aria-label={`Collapse ${STATUS_LABELS[status]} column`}
        >
          <ChevronLeft size={14} className="text-[var(--color-text-muted)]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <Card key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
