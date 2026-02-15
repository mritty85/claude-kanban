import type { Project } from '../types/task';
import { ProjectSwitcher } from './ProjectSwitcher';
import { LayoutGrid, List, Terminal, Map, FileText, ClipboardList, Sun, Moon, AlignLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SidebarProps {
  currentProject: Project | null;
  projects: Project[];
  onProjectSwitch: (id: string) => Promise<void>;
  onManageProjects: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  onOpenLaunchModal: () => void;
  launchConfigCount: number;
  onOpenRoadmap: () => void;
  onOpenNotes: () => void;
  onOpenPrd: () => void;
  isRoadmapActive: boolean;
  isNotesActive: boolean;
  isPrdActive: boolean;
}

function SidebarItem({
  icon,
  label,
  badge,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center gap-[9px] w-full text-left px-2 py-[7px] rounded-[6px]
        font-display text-[12.5px] font-medium
        transition-all duration-[120ms] ease-out
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
        ${active
          ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sidebar-hover)] hover:text-[var(--color-text-primary)]'
        }
      `}
    >
      {active && (
        <span className="absolute left-0 top-[6px] bottom-[6px] w-[2px] rounded-[1px] bg-[var(--color-accent-primary)]" />
      )}
      <span className={`flex-shrink-0 [&>svg]:w-[15px] [&>svg]:h-[15px] ${active ? 'opacity-90' : 'opacity-60'}`}>
        {icon}
      </span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto font-body text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-base)] px-[6px] py-[1px] rounded-[8px]">
          {badge}
        </span>
      )}
    </button>
  );
}

function SidebarToggleItem({
  icon,
  label,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-[9px] w-full px-2 py-[7px]">
      <span className="flex-shrink-0 opacity-60 [&>svg]:w-[15px] [&>svg]:h-[15px]">
        {icon}
      </span>
      <span className="font-display text-[12.5px] font-medium text-[var(--color-text-secondary)]">
        {label}
      </span>
      <button
        onClick={onToggle}
        className={`
          relative ml-auto w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
          ${checked
            ? 'bg-[var(--color-accent-primary)]'
            : 'bg-[var(--color-border-emphasis)]'
          }
        `}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? 'left-6' : 'left-1'}
          `}
        />
      </button>
    </div>
  );
}

function SettingsSection({ showPreview, onTogglePreview }: { showPreview: boolean; onTogglePreview: () => void }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="px-[14px] pt-[10px] pb-[6px]">
      <div className="px-2 mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        Settings
      </div>
      <div className="flex flex-col gap-[1px]">
        <SidebarToggleItem
          icon={isDark ? <Moon /> : <Sun />}
          label={isDark ? 'Dark Mode' : 'Light Mode'}
          checked={isDark}
          onToggle={toggleTheme}
        />
        <SidebarToggleItem
          icon={<AlignLeft />}
          label="Card Preview"
          checked={showPreview}
          onToggle={onTogglePreview}
        />
      </div>
    </div>
  );
}

export function Sidebar({
  currentProject,
  projects,
  onProjectSwitch,
  onManageProjects,
  showPreview,
  onTogglePreview,
  viewMode,
  onViewModeChange,
  onOpenLaunchModal,
  launchConfigCount,
  onOpenRoadmap,
  onOpenNotes,
  onOpenPrd,
  isRoadmapActive,
  isNotesActive,
  isPrdActive,
}: SidebarProps) {
  return (
    <aside className="w-[210px] flex-shrink-0 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-subtle)] flex flex-col z-20">
      {/* Project Switcher */}
      <div className="px-[14px] pt-[14px] pb-[10px] border-b border-[var(--color-border-subtle)]">
        <ProjectSwitcher
          currentProject={currentProject}
          projects={projects}
          onSwitch={onProjectSwitch}
          onManage={onManageProjects}
        />
      </div>

      {/* View Toggle */}
      <div className="px-[14px] py-[10px]">
        <div className="flex gap-[2px] mx-2 p-[3px] bg-[var(--color-bg-base)] rounded-[6px]">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`
              flex-1 flex items-center justify-center gap-[5px]
              font-display text-[11px] font-medium py-[5px]
              border-none rounded-[4px] cursor-pointer transition-all duration-150
              ${viewMode === 'kanban'
                ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            <LayoutGrid size={13} />
            Board
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`
              flex-1 flex items-center justify-center gap-[5px]
              font-display text-[11px] font-medium py-[5px]
              border-none rounded-[4px] cursor-pointer transition-all duration-150
              ${viewMode === 'list'
                ? 'bg-[var(--color-bg-sidebar-active)] text-[var(--color-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            <List size={13} />
            List
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-subtle)] mx-[14px] my-[6px]" />

      {/* Tools Section */}
      <div className="px-[14px] pt-[10px] pb-[6px]">
        <div className="px-2 mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Tools
        </div>
        <nav className="flex flex-col gap-[1px]">
          <SidebarItem
            icon={<Terminal />}
            label="Launch Terminal"
            badge={launchConfigCount}
            onClick={onOpenLaunchModal}
          />
        </nav>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-subtle)] mx-[14px] my-[6px]" />

      {/* Documents Section */}
      <div className="px-[14px] pt-[10px] pb-[6px]">
        <div className="px-2 mb-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Documents
        </div>
        <nav className="flex flex-col gap-[1px]">
          <SidebarItem
            icon={<FileText />}
            label="Notes"
            active={isNotesActive}
            onClick={onOpenNotes}
          />
          <SidebarItem
            icon={<ClipboardList />}
            label="PRD"
            active={isPrdActive}
            onClick={onOpenPrd}
          />
          <SidebarItem
            icon={<Map />}
            label="Roadmap"
            active={isRoadmapActive}
            onClick={onOpenRoadmap}
          />
        </nav>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-subtle)] mx-[14px] my-[6px]" />

      {/* Settings Section */}
      <SettingsSection showPreview={showPreview} onTogglePreview={onTogglePreview} />

      {/* Spacer */}
      <div className="flex-1" />

    </aside>
  );
}
