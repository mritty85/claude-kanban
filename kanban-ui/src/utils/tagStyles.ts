import type { TaskTag } from '../types/task';

export const tagStyles: Record<TaskTag, string> = {
  'new-functionality': 'bg-[var(--color-tag-new-bg)] text-[var(--color-tag-new-text)]',
  'feature-enhancement': 'bg-[var(--color-tag-feature-bg)] text-[var(--color-tag-feature-text)]',
  'bug': 'bg-[var(--color-tag-bug-bg)] text-[var(--color-tag-bug-text)]',
  'refactor': 'bg-[var(--color-tag-refactor-bg)] text-[var(--color-tag-refactor-text)]',
  'devops': 'bg-[var(--color-tag-devops-bg)] text-[var(--color-tag-devops-text)]'
};

export const tagSelectStyles: Record<TaskTag, { bg: string; text: string; selected: string }> = {
  'new-functionality': { bg: 'bg-[var(--color-tag-new-bg)]/50', text: 'text-[var(--color-tag-new-text)]', selected: 'bg-[var(--color-tag-new-bg)] ring-2 ring-[var(--color-tag-new-text)]' },
  'feature-enhancement': { bg: 'bg-[var(--color-tag-feature-bg)]/50', text: 'text-[var(--color-tag-feature-text)]', selected: 'bg-[var(--color-tag-feature-bg)] ring-2 ring-[var(--color-tag-feature-text)]' },
  'bug': { bg: 'bg-[var(--color-tag-bug-bg)]/50', text: 'text-[var(--color-tag-bug-text)]', selected: 'bg-[var(--color-tag-bug-bg)] ring-2 ring-[var(--color-tag-bug-text)]' },
  'refactor': { bg: 'bg-[var(--color-tag-refactor-bg)]/50', text: 'text-[var(--color-tag-refactor-text)]', selected: 'bg-[var(--color-tag-refactor-bg)] ring-2 ring-[var(--color-tag-refactor-text)]' },
  'devops': { bg: 'bg-[var(--color-tag-devops-bg)]/50', text: 'text-[var(--color-tag-devops-text)]', selected: 'bg-[var(--color-tag-devops-bg)] ring-2 ring-[var(--color-tag-devops-text)]' }
};
