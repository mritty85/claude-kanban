import { useState, useRef, useEffect } from 'react';
import type { Project, LifecycleStage } from '../types/task';
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from '../types/task';

function truncatePath(p: string): string {
  const home = '~';
  if (p.startsWith('/Users/')) {
    const parts = p.split('/');
    return home + '/' + parts.slice(3).join('/');
  }
  return p;
}

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onOpen: (id: string) => void;
  onStageChange: (id: string, stage: LifecycleStage) => void;
  onSummaryChange: (id: string, summary: string) => void;
}

export function ProjectCard({ project, isActive, onOpen, onStageChange, onSummaryChange }: ProjectCardProps) {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(project.summary || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stage = project.lifecycleStage || 'prototype';
  const isArchived = stage === 'launched';

  useEffect(() => {
    if (isEditingSummary && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditingSummary]);

  function handleSaveSummary() {
    const val = summaryDraft.trim();
    onSummaryChange(project.id, val);
    setIsEditingSummary(false);
  }

  function handleCancelSummary() {
    setSummaryDraft(project.summary || '');
    setIsEditingSummary(false);
  }

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if interacting with summary or stage dropdown
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-navigate]')) return;
    onOpen(project.id);
  }

  return (
    <div
      className={`
        rounded-lg p-3.5 cursor-pointer transition-all duration-[180ms] ease-out relative
        border
        bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)]
        hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-emphasis)]
        hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        ${isActive ? 'border-[var(--color-accent-primary)] shadow-[0_0_0_1px_var(--color-accent-primary),0_0_16px_rgba(124,92,255,0.15)]' : ''}
        ${isArchived ? 'opacity-55 hover:opacity-80' : ''}
      `}
      onClick={handleCardClick}
      tabIndex={0}
    >
      {/* Top row: name + badge */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[var(--color-text-primary)] leading-tight">
          <span className="truncate">{project.name}</span>
          {isActive && (
            <span className="font-display text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[var(--color-accent-primary)] text-white shrink-0">
              Current
            </span>
          )}
          {isArchived && !isActive && (
            <span className="font-display text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[rgba(82,91,112,0.25)] text-[var(--color-stage-launched)] shrink-0">
              Archived
            </span>
          )}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
          {truncatePath(project.path)}
        </div>
      </div>

      {/* Summary (inline editable) */}
      <div data-no-navigate>
        {isEditingSummary ? (
          <textarea
            ref={textareaRef}
            className="w-full text-[11px] leading-[1.45] text-[var(--color-text-primary)] bg-[var(--color-bg-base)] border border-[var(--color-accent-primary)] rounded px-1.5 py-1 resize-none outline-none shadow-[0_0_0_2px_rgba(124,92,255,0.15)] font-body"
            value={summaryDraft}
            onChange={(e) => {
              setSummaryDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleSaveSummary}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelSummary();
              }
            }}
            rows={1}
          />
        ) : (
          <div
            className={`text-[11px] leading-[1.45] px-1.5 py-1 -mx-1.5 rounded border border-transparent cursor-text transition-all duration-150
              hover:border-[var(--color-border-subtle)] hover:bg-[rgba(255,255,255,0.02)]
              ${project.summary ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)] italic'}
            `}
            onClick={() => {
              setSummaryDraft(project.summary || '');
              setIsEditingSummary(true);
            }}
          >
            {project.summary || 'Add a note...'}
          </div>
        )}
      </div>

      {/* Stage selector */}
      <div data-no-navigate className="mt-2">
        <select
          className="text-[10px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded px-1.5 py-0.5 text-[var(--color-text-secondary)] outline-none cursor-pointer hover:border-[var(--color-border-emphasis)] font-body"
          value={stage}
          onChange={(e) => onStageChange(project.id, e.target.value as LifecycleStage)}
        >
          {LIFECYCLE_STAGES.map(s => (
            <option key={s} value={s}>{LIFECYCLE_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
