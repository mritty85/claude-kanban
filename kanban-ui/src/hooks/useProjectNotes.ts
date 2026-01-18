import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../lib/api';

export function useProjectNotes(projectId: string | null, isOpen: boolean) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);
  const serverContentRef = useRef<string>('');
  const lastSaveTimeRef = useRef<number>(0);
  const isEditingRef = useRef<boolean>(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchNotes();
      setContent(data);
      serverContentRef.current = data;
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveNotes = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      await api.updateNotes(newContent);
      serverContentRef.current = newContent;
      setLastSaved(new Date());
      // Set grace period timestamp to prevent SSE from resetting our state
      lastSaveTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsEditing(true);
    isEditingRef.current = true;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new debounced save (5s)
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNotes(newContent);
      setIsEditing(false);
      isEditingRef.current = false;
    }, 5000);
  }, [saveNotes]);

  // Immediately save any pending changes (for Save & Close)
  const flushSave = useCallback(async () => {
    // Clear pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Only save if content differs from server
    if (content !== serverContentRef.current) {
      await saveNotes(content);
    }
    setIsEditing(false);
    isEditingRef.current = false;
  }, [content, saveNotes]);

  // Handle SSE updates - only apply if not actively editing or within grace period
  // Only subscribe when panel is open to avoid connection limit issues
  useEffect(() => {
    if (!projectId || !isOpen) return;

    // Reconnect callback - refresh if not editing (uses ref for current value)
    const handleReconnect = () => {
      if (!isEditingRef.current) {
        loadNotes();
      }
    };

    const unsubscribe = api.subscribeToChanges(
      projectId,
      (event) => {
        // Ignore events for other projects
        if (event.projectId && event.projectId !== projectId) return;

        // Handle project switch - reload notes
        if (event.event === 'project-switched') {
          loadNotes();
          setLastSaved(null);
          return;
        }

        // Handle NOTES.md changes from external source
        if ((event.event === 'add' || event.event === 'change') && event.path?.includes('NOTES.md')) {
          // Check if we're within the grace period after saving (2 seconds)
          const withinGracePeriod = Date.now() - lastSaveTimeRef.current < 2000;

          // Only reload if not actively editing and not within grace period
          if (!isEditing && !withinGracePeriod) {
            loadNotes();
          }
        }
      },
      handleReconnect // Refresh on reconnect/visibility change if not editing
    );
    return unsubscribe;
  }, [projectId, isOpen, loadNotes, isEditing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content,
    loading,
    saving,
    lastSaved,
    loadNotes,
    updateContent,
    flushSave,
    setContent
  };
}
