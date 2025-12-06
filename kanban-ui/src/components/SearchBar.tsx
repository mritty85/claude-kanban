import { Search } from 'lucide-react';

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
        placeholder="Search tasks..."
        className="
          w-[200px] pl-9 pr-3 py-2
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
    </div>
  );
}
