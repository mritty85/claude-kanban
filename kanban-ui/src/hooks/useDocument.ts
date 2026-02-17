import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDocument, updateDocument as apiUpdateDocument, subscribeToChanges } from '../lib/api';
import { getDocDef } from '../lib/documentRegistry';

export function useDocument(slug: string, projectId: string | null, isOpen: boolean) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveTimeoutRef = useRef<number | null>(null);
  const serverContentRef = useRef<string>('');
  const lastSaveTimeRef = useRef<number>(0);
  const isEditingRef = useRef<boolean>(false);
  const contentRef = useRef<string>('');
  const previousSlugRef = useRef<string>(slug);

  const def = getDocDef(slug);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocument(slug);
      setContent(data);
      contentRef.current = data;
      serverContentRef.current = data;
    } catch (err) {
      console.error(`Failed to load ${slug}:`, err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const saveDocument = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      await apiUpdateDocument(slug, newContent);
      serverContentRef.current = newContent;
      setLastSaved(new Date());
      lastSaveTimeRef.current = Date.now();
    } catch (err) {
      console.error(`Failed to save ${slug}:`, err);
    } finally {
      setSaving(false);
    }
  }, [slug]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    setIsEditing(true);
    isEditingRef.current = true;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveDocument(newContent);
      setIsEditing(false);
      isEditingRef.current = false;
    }, 5000);
  }, [saveDocument]);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (content !== serverContentRef.current) {
      await saveDocument(content);
    }
    setIsEditing(false);
    isEditingRef.current = false;
  }, [content, saveDocument]);

  // Flush-save old document when slug changes (user switches docs)
  useEffect(() => {
    const prevSlug = previousSlugRef.current;
    if (prevSlug !== slug) {
      // Cancel any pending debounce for the old doc
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Fire-and-forget save dirty content to old slug
      if (contentRef.current && contentRef.current !== serverContentRef.current) {
        apiUpdateDocument(prevSlug, contentRef.current).catch(err =>
          console.error(`Failed to flush-save ${prevSlug}:`, err)
        );
      }
      // Reset state for new doc
      setContent('');
      contentRef.current = '';
      serverContentRef.current = '';
      setLastSaved(null);
      setIsEditing(false);
      isEditingRef.current = false;
      previousSlugRef.current = slug;
    }
  }, [slug]);

  // SSE subscription — only when panel is open
  useEffect(() => {
    if (!projectId || !isOpen || !def) return;

    const handleReconnect = () => {
      if (!isEditingRef.current) {
        loadDocument();
      }
    };

    const unsubscribe = subscribeToChanges(
      projectId,
      (event) => {
        if (event.projectId && event.projectId !== projectId) return;

        if (event.event === 'project-switched') {
          loadDocument();
          setLastSaved(null);
          return;
        }

        if ((event.event === 'add' || event.event === 'change') && event.path) {
          const basename = event.path.split('/').pop()?.toLowerCase() || '';
          const matches = def.sseMatchPatterns.some(p => basename === p.toLowerCase());

          if (matches) {
            const withinGracePeriod = Date.now() - lastSaveTimeRef.current < 2000;
            if (!isEditing && !withinGracePeriod) {
              loadDocument();
            }
          }
        }
      },
      handleReconnect
    );
    return unsubscribe;
  }, [projectId, isOpen, loadDocument, isEditing, def]);

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
    loadDocument,
    updateContent,
    flushSave
  };
}
