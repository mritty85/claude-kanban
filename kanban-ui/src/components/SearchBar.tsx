import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('');
          }
        }}
        placeholder="Search tasks..."
        className="
          w-[200px] pl-9 pr-8 py-2
          bg-[var(--color-bg-elevated)]
          border border-transparent
          rounded-[6px]
          text-[13px] text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          focus:border-[var(--color-border-emphasis)]
          focus:outline-none
          transition-colors
        "
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            p-0.5 rounded
            text-[var(--color-text-muted)]
            hover:text-[var(--color-text-primary)]
            hover:bg-[var(--color-bg-hover)]
            transition-colors
          "
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
