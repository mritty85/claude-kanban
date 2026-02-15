import { useState } from 'react';
import type { Project, LifecycleStage } from '../types/task';
import { WorkspaceSummary } from './WorkspaceSummary';
import { WorkspaceBoard } from './WorkspaceBoard';
import { ProjectsModal } from './ProjectsModal';
import { useProjects } from '../hooks/useProjects';
import { useTheme } from '../hooks/useTheme';
import { Plus, Sun, Moon } from 'lucide-react';

interface WorkspaceHomeProps {
  onOpenProject: (id: string) => void;
}

export function WorkspaceHome({ onOpenProject }: WorkspaceHomeProps) {
  const {
    projects,
    currentProject,
    loading,
    addProject,
    removeProject,
    updateProjectName,
    updateProjectStage,
    updateProjectSummary,
    switchToProject,
    validatePath
  } = useProjects();

  const { isDark, toggleTheme } = useTheme();
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  const handleOpenProject = async (id: string) => {
    await switchToProject(id);
    onOpenProject(id);
  };

  const handleStageChange = (id: string, stage: LifecycleStage) => {
    updateProjectStage(id, stage);
  };

  const handleSummaryChange = (id: string, summary: string) => {
    updateProjectSummary(id, summary);
  };

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-10 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">
              Workspace
            </h1>
            <span className="text-xs text-[var(--color-text-muted)] mt-1 block">
              {dateStr}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-emphasis)] transition-all duration-150"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Register project button */}
            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className="flex items-center gap-1.5 font-display text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-[7px] hover:bg-[var(--color-bg-surface)] hover:border-[var(--color-border-emphasis)] hover:text-[var(--color-text-primary)] transition-all duration-150"
            >
              <Plus size={14} />
              Register Project
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <WorkspaceSummary projects={projects} />

        {/* Board */}
        <WorkspaceBoard
          projects={projects}
          currentProjectId={currentProject?.id || null}
          onOpenProject={handleOpenProject}
          onStageChange={handleStageChange}
          onSummaryChange={handleSummaryChange}
        />
      </div>

      {/* Projects Modal (for registering new projects) */}
      {isProjectsModalOpen && (
        <ProjectsModal
          projects={projects}
          currentProject={currentProject}
          onAdd={addProject}
          onRemove={removeProject}
          onUpdateName={updateProjectName}
          onSwitch={async (id) => { await switchToProject(id); }}
          onValidatePath={validatePath}
          onClose={() => setIsProjectsModalOpen(false)}
        />
      )}
    </div>
  );
}
