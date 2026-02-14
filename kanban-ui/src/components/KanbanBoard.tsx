import { useState, useMemo, useCallback } from 'react';
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
import type { Task, TaskStatus, TaskTag, TaskFormData, DateFilter, DoneSortOption } from '../types/task';
import { STATUSES } from '../types/task';
import { Column } from './Column';
import { Card } from './Card';
import { TaskPanel } from './TaskPanel';
import { NotesPanel } from './NotesPanel';
import { RoadmapPanel } from './RoadmapPanel';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { ProjectSwitcher } from './ProjectSwitcher';
import { ProjectsModal } from './ProjectsModal';
import { LaunchModal } from './LaunchModal';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { Plus, FileText, Map, Terminal, List, LayoutGrid } from 'lucide-react';
import { ListView } from './ListView';

export function KanbanBoard() {
  const {
    projects,
    currentProject,
    loading: projectsLoading,
    addProject,
    removeProject,
    updateProjectName,
    switchToProject,
    validatePath
  } = useProjects();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    moveTask,
    reorderTasks,
    deleteTask,
    getTasksByStatus
  } = useTasks(currentProject?.id || null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isRoadmapPanelOpen, setIsRoadmapPanelOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: null });
  const [doneSort, setDoneSort] = useState<DoneSortOption>('default');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [selectedEpics, setSelectedEpics] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    const saved = localStorage.getItem('kanban-show-preview');
    return saved === null ? true : saved === 'true';
  });

  const togglePreview = useCallback(() => {
    setShowPreview(prev => {
      const next = !prev;
      localStorage.setItem('kanban-show-preview', String(next));
      return next;
    });
  }, []);

  // Collect all unique epics from tasks for filtering and autocomplete
  const availableEpics = useMemo(() => {
    const epicSet = new Set<string>();
    tasks.forEach(task => {
      if (task.epic) {
        epicSet.add(task.epic);
      }
    });
    return Array.from(epicSet).sort();
  }, [tasks]);

  // Handle project switch - refresh tasks
  const handleProjectSwitch = useCallback(async (id: string) => {
    await switchToProject(id);
    // Tasks will auto-refresh via SSE 'project-switched' event
  }, [switchToProject]);

  const toggleColumnCollapse = useCallback((status: TaskStatus) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
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

  // Compute date range from filter preset
  const getDateRange = useCallback((filter: DateFilter): { start: Date | null; end: Date | null } => {
    if (!filter.preset) return { start: null, end: null };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter.preset) {
      case 'last7days':
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
        };
      case 'last30days':
        return {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        };
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
      case 'custom':
        return {
          start: filter.startDate ? new Date(filter.startDate) : null,
          end: filter.endDate ? new Date(filter.endDate + 'T23:59:59.999') : null
        };
      default:
        return { start: null, end: null };
    }
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => task.tags.includes(tag));
      const matchesEpics = selectedEpics.length === 0 ||
        (task.epic && selectedEpics.includes(task.epic));
      return matchesSearch && matchesTags && matchesEpics;
    });
  }, [tasks, searchQuery, selectedTags, selectedEpics]);

  const getFilteredTasksByStatus = useCallback((status: TaskStatus) => {
    let statusTasks = filteredTasks.filter(t => t.status === status);

    // Apply date filter only to Done column
    if (status === 'done' && dateFilter.preset) {
      const { start, end } = getDateRange(dateFilter);
      statusTasks = statusTasks.filter(task => {
        if (!task.completed) return false; // Exclude tasks without completion date
        const completedDate = new Date(task.completed);
        if (start && completedDate < start) return false;
        if (end && completedDate > end) return false;
        return true;
      });
    }

    // Apply sorting for Done column
    if (status === 'done' && doneSort !== 'default') {
      return statusTasks.sort((a, b) => {
        // Tasks without completion date go to the end
        if (!a.completed && !b.completed) return 0;
        if (!a.completed) return 1;
        if (!b.completed) return -1;

        const dateA = new Date(a.completed).getTime();
        const dateB = new Date(b.completed).getTime();

        if (doneSort === 'completedNewest') {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      });
    }

    // Tasks are already sorted by order file on the backend
    return statusTasks;
  }, [filteredTasks, dateFilter, doneSort, getDateRange]);

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
        await moveTask(activeTask.filename, targetStatus);
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
          await reorderTasks(activeTask.status, newOrder.map(t => t.id));
        }
      } else {
        await moveTask(activeTask.filename, overTask.status);
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
        const movedTask = await moveTask(modalTask.filename, data.status);
        // Update the other fields on the moved task
        await updateTask(movedTask.filename, data);
      } else {
        await updateTask(modalTask.filename, data);
      }
    } else {
      await createTask(data);
    }
    // Note: Panel closing handled by TaskPanel to support auto-save without closing
  }

  async function handleDelete(task: Task) {
    await deleteTask(task.filename);
    setIsModalOpen(false);
  }

  const loading = tasksLoading || projectsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-tag-bug-text)]">{tasksError}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <ProjectSwitcher
            currentProject={currentProject}
            projects={projects}
            onSwitch={handleProjectSwitch}
            onManage={() => setIsProjectsModalOpen(true)}
            showPreview={showPreview}
            onTogglePreview={togglePreview}
          />
          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Terminal size={16} />
            Launch
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
            title={viewMode === 'kanban' ? 'Switch to list view' : 'Switch to kanban view'}
          >
            {viewMode === 'kanban' ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterDropdown
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            selectedEpics={selectedEpics}
            onEpicsChange={setSelectedEpics}
            availableEpics={availableEpics}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            doneSort={doneSort}
            onDoneSortChange={setDoneSort}
          />
          <button
            onClick={() => setIsRoadmapPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Map size={16} />
            Roadmap
          </button>
          <button
            onClick={() => setIsNotesPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <FileText size={16} />
            Notes
          </button>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[var(--color-accent-primary)] text-white text-[13px] font-bold hover:bg-[var(--color-accent-primary-hover)] transition-colors font-display"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </header>

      <main className={`flex-1 p-4 ${viewMode === 'kanban' ? 'overflow-x-auto' : 'overflow-y-auto'}`}>
        {viewMode === 'kanban' ? (
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
                    isCollapsed={collapsedColumns.has(status)}
                    onToggleCollapse={() => toggleColumnCollapse(status)}
                    showPreview={showPreview}
                  />
                  {index < STATUSES.length - 1 && (
                    <div className="w-px bg-[var(--color-border-subtle)] mx-2 self-stretch" />
                  )}
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <Card task={activeTask} onClick={() => {}} showPreview={showPreview} />
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <ListView
            tasksByStatus={STATUSES.reduce((acc, status) => {
              acc[status] = getFilteredTasksByStatus(status);
              return acc;
            }, {} as Record<TaskStatus, Task[]>)}
            onTaskClick={handleTaskClick}
          />
        )}
      </main>

      <TaskPanel
        isOpen={isModalOpen}
        task={modalTask}
        availableEpics={availableEpics}
        onSave={handleModalSave}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDelete}
      />

      <NotesPanel
        isOpen={isNotesPanelOpen}
        onClose={() => setIsNotesPanelOpen(false)}
        projectId={currentProject?.id || null}
      />

      <RoadmapPanel
        isOpen={isRoadmapPanelOpen}
        onClose={() => setIsRoadmapPanelOpen(false)}
        projectId={currentProject?.id || null}
      />

      {isProjectsModalOpen && (
        <ProjectsModal
          projects={projects}
          currentProject={currentProject}
          onAdd={addProject}
          onRemove={removeProject}
          onUpdateName={updateProjectName}
          onSwitch={handleProjectSwitch}
          onValidatePath={validatePath}
          onClose={() => setIsProjectsModalOpen(false)}
        />
      )}

      <LaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </div>
  );
}
