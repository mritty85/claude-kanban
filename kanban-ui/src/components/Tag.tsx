import type { TaskTag } from '../types/task';
import { TAG_LABELS } from '../types/task';
import { tagStyles } from '../utils/tagStyles';

interface TagProps {
  tag: TaskTag;
}

export function Tag({ tag }: TagProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-display ${tagStyles[tag]}`}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}
