// Epic color palette - 8 colors that work in both dark and light modes
// Colors defined as CSS variable pairs for theming support
export const EPIC_COLORS = [
  { name: 'rose', bg: 'var(--color-epic-rose-bg)', text: 'var(--color-epic-rose-text)' },
  { name: 'orange', bg: 'var(--color-epic-orange-bg)', text: 'var(--color-epic-orange-text)' },
  { name: 'amber', bg: 'var(--color-epic-amber-bg)', text: 'var(--color-epic-amber-text)' },
  { name: 'lime', bg: 'var(--color-epic-lime-bg)', text: 'var(--color-epic-lime-text)' },
  { name: 'cyan', bg: 'var(--color-epic-cyan-bg)', text: 'var(--color-epic-cyan-text)' },
  { name: 'blue', bg: 'var(--color-epic-blue-bg)', text: 'var(--color-epic-blue-text)' },
  { name: 'violet', bg: 'var(--color-epic-violet-bg)', text: 'var(--color-epic-violet-text)' },
  { name: 'fuchsia', bg: 'var(--color-epic-fuchsia-bg)', text: 'var(--color-epic-fuchsia-text)' },
] as const;

/**
 * Hash an epic string to get a consistent color index.
 * Uses djb2 hash algorithm for deterministic results.
 */
function hashEpicToColorIndex(epic: string): number {
  let hash = 0;
  for (let i = 0; i < epic.length; i++) {
    hash = ((hash << 5) - hash) + epic.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % EPIC_COLORS.length;
}

/**
 * Get the color pair for an epic string.
 * Same epic string always returns the same color.
 */
export function getEpicColor(epic: string): { bg: string; text: string } {
  const index = hashEpicToColorIndex(epic);
  return { bg: EPIC_COLORS[index].bg, text: EPIC_COLORS[index].text };
}
