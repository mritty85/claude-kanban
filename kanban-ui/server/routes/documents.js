import express from 'express';
import { getCurrentProjectPath } from '../services/configService.js';
import { getAllDocumentStatuses, getDocument, updateDocument, getDocDef } from '../services/documentRegistry.js';
import { asyncHandler, HttpError } from '../middleware.js';

const router = express.Router();

// GET /api/documents — detection status for all document types
router.get('/', asyncHandler(async (req, res) => {
  const projectDir = await getCurrentProjectPath();
  const statuses = await getAllDocumentStatuses(projectDir);
  res.json(statuses);
}));

// GET /api/documents/:slug — read document content
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const def = getDocDef(slug);
  if (!def) {
    throw new HttpError(404, 'Unknown document type');
  }

  const content = await getDocument(slug);
  if (content === null) {
    throw new HttpError(404, 'Document not found');
  }

  res.json({ content });
}));

// PUT /api/documents/:slug — update document content
router.put('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const def = getDocDef(slug);
  if (!def) {
    throw new HttpError(404, 'Unknown document type');
  }

  const { content } = req.body;
  const updated = await updateDocument(slug, content);
  res.json({ content: updated });
}));

export default router;
