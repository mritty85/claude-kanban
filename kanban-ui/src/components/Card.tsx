import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types/task';
import { Tag } from './Tag';
import { getEpicColor } from '../utils/epicColors';

interface CardProps {
  task: Task;
  onClick: () => void;
}

function formatCompletedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Card({ task, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    scale: isDragging ? '1.02' : '1'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-[var(--color-bg-surface)]
        border border-[var(--color-border-subtle)]
        rounded-[6px] p-3 cursor-grab
        transition-all duration-150
        hover:bg-[var(--color-bg-elevated)]
        hover:border-[var(--color-border-emphasis)]
        ${isDragging ? 'shadow-lg shadow-black/30' : ''}
      `}
    >
      {task.epic && (
        <span
          className="inline-block px-2 py-0.5 rounded text-[10px] font-medium mb-1.5"
          style={{
            backgroundColor: getEpicColor(task.epic).bg,
            color: getEpicColor(task.epic).text,
          }}
        >
          {task.epic}
        </span>
      )}
      <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-2 leading-tight">
        {task.title}
      </h3>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      )}

      {task.description && (
        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {task.status === 'done' && task.completed && (
        <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
          {formatCompletedDate(task.completed)}
        </p>
      )}
    </div>
  );
}
