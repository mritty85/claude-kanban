import type { Task, TaskStatus } from '../types/task';
import { STATUSES } from '../types/task';
import { ListSection } from './ListSection';

interface ListViewProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  onTaskClick: (task: Task) => void;
}

export function ListView({ tasksByStatus, onTaskClick }: ListViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {STATUSES.map((status) => (
        <ListSection
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
