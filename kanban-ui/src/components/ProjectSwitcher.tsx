import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FolderOpen, Sun, Moon } from 'lucide-react';
import type { Project } from '../types/task';
import { useTheme } from '../hooks/useTheme';

interface ProjectSwitcherProps {
  currentProject: Project | null;
  projects: Project[];
  onSwitch: (id: string) => Promise<void>;
  onManage: () => void;
}

export function ProjectSwitcher({ currentProject, projects, onSwitch, onManage }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSwitch(id: string) {
    if (id === currentProject?.id) {
      setIsOpen(false);
      return;
    }
    setSwitching(id);
    try {
      await onSwitch(id);
      setIsOpen(false);
    } finally {
      setSwitching(null);
    }
  }

  const displayName = currentProject?.boardName || currentProject?.name || 'Select Project';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-transparent
          rounded-[6px]
          text-[15px] font-medium text-[var(--color-text-primary)]
          hover:bg-[var(--color-bg-elevated)]
          transition-colors
        `}
      >
        <FolderOpen size={18} className="text-[var(--color-text-secondary)]" />
        {displayName}
        <ChevronDown
          size={16}
          className={`text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[8px] shadow-lg z-50 py-2">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
            Projects
          </div>

          {projects.length === 0 ? (
            <div className="px-3 py-4 text-[13px] text-[var(--color-text-muted)] text-center">
              No projects yet
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSwitch(project.id)}
                  disabled={switching !== null}
                  className={`
                    w-full px-3 py-2.5 text-left
                    flex items-center gap-3
                    hover:bg-[var(--color-bg-elevated)]
                    transition-colors
                    ${switching === project.id ? 'opacity-50' : ''}
                  `}
                >
                  <div className="w-5 flex-shrink-0">
                    {project.id === currentProject?.id && (
                      <Check size={16} className="text-[var(--color-accent-primary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--color-text-primary)] truncate">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                      {project.path}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--color-border-subtle)] mt-2 pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onManage();
              }}
              className="w-full px-3 py-2 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Manage Projects...
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                {isDark ? <Moon size={14} /> : <Sun size={14} />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${isDark
                    ? 'bg-[var(--color-accent-primary)]'
                    : 'bg-[var(--color-border-emphasis)]'
                  }
                `}
                aria-label="Toggle theme"
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm
                    transition-transform duration-200
                    ${isDark ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
