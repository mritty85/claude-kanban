# Allow Freeform Tags to Display

## Id
task_1767011520379

## Status
planning

## Tags
- feature-enhancement

## Description
Currently, tags are constrained to a predefined `TaskTag` union type. When Claude creates a task with an unknown tag name, it gets parsed but doesn't display properly (no label, no styling).

**Goal:** Allow arbitrary tag strings while maintaining good UX for common tags.

## Acceptance Criteria
- [ ] Unknown tags display with neutral/default styling
- [ ] Existing predefined tags retain their colors
- [ ] Filter dropdown shows all tags found in tasks
- [ ] No TypeScript errors

## Notes
Session: Dec 29, 2024

Parser already captures tags as plain strings - the constraint is TypeScript types and UI styling.

**Option A: Hybrid (Recommended - ~10 min)**
- Change `TaskTag` type to allow `string`
- Add fallback neutral style (gray) for unknown tags
- Minimal UI changes - unknown tags just render gray
- Files: `task.ts`, `Tag.tsx`, `FilterDropdown.tsx`, `TaskPanel.tsx`

**Option B: Full Free-form (~30 min)**
- Same type changes as Option A
- Replace toggle buttons in TaskPanel with combobox input (like Epic field)
- Derive suggestion list from all tags found across existing tasks
- More flexible input but more UI rework

## Technical Reference

**Current tag flow:**
1. Parser (`fileService.js:254-255`) - captures as `string[]` already
2. Types (`task.ts`) - constrains to `TaskTag` union
3. UI components use `tagStyles` objects with hardcoded keys

**Files to modify:**
- `src/types/task.ts` - Change `TaskTag` or add string allowance
- `src/components/Tag.tsx` - Add default style fallback
- `src/components/FilterDropdown.tsx` - Add default style, derive tag list from tasks
- `src/components/TaskPanel.tsx` - Add default style (Option A) or combobox (Option B)
