import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../lib/api';

export function useProjectRoadmap() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);
  const serverContentRef = useRef<string>('');
  const lastSaveTimeRef = useRef<number>(0);
  const isEditingRef = useRef<boolean>(false);

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchRoadmap();
      setContent(data);
      serverContentRef.current = data;
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRoadmap = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      await api.updateRoadmap(newContent);
      serverContentRef.current = newContent;
      setLastSaved(new Date());
      // Set grace period timestamp to prevent SSE from resetting our state
      lastSaveTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to save roadmap:', err);
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
      saveRoadmap(newContent);
      setIsEditing(false);
      isEditingRef.current = false;
    }, 5000);
  }, [saveRoadmap]);

  // Immediately save any pending changes (for Save & Close)
  const flushSave = useCallback(async () => {
    // Clear pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Only save if content differs from server
    if (content !== serverContentRef.current) {
      await saveRoadmap(content);
    }
    setIsEditing(false);
    isEditingRef.current = false;
  }, [content, saveRoadmap]);

  // Handle SSE updates - only apply if not actively editing or within grace period
  useEffect(() => {
    // Reconnect callback - refresh if not editing (uses ref for current value)
    const handleReconnect = () => {
      if (!isEditingRef.current) {
        loadRoadmap();
      }
    };

    const unsubscribe = api.subscribeToChanges(
      (event) => {
        // Handle project switch - reload roadmap
        if (event.event === 'project-switched') {
          loadRoadmap();
          setLastSaved(null);
          return;
        }

        // Handle ROADMAP.md changes from external source
        if ((event.event === 'add' || event.event === 'change') && event.path?.includes('ROADMAP.md')) {
          // Check if we're within the grace period after saving (2 seconds)
          const withinGracePeriod = Date.now() - lastSaveTimeRef.current < 2000;

          // Only reload if not actively editing and not within grace period
          if (!isEditing && !withinGracePeriod) {
            loadRoadmap();
          }
        }
      },
      handleReconnect // Refresh on reconnect/visibility change if not editing
    );
    return unsubscribe;
  }, [loadRoadmap, isEditing]);

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
    loadRoadmap,
    updateContent,
    flushSave,
    setContent
  };
}
