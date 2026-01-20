# Dead Code & Optimization Audit

**Date:** 2026-01-20
**Scope:** Full codebase review for dead code and low-risk optimizations

---

## Summary

| Category | Count | Resolved | Remaining |
|----------|-------|----------|-----------|
| Dead Code (Frontend) | 2 | 0 | 2 |
| Dead Code (Backend) | 6 | 2 | 4 |
| Optimization Opportunities | 6 | 0 | 6 |
| **Total Findings** | **14** | **2** | **12** |

---

## Part 1: Dead Code

### Frontend

#### 1. Unused Export: `setContent` in useProjectNotes.ts
- **File:** `src/hooks/useProjectNotes.ts`
- **Line:** 136
- **Issue:** `setContent` is exported but never used by `NotesPanel.tsx` (only `updateContent()` is called)
- **Recommendation:** Remove from exports

#### 2. Unused Export: `setContent` in useProjectRoadmap.ts
- **File:** `src/hooks/useProjectRoadmap.ts`
- **Line:** 136
- **Issue:** `setContent` is exported but never used by `RoadmapPanel.tsx` (only `updateContent()` is called)
- **Recommendation:** Remove from exports

---

### Backend

#### 3. ~~Unused Import: `gray-matter`~~ ✅ RESOLVED
- **File:** `server/services/fileService.js`
- **Line:** 3
- **Issue:** `import matter from 'gray-matter'` is imported but never used. The code manually parses markdown instead.
- **Recommendation:** Remove import (and potentially remove from package.json if unused elsewhere)
- **Resolution:** Removed import from fileService.js and removed package from package.json (2026-01-20)

#### 4. Unused Export: `closeWatcher()`
- **File:** `server/services/watcher.js`
- **Lines:** 113-118
- **Issue:** Function is exported but never called anywhere. Watcher is closed indirectly via `initWatcher()` reassignment.
- **Recommendation:** Remove or keep for future use (document intent)

#### 5. Unused Export: `broadcastToClients()`
- **File:** `server/services/watcher.js`
- **Lines:** 121-126
- **Issue:** Exported function that's only called internally within `switchProject()`, never from external code.
- **Recommendation:** Make internal (remove `export`) or remove if not needed

#### 6. Unused Export: `updateClientProject()`
- **File:** `server/services/watcher.js`
- **Lines:** 98-111
- **Issue:** Exported function never called from outside the file.
- **Recommendation:** Make internal (remove `export`) or remove if not needed

#### 7. Unused Function Parameter: `clientId` in `switchProject()`
- **File:** `server/services/watcher.js`
- **Line:** 144
- **Issue:** `clientId` parameter has default value of `null` and no caller ever passes it. Vestigial from multi-client switching logic.
- **Recommendation:** Remove parameter or document future intent

#### 8. ~~Redundant Logic: Project enrichment Promise.all~~ ✅ RESOLVED
- **File:** `server/routes/projects.js`
- **Lines:** 22-33
- **Issue:** Async mapping that returns each project unchanged:
  ```javascript
  const enriched = await Promise.all(
    projects.map(async (project) => {
      try {
        return project;  // Does nothing
      } catch {
        return project;
      }
    })
  );
  ```
- **Recommendation:** Simplify to `res.json(projects)`
- **Resolution:** Simplified to direct `res.json(projects)` call (2026-01-20)

---

## Part 2: Low-Risk Optimizations

### 1. Duplicate `tagStyles` Definition (High Priority)
- **Files Affected:**
  - `src/components/Tag.tsx` (lines 8-14)
  - `src/components/TaskPanel.tsx` (lines 36-42)
  - `src/components/FilterDropdown.tsx` (lines 19-25)
- **Issue:** Identical `tagStyles` object defined in 3 separate files
- **Recommendation:** Create `src/utils/tagStyles.ts` and import in all three components
- **Risk:** Minimal - pure code consolidation

### 2. Duplicate `STATUSES` Array
- **Files Affected:**
  - `server/services/fileService.js` (line 6)
  - `server/services/configService.js` (line 8)
- **Issue:** Same array defined in two backend files
- **Recommendation:** Create `server/constants.js` and import in both
- **Risk:** Minimal - improves maintainability

### 3. Repeated `getEpicColor()` Calls
- **File:** `src/components/Card.tsx` (lines 75-85)
- **Issue:** `getEpicColor(task.epic)` called twice per render (once for `.bg`, once for `.text`)
- **Current Code:**
  ```typescript
  style={{
    backgroundColor: getEpicColor(task.epic).bg,
    color: getEpicColor(task.epic).text,
  }}
  ```
- **Recommendation:** Cache result in variable:
  ```typescript
  const epicColor = task.epic ? getEpicColor(task.epic) : null;
  // Then use: epicColor.bg, epicColor.text
  ```
- **Risk:** Minimal - purely deduplicating function calls

### 4. Repeated `getEpicColor()` in EpicCombobox
- **File:** `src/components/EpicCombobox.tsx` (lines 88, 144, 155)
- **Issue:** Same function called multiple times in same render for deterministic output
- **Recommendation:** Cache color results when rendering epic badges
- **Risk:** Minimal

### 5. Empty `onChange` Handlers
- **File:** `src/components/FilterDropdown.tsx` (lines 131-151)
- **Issue:** Checkbox inputs have `onChange={() => {}}` that do nothing (clicks handled by parent button)
- **Recommendation:** Add `readOnly` attribute for clarity, or document intent
- **Risk:** Very low - no functional impact

### 6. API Response Pattern Duplication
- **File:** `src/lib/api.ts`
- **Issue:** Notes/Roadmap endpoints repeat same fetch+json+error pattern
- **Recommendation:** Create helper function `fetchJsonContent(url)` to reduce repetition
- **Risk:** Minimal - extracting common pattern

---

## Recommended Action Order

### Quick Wins (Can do immediately)
1. ~~Remove unused `gray-matter` import from fileService.js~~ ✅
2. ~~Simplify project enrichment logic in projects.js~~ ✅
3. Remove unused `setContent` exports from hooks

### Code Consolidation (Low effort, high value)
4. Extract shared `tagStyles` to utility file
5. Extract shared `STATUSES` to constants file
6. Cache `getEpicColor()` results in Card.tsx and EpicCombobox.tsx

### Consider Keeping (May have future use)
- `closeWatcher()` - useful for graceful shutdown
- `broadcastToClients()` - may be needed for future features
- `clientId` parameter - multi-tab support may need this

---

## Files Modified By This Audit

| File | Change | Date |
|------|--------|------|
| `kanban-ui/server/services/fileService.js` | Removed unused `gray-matter` import | 2026-01-20 |
| `kanban-ui/server/routes/projects.js` | Simplified redundant Promise.all to direct response | 2026-01-20 |
| `kanban-ui/package.json` | Removed `gray-matter` dependency | 2026-01-20 |

---

## Notes

- Overall code quality is excellent
- No commented-out code blocks found
- No unused components found
- All type definitions are in use
- CSS classes are all actively used
