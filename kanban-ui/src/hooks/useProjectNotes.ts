import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../lib/api';

export function useProjectNotes() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);
  const serverContentRef = useRef<string>('');

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
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsEditing(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new debounced save (1.5s)
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNotes(newContent);
      setIsEditing(false);
    }, 1500);
  }, [saveNotes]);

  // Handle SSE updates - only apply if not actively editing
  useEffect(() => {
    const unsubscribe = api.subscribeToChanges((event) => {
      // Handle project switch - reload notes
      if (event.event === 'project-switched') {
        loadNotes();
        setLastSaved(null);
        return;
      }

      // Handle NOTES.md changes from external source
      if ((event.event === 'add' || event.event === 'change') && event.path?.includes('NOTES.md')) {
        // Only reload if not actively editing
        if (!isEditing) {
          loadNotes();
        }
      }
    });
    return unsubscribe;
  }, [loadNotes, isEditing]);

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
    setContent
  };
}
