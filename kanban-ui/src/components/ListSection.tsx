import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';
import { Tag } from './Tag';
import { getEpicColor } from '../utils/epicColors';

interface ListSectionProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function ListSection({ status, tasks, onTaskClick }: ListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[6px]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-3 text-left cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
        )}
        <span className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {STATUS_LABELS[status]}
        </span>
        <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
          {tasks.length}
        </span>
      </button>

      {isExpanded && tasks.length > 0 && (
        <div>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="flex items-center gap-4 px-3 py-2 border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[14px] text-[var(--color-text-primary)] truncate block">
                  {task.title}
                </span>
              </div>

              <div className="w-[120px] flex-shrink-0">
                {task.epic ? (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-full"
                    style={{
                      backgroundColor: getEpicColor(task.epic).bg,
                      color: getEpicColor(task.epic).text,
                    }}
                  >
                    {task.epic}
                  </span>
                ) : (
                  <span className="text-[12px] text-[var(--color-text-muted)]">—</span>
                )}
              </div>

              <div className="w-[200px] flex-shrink-0 flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Tag key={tag} tag={tag} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isExpanded && tasks.length === 0 && (
        <div className="px-3 py-4 border-t border-[var(--color-border-subtle)] text-center">
          <span className="text-[12px] text-[var(--color-text-muted)]">No tasks</span>
        </div>
      )}
    </div>
  );
}
