import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { getEpicColor } from '../utils/epicColors';

interface EpicComboboxProps {
  value: string;
  onChange: (value: string) => void;
  availableEpics: string[];
  placeholder?: string;
}

export function EpicCombobox({ value, onChange, availableEpics, placeholder = 'Select or type epic...' }: EpicComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If input doesn't match any epic and user clicked away, commit the value
        if (inputValue !== value) {
          onChange(inputValue);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, onChange]);

  // Filter epics based on input
  const filteredEpics = availableEpics.filter(epic =>
    epic.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Show all epics when dropdown is open and input is empty or matches current value
  const epicsToShow = inputValue === '' || inputValue === value ? availableEpics : filteredEpics;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setIsOpen(true);
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(inputValue);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value);
    }
  }

  function selectEpic(epic: string) {
    onChange(epic);
    setInputValue(epic);
    setIsOpen(false);
  }

  function clearEpic() {
    onChange('');
    setInputValue('');
    inputRef.current?.focus();
  }

  function toggleDropdown() {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  }

  const hasValue = value !== '';
  const colors = hasValue ? getEpicColor(value) : null;

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-16 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none"
        />
        <div className="absolute right-1 flex items-center gap-0.5">
          {hasValue && (
            <button
              type="button"
              onClick={clearEpic}
              className="p-1.5 rounded hover:bg-[var(--color-bg-surface)] transition-colors"
              title="Clear epic"
            >
              <X size={14} className="text-[var(--color-text-muted)]" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleDropdown}
            className="p-1.5 rounded hover:bg-[var(--color-bg-surface)] transition-colors"
          >
            <ChevronDown
              size={16}
              className={`text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Current epic badge preview */}
      {hasValue && colors && (
        <div className="mt-2">
          <span
            className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {value}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[6px] shadow-lg z-20 max-h-48 overflow-y-auto">
          {epicsToShow.length > 0 ? (
            epicsToShow.map(epic => {
              const epicColors = getEpicColor(epic);
              const isSelected = epic === value;
              return (
                <button
                  key={epic}
                  type="button"
                  onClick={() => selectEpic(epic)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-bg-elevated)] transition-colors ${isSelected ? 'bg-[var(--color-bg-elevated)]' : ''}`}
                >
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{ backgroundColor: epicColors.bg, color: epicColors.text }}
                  >
                    {epic}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-[12px] text-[var(--color-text-muted)]">
              {inputValue ? (
                <span>Press Enter to create "<strong className="text-[var(--color-text-primary)]">{inputValue}</strong>"</span>
              ) : (
                <span>No epics yet. Type to create one.</span>
              )}
            </div>
          )}

          {/* Show "Create new" option if typing something new */}
          {inputValue && !availableEpics.includes(inputValue) && filteredEpics.length > 0 && (
            <>
              <div className="border-t border-[var(--color-border-subtle)] my-1" />
              <button
                type="button"
                onClick={() => selectEpic(inputValue)}
                className="w-full px-3 py-2 text-left text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                Create "<strong className="text-[var(--color-text-primary)]">{inputValue}</strong>"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
