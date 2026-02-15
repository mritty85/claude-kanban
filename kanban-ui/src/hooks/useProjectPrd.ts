import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../lib/api';

export function useProjectPrd(projectId: string | null, isOpen: boolean) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);
  const serverContentRef = useRef<string>('');
  const lastSaveTimeRef = useRef<number>(0);
  const isEditingRef = useRef<boolean>(false);

  const loadPrd = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchPrd();
      setContent(data);
      serverContentRef.current = data;
    } catch (err) {
      console.error('Failed to load PRD:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const savePrd = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      await api.updatePrd(newContent);
      serverContentRef.current = newContent;
      setLastSaved(new Date());
      lastSaveTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to save PRD:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsEditing(true);
    isEditingRef.current = true;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      savePrd(newContent);
      setIsEditing(false);
      isEditingRef.current = false;
    }, 5000);
  }, [savePrd]);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (content !== serverContentRef.current) {
      await savePrd(content);
    }
    setIsEditing(false);
    isEditingRef.current = false;
  }, [content, savePrd]);

  useEffect(() => {
    if (!projectId || !isOpen) return;

    const handleReconnect = () => {
      if (!isEditingRef.current) {
        loadPrd();
      }
    };

    const unsubscribe = api.subscribeToChanges(
      projectId,
      (event) => {
        if (event.projectId && event.projectId !== projectId) return;

        if (event.event === 'project-switched') {
          loadPrd();
          setLastSaved(null);
          return;
        }

        // Handle prd.md changes from external source
        if ((event.event === 'add' || event.event === 'change') && event.path?.toLowerCase().includes('prd.md')) {
          const withinGracePeriod = Date.now() - lastSaveTimeRef.current < 2000;

          if (!isEditing && !withinGracePeriod) {
            loadPrd();
          }
        }
      },
      handleReconnect
    );
    return unsubscribe;
  }, [projectId, isOpen, loadPrd, isEditing]);

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
    loadPrd,
    updateContent,
    flushSave,
    setContent
  };
}
