import type { Project, LifecycleStage } from '../types/task';
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from '../types/task';

const STAGE_COLOR_VAR: Record<LifecycleStage, string> = {
  prototype: 'var(--color-stage-prototype)',
  poc: 'var(--color-stage-poc)',
  beta: 'var(--color-stage-beta)',
  production: 'var(--color-stage-production)',
  launched: 'var(--color-stage-launched)',
};

interface WorkspaceSummaryProps {
  projects: Project[];
}

export function WorkspaceSummary({ projects }: WorkspaceSummaryProps) {
  const stageCounts = LIFECYCLE_STAGES.reduce((acc, stage) => {
    acc[stage] = projects.filter(p => (p.lifecycleStage || 'prototype') === stage).length;
    return acc;
  }, {} as Record<LifecycleStage, number>);

  // Only show stages that have projects (plus always show total)
  const visibleStages = LIFECYCLE_STAGES.filter(s => stageCounts[s] > 0);

  return (
    <div className="flex gap-px bg-[var(--color-border-subtle)] rounded-lg overflow-hidden mb-8">
      {/* Total */}
      <div className="flex-1 bg-[var(--color-bg-surface)] py-3.5 px-4.5 flex flex-col gap-0.5 first:rounded-l-lg">
        <span className="font-display text-[22px] font-bold text-[var(--color-text-primary)]">
          {projects.length}
        </span>
        <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
          Projects
        </span>
      </div>

      {/* Per-stage counts */}
      {visibleStages.map(stage => (
        <div key={stage} className="flex-1 bg-[var(--color-bg-surface)] py-3.5 px-4.5 flex flex-col gap-0.5 last:rounded-r-lg">
          <span
            className="font-display text-[22px] font-bold"
            style={{ color: STAGE_COLOR_VAR[stage] }}
          >
            {stageCounts[stage]}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
            {LIFECYCLE_LABELS[stage]}
          </span>
        </div>
      ))}
    </div>
  );
}
