import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Check } from 'lucide-react';
import type { Task } from '../types/task';
import { Tag } from './Tag';
import { getEpicColor } from '../utils/epicColors';

interface CardProps {
  task: Task;
  onClick: () => void;
  showPreview?: boolean;
}

function formatCompletedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Card({ task, onClick, showPreview = true }: CardProps) {
  const [copied, setCopied] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  async function copyPath(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(`tasks/${task.filename}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        relative group
        bg-[var(--color-bg-surface)]
        border border-[var(--color-border-subtle)]
        rounded-[6px] p-3 cursor-grab
        transition-all duration-150
        hover:bg-[var(--color-bg-elevated)]
        hover:border-[var(--color-border-emphasis)]
        ${isDragging ? 'shadow-lg shadow-black/30' : ''}
      `}
    >
      <button
        type="button"
        onClick={copyPath}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
        title="Copy task path"
      >
        {copied ? <Check size={14} className="text-[var(--color-accent-teal)]" /> : <Copy size={14} />}
      </button>
      <h3 className="text-[14px] font-bold text-[var(--color-text-primary)] mb-2 leading-tight font-display pr-6">
        {task.title}
      </h3>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      )}

      {showPreview && task.description && (
        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {task.status === 'done' && task.completed && (
        <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
          {formatCompletedDate(task.completed)}
        </p>
      )}

      {task.epic && (
        <div
          className="mt-3 -mx-3 -mb-3 px-3 py-1.5 text-xs font-medium rounded-b-[6px]"
          style={{
            backgroundColor: getEpicColor(task.epic).bg,
            color: getEpicColor(task.epic).text,
          }}
        >
          {task.epic}
        </div>
      )}
    </div>
  );
}
