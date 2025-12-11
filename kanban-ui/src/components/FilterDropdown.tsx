import { useState, useRef, useEffect } from 'react';
import { Filter, Calendar, ArrowUpDown } from 'lucide-react';
import type { TaskTag, DateFilter, DoneSortOption } from '../types/task';
import { TAGS, TAG_LABELS } from '../types/task';

interface FilterDropdownProps {
  selectedTags: TaskTag[];
  onTagsChange: (tags: TaskTag[]) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  doneSort: DoneSortOption;
  onDoneSortChange: (sort: DoneSortOption) => void;
}

const tagStyles: Record<TaskTag, string> = {
  'new-functionality': 'bg-[var(--color-tag-new-bg)] text-[var(--color-tag-new-text)]',
  'feature-enhancement': 'bg-[var(--color-tag-feature-bg)] text-[var(--color-tag-feature-text)]',
  'bug': 'bg-[var(--color-tag-bug-bg)] text-[var(--color-tag-bug-text)]',
  'refactor': 'bg-[var(--color-tag-refactor-bg)] text-[var(--color-tag-refactor-text)]',
  'devops': 'bg-[var(--color-tag-devops-bg)] text-[var(--color-tag-devops-text)]'
};

const DATE_PRESETS = [
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom range' }
] as const;

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'completedNewest', label: 'Newest first' },
  { value: 'completedOldest', label: 'Oldest first' }
] as const;

export function FilterDropdown({
  selectedTags,
  onTagsChange,
  dateFilter,
  onDateFilterChange,
  doneSort,
  onDoneSortChange
}: FilterDropdownProps) {
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
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  function handlePresetChange(preset: typeof DATE_PRESETS[number]['value'] | null) {
    if (preset === 'custom') {
      onDateFilterChange({ preset: 'custom', startDate: '', endDate: '' });
    } else {
      onDateFilterChange({ preset });
    }
  }

  const hasActiveFilters = selectedTags.length > 0 || dateFilter.preset !== null;
  const filterCount = selectedTags.length + (dateFilter.preset ? 1 : 0);

  function clearAllFilters() {
    onTagsChange([]);
    onDateFilterChange({ preset: null });
    onDoneSortChange('priority');
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
          ${hasActiveFilters ? 'border-[var(--color-accent-primary)]' : ''}
        `}
      >
        <Filter size={16} />
        Filter
        {filterCount > 0 && (
          <span className="bg-[var(--color-accent-primary)] text-white text-[11px] px-1.5 py-0.5 rounded">
            {filterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] shadow-lg z-10 py-2">
          {/* Tags Section */}
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Tags
            </span>
          </div>
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
                checked={selectedTags.includes(tag)}
                onChange={() => {}}
                className="rounded"
              />
              <span className={`px-2 py-0.5 rounded ${tagStyles[tag]}`}>
                {TAG_LABELS[tag]}
              </span>
            </button>
          ))}

          <div className="border-t border-[var(--color-border-subtle)] my-2" />

          {/* Done Column Sort */}
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1">
              <ArrowUpDown size={12} />
              Done Sort
            </span>
          </div>
          <div className="px-3 py-1">
            <select
              value={doneSort}
              onChange={(e) => onDoneSortChange(e.target.value as DoneSortOption)}
              className="w-full px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-emphasis)]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] my-2" />

          {/* Date Filter Section */}
          <div className="px-3 py-1">
            <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1">
              <Calendar size={12} />
              Done Date Filter
            </span>
          </div>
          {DATE_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(dateFilter.preset === preset.value ? null : preset.value)}
              className={`
                w-full px-3 py-2 text-left text-[12px]
                flex items-center gap-2
                hover:bg-[var(--color-bg-elevated)]
                transition-colors
              `}
            >
              <input
                type="radio"
                checked={dateFilter.preset === preset.value}
                onChange={() => {}}
                className="rounded-full"
              />
              <span className="text-[var(--color-text-primary)]">{preset.label}</span>
            </button>
          ))}

          {/* Custom Date Range */}
          {dateFilter.preset === 'custom' && (
            <div className="px-3 py-2 space-y-2">
              <div>
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">From</label>
                <input
                  type="date"
                  value={dateFilter.startDate || ''}
                  onChange={(e) => onDateFilterChange({ ...dateFilter, startDate: e.target.value })}
                  className="w-full px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-emphasis)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">To</label>
                <input
                  type="date"
                  value={dateFilter.endDate || ''}
                  onChange={(e) => onDateFilterChange({ ...dateFilter, endDate: e.target.value })}
                  className="w-full px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-emphasis)]"
                />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <>
              <div className="border-t border-[var(--color-border-subtle)] my-2" />
              <button
                onClick={clearAllFilters}
                className="w-full px-3 py-2 text-left text-[12px] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
