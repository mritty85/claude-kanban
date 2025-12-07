import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskStatus, TaskTag, TaskFormData } from '../types/task';
import { STATUSES } from '../types/task';
import { Column } from './Column';
import { Card } from './Card';
import { TaskModal } from './TaskModal';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { SettingsModal } from './SettingsModal';
import { useTasks } from '../hooks/useTasks';
import { fetchConfig, updateConfig } from '../lib/api';
import { Plus, Settings } from 'lucide-react';

export function KanbanBoard() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    moveTask,
    reorderTasks,
    getTasksByStatus
  } = useTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [boardName, setBoardName] = useState('Task Manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([]);

  useEffect(() => {
    fetchConfig().then(config => setBoardName(config.boardName)).catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Custom collision detection: prefer pointerWithin for columns, fall back to rectIntersection
  const collisionDetection: CollisionDetection = (args) => {
    // First check if pointer is within any droppable
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // Fall back to rect intersection for edge cases
    return rectIntersection(args);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => task.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [tasks, searchQuery, selectedTags]);

  const getFilteredTasksByStatus = (status: TaskStatus) => {
    return filteredTasks
      .filter(t => t.status === status)
      .sort((a, b) => a.priority - b.priority);
  };

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(_event: DragOverEvent) {
    // Visual feedback is handled by useDroppable in Column
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;
    const isOverColumn = STATUSES.includes(overId as TaskStatus);
    const overTask = tasks.find(t => t.id === overId);

    if (isOverColumn) {
      const targetStatus = overId as TaskStatus;
      if (activeTask.status !== targetStatus) {
        await moveTask(activeTask.status, activeTask.filename, targetStatus);
      }
    } else if (overTask) {
      if (activeTask.status === overTask.status) {
        const columnTasks = getTasksByStatus(activeTask.status);
        const oldIndex = columnTasks.findIndex(t => t.id === activeTask.id);
        const newIndex = columnTasks.findIndex(t => t.id === overTask.id);

        if (oldIndex !== newIndex) {
          const newOrder = [...columnTasks];
          const [removed] = newOrder.splice(oldIndex, 1);
          newOrder.splice(newIndex, 0, removed);
          await reorderTasks(activeTask.status, newOrder.map(t => t.filename));
        }
      } else {
        await moveTask(activeTask.status, activeTask.filename, overTask.status);
      }
    }
  }

  function handleTaskClick(task: Task) {
    setModalTask(task);
    setIsModalOpen(true);
  }

  function handleCreateClick() {
    setModalTask(null);
    setIsModalOpen(true);
  }

  async function handleModalSave(data: TaskFormData) {
    if (modalTask) {
      if (data.status !== modalTask.status) {
        // Status changed - move the file first, then update other fields
        const movedTask = await moveTask(modalTask.status, modalTask.filename, data.status);
        // Update the other fields on the moved task
        await updateTask(data.status, movedTask.filename, data);
      } else {
        await updateTask(modalTask.status, modalTask.filename, data);
      }
    } else {
      await createTask(data);
    }
    setIsModalOpen(false);
  }

  async function handleSettingsSave(newBoardName: string) {
    await updateConfig({ boardName: newBoardName });
    setBoardName(newBoardName);
    setIsSettingsOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-muted)]">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-tag-bug-text)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
        <span className="text-[var(--color-text-primary)] text-[16px] font-semibold">{boardName}</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-[6px] hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <Settings size={18} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]" />
          </button>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterDropdown selected={selectedTags} onChange={setSelectedTags} />
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[var(--color-accent-primary)] text-white text-[13px] font-medium hover:bg-[var(--color-accent-primary-hover)] transition-colors"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full">
            {STATUSES.map((status, index) => (
              <div key={status} className="flex">
                <Column
                  status={status}
                  tasks={getFilteredTasksByStatus(status)}
                  onTaskClick={handleTaskClick}
                />
                {index < STATUSES.length - 1 && (
                  <div className="w-px bg-[var(--color-border-subtle)] mx-2 self-stretch" />
                )}
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <Card task={activeTask} onClick={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {isModalOpen && (
        <TaskModal
          task={modalTask}
          onSave={handleModalSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          boardName={boardName}
          onSave={handleSettingsSave}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
