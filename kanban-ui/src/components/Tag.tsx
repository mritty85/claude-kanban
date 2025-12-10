import type { TaskTag } from '../types/task';
import { TAG_LABELS } from '../types/task';

interface TagProps {
  tag: TaskTag;
}

const tagStyles: Record<TaskTag, string> = {
  'new-functionality': 'bg-[var(--color-tag-new-bg)] text-[var(--color-tag-new-text)]',
  'feature-enhancement': 'bg-[var(--color-tag-feature-bg)] text-[var(--color-tag-feature-text)]',
  'bug': 'bg-[var(--color-tag-bug-bg)] text-[var(--color-tag-bug-text)]',
  'refactor': 'bg-[var(--color-tag-refactor-bg)] text-[var(--color-tag-refactor-text)]',
  'devops': 'bg-[var(--color-tag-devops-bg)] text-[var(--color-tag-devops-text)]'
};

export function Tag({ tag }: TagProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${tagStyles[tag]}`}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}
