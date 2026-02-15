import type { Project, LifecycleStage } from '../types/task';
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from '../types/task';
import { ProjectCard } from './ProjectCard';

const STAGE_COLOR_VAR: Record<LifecycleStage, string> = {
  prototype: 'var(--color-stage-prototype)',
  poc: 'var(--color-stage-poc)',
  beta: 'var(--color-stage-beta)',
  production: 'var(--color-stage-production)',
  launched: 'var(--color-stage-launched)',
};

interface WorkspaceBoardProps {
  projects: Project[];
  currentProjectId: string | null;
  onOpenProject: (id: string) => void;
  onStageChange: (id: string, stage: LifecycleStage) => void;
  onSummaryChange: (id: string, summary: string) => void;
}

export function WorkspaceBoard({ projects, currentProjectId, onOpenProject, onStageChange, onSummaryChange }: WorkspaceBoardProps) {
  const projectsByStage = LIFECYCLE_STAGES.reduce((acc, stage) => {
    acc[stage] = projects.filter(p => (p.lifecycleStage || 'prototype') === stage);
    return acc;
  }, {} as Record<LifecycleStage, Project[]>);

  return (
    <div>
      {/* Board header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="font-display text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Project Lifecycle
        </span>
        <span className="flex-1 h-px bg-[var(--color-border-subtle)]" />
        <span className="text-[11px] text-[var(--color-text-muted)] px-2 py-0.5 bg-[var(--color-bg-elevated)] rounded-full">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Columns */}
      <div className="flex gap-2.5 overflow-x-auto pb-4">
        {LIFECYCLE_STAGES.map(stage => {
          const stageProjects = projectsByStage[stage];
          return (
            <div key={stage} className="min-w-[240px] flex-1 flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 px-2.5 py-2.5 pb-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STAGE_COLOR_VAR[stage] }}
                />
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {LIFECYCLE_LABELS[stage]}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
                  {stageProjects.length}
                </span>
              </div>

              {/* Cards area */}
              <div
                className={`flex-1 flex flex-col gap-2 min-h-[120px] p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl
                  ${stageProjects.length === 0 ? 'items-center justify-center' : ''}
                `}
              >
                {stageProjects.length === 0 ? (
                  <span className="text-[11px] text-[var(--color-text-muted)] italic">
                    No projects
                  </span>
                ) : (
                  stageProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isActive={project.id === currentProjectId}
                      onOpen={onOpenProject}
                      onStageChange={onStageChange}
                      onSummaryChange={onSummaryChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
