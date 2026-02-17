import fs from 'fs/promises';
import path from 'path';
import { getCurrentProjectPath } from './configService.js';

const DOCUMENT_DEFINITIONS = [
  {
    slug: 'notes',
    label: 'Notes',
    location: 'documentation',
    filenames: ['notes.md'],
    legacyPaths: ['tasks/NOTES.md'],
    alwaysShow: true
  },
  {
    slug: 'roadmap',
    label: 'Roadmap',
    location: 'documentation',
    filenames: ['roadmap.md'],
    legacyPaths: ['tasks/ROADMAP.md'],
    alwaysShow: true
  },
  {
    slug: 'prd',
    label: 'PRD',
    location: 'documentation',
    filenames: ['prd.md'],
    legacyPaths: [],
    alwaysShow: true
  },
  {
    slug: 'claude',
    label: 'CLAUDE.md',
    location: 'root',
    filenames: ['CLAUDE.md', 'claude.md'],
    legacyPaths: [],
    alwaysShow: false
  },
  {
    slug: 'deployment',
    label: 'Deployment',
    location: 'documentation',
    filenames: ['deployment.md', 'DEPLOYMENT.md'],
    legacyPaths: [],
    alwaysShow: false
  },
  {
    slug: 'structure',
    label: 'Structure',
    location: 'documentation',
    filenames: ['structure.md', 'STRUCTURE.md'],
    legacyPaths: [],
    alwaysShow: false
  },
  {
    slug: 'schema',
    label: 'Schema',
    location: 'documentation',
    filenames: ['schema.md', 'SCHEMA.md'],
    legacyPaths: [],
    alwaysShow: false
  }
];

export function getDocDef(slug) {
  return DOCUMENT_DEFINITIONS.find(d => d.slug === slug) || null;
}

// Resolve a document's file path for a given project directory
// Returns { found: boolean, filePath: string | null, writePath: string }
async function resolveDocumentPath(slug, projectDir) {
  const def = getDocDef(slug);
  if (!def) return { found: false, filePath: null, writePath: null };

  const baseDir = def.location === 'root'
    ? projectDir
    : path.join(projectDir, 'documentation');

  // Try each canonical filename
  for (const filename of def.filenames) {
    const filePath = path.join(baseDir, filename);
    try {
      await fs.access(filePath);
      return { found: true, filePath, writePath: filePath };
    } catch {
      // Continue checking
    }
  }

  // Try legacy paths
  for (const legacyPath of def.legacyPaths) {
    const filePath = path.join(projectDir, legacyPath);
    try {
      await fs.access(filePath);
      return { found: true, filePath, writePath: path.join(baseDir, def.filenames[0]) };
    } catch {
      // Continue checking
    }
  }

  // Not found — writePath is the canonical first filename
  return { found: false, filePath: null, writePath: path.join(baseDir, def.filenames[0]) };
}

// Get detection status for all documents
export async function getAllDocumentStatuses(projectDir) {
  const statuses = {};
  for (const def of DOCUMENT_DEFINITIONS) {
    const { found } = await resolveDocumentPath(def.slug, projectDir);
    statuses[def.slug] = { exists: found, alwaysShow: def.alwaysShow };
  }
  return statuses;
}

// Read document content
export async function getDocument(slug) {
  const def = getDocDef(slug);
  if (!def) return null;

  const projectDir = await getCurrentProjectPath();
  const { found, filePath } = await resolveDocumentPath(slug, projectDir);

  if (found) {
    return await fs.readFile(filePath, 'utf-8');
  }

  // alwaysShow docs return empty string; detected-only docs return null (404)
  return def.alwaysShow ? '' : null;
}

// Write document content
export async function updateDocument(slug, content) {
  const def = getDocDef(slug);
  if (!def) throw new Error(`Unknown document type: ${slug}`);

  const projectDir = await getCurrentProjectPath();
  const { writePath } = await resolveDocumentPath(slug, projectDir);

  // Ensure directory exists
  await fs.mkdir(path.dirname(writePath), { recursive: true });
  await fs.writeFile(writePath, content, 'utf-8');
  return content;
}
