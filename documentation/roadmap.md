# Phase 2 Optimization Roadmap

**Date:** 2026-02-17
**Scope:** Dead code removal, bundle optimization, backend cleanup

---

## Phase 1: Quick Wins (mechanical, safe)

- [x] Remove 24 unused exports across frontend and backend
- [x] Remove `broadcastToProject()` from watcher.js (completely dead)
- [x] Remove `getAllDocDefs()` from documentRegistry.js (completely dead)
- [x] Remove `resolveDocumentPath()` export from documentRegistry.js (internal-only)
- [x] Remove stale `gray-matter` reference from CLAUDE.md
- [x] Update CLAUDE.md "Adding a new status column" to reference shared constants.js

## Phase 2: Backend Middleware & Error Handling

- [x] Extract `asyncHandler` wrapper to eliminate 19 identical try/catch blocks
- [x] Add centralized Express error-handling middleware in index.js
- [x] Standardize error status codes (400 vs 500) based on error type

## Phase 3: Config & File I/O Caching

- [ ] Cache current project path in module-level variable (invalidate on switch)
- [ ] Eliminate redundant `getTasksDir()`/`getProjectDir()`/`getDocumentationDir()` re-reads
- [ ] Refactor `getProjectConfig()` to accept optional project path (for non-current projects)
- [ ] Remove inline dynamic `import()` in projects.js PUT route
- [ ] Extract `createEmptyBoardData()` helper (used in 3 places)
- [ ] Cache migration state to skip `isOldStructure()` checks on every `getAllTasks()`

## Phase 4: Bundle & Frontend Optimization

- [ ] Add `React.lazy()` code splitting for KanbanBoard and WorkspaceHome in App.tsx
- [ ] Add `manualChunks` in vite config to split vendor libraries for caching
- [ ] Convert `import * as api` to named imports in useTasks.ts and useProjects.ts
- [ ] Consider self-hosting Google Fonts to eliminate render-blocking external request

## Phase 5: Performance Polish

- [ ] Parallelize sequential task file reads in `getAllTasks()` with `Promise.all()`
- [ ] Parallelize `getAllDocumentStatuses()` path resolution
- [ ] Move `express`, `cors`, `chokidar` from devDependencies to dependencies

---

## Reference: Unused Exports Removed (Phase 1)

### Frontend
| File | Removed |
|------|---------|
| `src/lib/api.ts` | `ProjectConfig`, `SSEEvent`, `getCurrentClientId()`, `fetchConfig()`, `updateConfig()` |
| `src/lib/documentRegistry.ts` | `DocumentDefinition` |
| `src/types/task.ts` | `DateFilterPreset` |
| `src/utils/epicColors.ts` | `EPIC_COLORS` |

### Backend
| File | Changed |
|------|---------|
| `server/services/fileService.js` | Removed `export` from 10 internal-only functions |
| `server/services/configService.js` | Removed `export` from `getGlobalConfig`, `updateGlobalConfig` |
| `server/services/watcher.js` | Removed `broadcastToProject()` entirely |
| `server/services/documentRegistry.js` | Removed `getAllDocDefs()`, removed `export` from `resolveDocumentPath()` |

### Hooks (kept but noted)
Unused return values in hooks (`useTheme.theme/isLight/setTheme`, `useTasks.refresh`, `useProjects.error/refresh`, `useDocumentDetection.refreshDetection`) are intentionally kept - they form a reasonable public API for hooks that may be consumed differently in the future.
