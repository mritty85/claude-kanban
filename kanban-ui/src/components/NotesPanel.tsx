import { useEffect, useRef, useReducer, useCallback } from 'react';
import { X } from 'lucide-react';
import { useProjectNotes } from '../hooks/useProjectNotes';

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'Saved just now';
  if (diffSeconds < 60) return `Saved ${diffSeconds}s ago`;
  if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;
  if (diffHours < 24) return `Saved ${diffHours}h ago`;
  return `Saved on ${date.toLocaleDateString()}`;
}

export function NotesPanel({ isOpen, onClose }: NotesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    content,
    loading,
    saving,
    lastSaved,
    loadNotes,
    updateContent,
    flushSave
  } = useProjectNotes();

  const handleSaveAndClose = useCallback(async () => {
    await flushSave();
    onClose();
  }, [flushSave, onClose]);

  // Load notes when panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, loadNotes]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && !loading) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        handleSaveAndClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSaveAndClose]);

  // Update relative time display
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => {
      forceUpdate();
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [lastSaved]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleSaveAndClose}
      />

      {/* Panel - slides from LEFT */}
      <div
        ref={panelRef}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-out'
        }}
        className="fixed top-0 left-0 h-full w-full md:w-[70vw] max-w-[900px] bg-[var(--color-bg-surface)] border-r border-[var(--color-border-subtle)] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
              Project Notes
            </h2>
            <span className="text-[12px] text-[var(--color-text-muted)]">
              {saving ? 'Saving...' : formatRelativeTime(lastSaved)}
            </span>
          </div>
          <button
            onClick={handleSaveAndClose}
            className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Body - Textarea */}
        <div className="flex-1 flex flex-col min-h-0 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[var(--color-text-muted)]">Loading notes...</p>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Write your project notes here..."
              className="flex-1 w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none font-mono"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </>
  );
}
