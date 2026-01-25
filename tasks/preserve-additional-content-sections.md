# Preserve and Display Additional Content Sections

## Id
task_1735500000000

## Status
done

## Tags
- new-functionality

## Description
Modify the task parser/serializer to preserve unknown `## Section` headers, and display them in a read-only collapsible section in the TaskPanel UI.

**Problem:** Claude Code sessions often add rich content to task files (Progress checkpoints, Dependencies, Technical References) using custom `## Sections`. These were silently ignored by the parser and lost when editing tasks through the UI.

**Solution:** Capture all unrecognized `##` sections into an `additionalContent` field, preserve them on save, and display them in a collapsible read-only section.

## Acceptance Criteria
- [x] Unknown ## sections captured by parser
- [x] Content preserved when saving through UI
- [x] Collapsible section appears below Notes (collapsed by default)
- [x] Read-only display with monospace formatting
- [x] Build passes with no TypeScript errors

## Completed
2024-12-29T10:30:00.000Z

## Notes
Session: Dec 29, 2024

User identified the need after reviewing `create-year-in-review-page.md` from Budget App project - a complex task with extensive Progress checkpoints that would be lost if edited in UI.

Discussed three options:
1. Stricter prompt (rejected - limits workflow value)
2. Preserve & display (chosen)
3. Full markdown editor / hybrid (deferred for future)

## Progress

### Implementation
**Files modified:**
- `src/types/task.ts` - Added `additionalContent?: string` to Task and TaskFormData
- `server/services/fileService.js` - Updated `parseTaskFile()` and `serializeTask()`
- `src/components/TaskPanel.tsx` - Added collapsible UI section with ChevronDown toggle

### Technical Details
**Parser logic:**
- Known sections: id, status, tags, description, acceptance criteria, notes, completed, epic
- Unknown `## Heading` triggers capture mode
- Content captured verbatim including the header line
- Capture continues until next known section or EOF

**Serializer logic:**
- Appends `additionalContent` after all standard sections
- No transformation - preserves exact markdown
