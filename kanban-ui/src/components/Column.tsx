import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';
import { Card } from './Card';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function Column({ status, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-w-[280px] max-w-[320px] flex-1
        rounded-lg p-2 transition-colors duration-150
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
