import { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import type { TaskTag } from '../types/task';
import { TAGS, TAG_LABELS } from '../types/task';

interface FilterDropdownProps {
  selected: TaskTag[];
  onChange: (tags: TaskTag[]) => void;
}

const tagStyles: Record<TaskTag, string> = {
  'new-functionality': 'bg-[#2e1f5e] text-[#a78bfa]',
  'feature-enhancement': 'bg-[#1e3a5f] text-[#7dd3fc]',
  'bug': 'bg-[#4a1d1d] text-[#f87171]',
  'refactor': 'bg-[#1a3d3d] text-[#5eead4]',
  'devops': 'bg-[#4a3d1d] text-[#fbbf24]'
};

export function FilterDropdown({ selected, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleTag(tag: TaskTag) {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-transparent border border-[var(--color-border-subtle)]
          rounded-[6px]
          text-[13px] text-[var(--color-text-secondary)]
          hover:bg-[var(--color-bg-elevated)]
          hover:text-[var(--color-text-primary)]
          transition-colors
          ${selected.length > 0 ? 'border-[var(--color-accent-primary)]' : ''}
        `}
      >
        <Filter size={16} />
        Filter
        {selected.length > 0 && (
          <span className="bg-[var(--color-accent-primary)] text-white text-[11px] px-1.5 py-0.5 rounded">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] shadow-lg z-10 py-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`
                w-full px-3 py-2 text-left text-[12px]
                flex items-center gap-2
                hover:bg-[var(--color-bg-elevated)]
                transition-colors
              `}
            >
              <input
                type="checkbox"
                checked={selected.includes(tag)}
                onChange={() => {}}
                className="rounded"
              />
              <span className={`px-2 py-0.5 rounded ${tagStyles[tag]}`}>
                {TAG_LABELS[tag]}
              </span>
            </button>
          ))}

          {selected.length > 0 && (
            <>
              <div className="border-t border-[var(--color-border-subtle)] my-2" />
              <button
                onClick={() => onChange([])}
                className="w-full px-3 py-2 text-left text-[12px] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
