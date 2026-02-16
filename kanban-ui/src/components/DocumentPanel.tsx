import { useEffect, useRef, useReducer, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import { useDocument } from '../hooks/useDocument';
import { getDocDef } from '../lib/documentRegistry';
import { formatRelativeTime } from '../utils/formatRelativeTime';

interface DocumentPanelProps {
  slug: string | null;
  onClose: () => void;
  projectId: string | null;
}

export interface DocumentPanelHandle {
  flushSave: () => Promise<void>;
}

export const DocumentPanel = forwardRef<DocumentPanelHandle, DocumentPanelProps>(
  function DocumentPanel({ slug, onClose, projectId }, ref) {
    const isOpen = slug !== null;
    const activeSlug = slug || 'notes'; // fallback for hook (won't render)
    const def = getDocDef(activeSlug);

    const panelRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const {
      content,
      loading,
      saving,
      lastSaved,
      loadDocument,
      updateContent,
      flushSave
    } = useDocument(activeSlug, projectId, isOpen);

    useImperativeHandle(ref, () => ({ flushSave }), [flushSave]);

    const handleSaveAndClose = useCallback(async () => {
      await flushSave();
      onClose();
    }, [flushSave, onClose]);

    // Load document when panel opens
    useEffect(() => {
      if (isOpen) {
        loadDocument();
      }
    }, [isOpen, loadDocument]);

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
      }, 10000);
      return () => clearInterval(interval);
    }, [lastSaved]);

    return (
      <div
        style={{ width: isOpen ? 550 : 0, transition: 'width 250ms ease-out' }}
        className="flex-shrink-0 overflow-hidden h-full"
      >
        <div ref={panelRef} className="w-[550px] h-full bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-subtle)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-[10px]">
            <div className="flex items-center gap-3">
              <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] font-display">
                {def?.panelTitle || 'Document'}
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
                <p className="text-[var(--color-text-muted)]">{def?.loadingText || 'Loading...'}</p>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={def?.placeholder || 'Write here...'}
                className="flex-1 w-full px-4 py-3 bg-[var(--color-bg-surface)] border border-transparent rounded-[6px] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-emphasis)] focus:outline-none resize-none font-body"
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-[10px] border-t border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    );
  }
);
