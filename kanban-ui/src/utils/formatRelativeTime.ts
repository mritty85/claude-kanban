export function formatRelativeTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'Saved just now';
  if (diffSeconds < 60) return `Saved ${diffSeconds}s ago`;
  if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;
  if (diffHours < 24) return `Saved ${diffHours}h ago`;
  return `Saved on ${date.toLocaleDateString()}`;
}
