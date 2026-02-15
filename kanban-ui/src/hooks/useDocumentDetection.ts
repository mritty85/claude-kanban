import { useState, useEffect, useCallback } from 'react';
import { fetchDocumentStatuses, subscribeToChanges } from '../lib/api';

export function useDocumentDetection(projectId: string | null) {
  const [detectedDocs, setDetectedDocs] = useState<Record<string, boolean>>({});

  const refreshDetection = useCallback(async () => {
    try {
      const statuses = await fetchDocumentStatuses();
      const detected: Record<string, boolean> = {};
      for (const [slug, status] of Object.entries(statuses)) {
        detected[slug] = status.exists;
      }
      setDetectedDocs(detected);
    } catch (err) {
      console.error('Failed to detect documents:', err);
    }
  }, []);

  // Initial load + re-detect on project change
  useEffect(() => {
    if (!projectId) return;
    refreshDetection();
  }, [projectId, refreshDetection]);

  // SSE: re-detect when .md files are added/removed
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToChanges(
      projectId,
      (event) => {
        if (event.projectId && event.projectId !== projectId) return;

        if (event.event === 'project-switched') {
          refreshDetection();
          return;
        }

        if ((event.event === 'add' || event.event === 'unlink') && event.path?.endsWith('.md')) {
          refreshDetection();
        }
      },
      refreshDetection
    );
    return unsubscribe;
  }, [projectId, refreshDetection]);

  return { detectedDocs, refreshDetection };
}
