import type { TaskTag } from '../types/task';
import { TAG_LABELS } from '../types/task';

interface TagProps {
  tag: TaskTag;
}

const tagStyles: Record<TaskTag, string> = {
  'new-functionality': 'bg-[#2e1f5e] text-[#a78bfa]',
  'feature-enhancement': 'bg-[#1e3a5f] text-[#7dd3fc]',
  'bug': 'bg-[#4a1d1d] text-[#f87171]',
  'refactor': 'bg-[#1a3d3d] text-[#5eead4]',
  'devops': 'bg-[#4a3d1d] text-[#fbbf24]'
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
