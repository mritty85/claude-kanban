import express from 'express';
import { getCurrentProjectPath } from '../services/configService.js';
import { getAllDocumentStatuses, getDocument, updateDocument, getDocDef } from '../services/documentRegistry.js';

const router = express.Router();

// GET /api/documents — detection status for all document types
router.get('/', async (req, res) => {
  try {
    const projectDir = await getCurrentProjectPath();
    const statuses = await getAllDocumentStatuses(projectDir);
    res.json(statuses);
  } catch (err) {
    console.error('Error getting document statuses:', err);
    res.status(500).json({ error: 'Failed to get document statuses' });
  }
});

// GET /api/documents/:slug — read document content
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const def = getDocDef(slug);
    if (!def) {
      return res.status(404).json({ error: 'Unknown document type' });
    }

    const content = await getDocument(slug);
    if (content === null) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ content });
  } catch (err) {
    console.error('Error getting document:', err);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// PUT /api/documents/:slug — update document content
router.put('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const def = getDocDef(slug);
    if (!def) {
      return res.status(404).json({ error: 'Unknown document type' });
    }

    const { content } = req.body;
    const updated = await updateDocument(slug, content);
    res.json({ content: updated });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

export default router;
