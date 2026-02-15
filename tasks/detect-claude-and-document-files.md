# Detect Claude and Document Files

## Id
task_1771172374133

## Status
uat

## Tags
- new-functionality

## Description
Replace the hardcoded 3-document system (Notes, Roadmap, PRD — each with its own panel, hook, API, backend route, and service function) with a generic document registry. This eliminates copy-paste duplication and makes adding new document types a one-liner. Also adds auto-detection for project files (CLAUDE.md, deployment.md, structure.md, schema.md) that appear/disappear in the sidebar based on whether the file exists.

## Acceptance Criteria
- [x] Generic document registry on backend (`server/services/documentRegistry.js`) with slug, location, filenames, legacy paths, alwaysShow flag
- [x] Generic document API (`GET /api/documents`, `GET /api/documents/:slug`, `PUT /api/documents/:slug`)
- [x] Frontend document registry (`src/lib/documentRegistry.ts`) with icons, labels, SSE match patterns
- [x] Single reusable `DocumentPanel` component replaces NotesPanel, RoadmapPanel, PrdPanel
- [x] Single reusable `useDocument` hook replaces useProjectNotes, useProjectRoadmap, useProjectPrd
- [x] `useDocumentDetection` hook polls document existence and re-checks on SSE add/unlink events
- [x] Sidebar renders document buttons from registry — always-show docs always visible, detected docs appear/disappear dynamically
- [x] Watcher updated to watch root-level CLAUDE.md for detection
- [x] Existing Notes/PRD/Roadmap functionality preserved identically
- [x] Old duplicate files deleted (3 panels, 3 hooks, 6 old API functions, 6 old routes, 6 old service functions)
- [x] schema.md added as detected document type

## Notes
### Architecture
- **Always shown** (alwaysShow: true): Notes, Roadmap, PRD — in `documentation/` folder, return empty string if file doesn't exist
- **Detected only** (alwaysShow: false): CLAUDE.md (project root), Deployment, Structure, Schema — in `documentation/` folder (except CLAUDE.md), return 404 if file doesn't exist, sidebar button hidden until file is detected

### Files created
- `server/services/documentRegistry.js` — backend registry + resolve/read/write
- `server/routes/documents.js` — REST API for documents
- `src/lib/documentRegistry.ts` — frontend registry with icons and SSE patterns
- `src/utils/formatRelativeTime.ts` — extracted shared utility
- `src/hooks/useDocument.ts` — generic hook (debounced save, SSE, grace period)
- `src/hooks/useDocumentDetection.ts` — polls detection status via SSE
- `src/components/DocumentPanel.tsx` — single generic panel

### Files deleted
- `src/components/NotesPanel.tsx`, `RoadmapPanel.tsx`, `PrdPanel.tsx`
- `src/hooks/useProjectNotes.ts`, `useProjectRoadmap.ts`, `useProjectPrd.ts`

### Adding a new document type
Add one entry to each registry (backend + frontend) — everything else (API, panel, hook, sidebar, SSE detection) works automatically.
