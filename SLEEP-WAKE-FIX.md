# Sleep/Wake Connection Issue

## Problem

The app hangs and stops loading data (cards, notes, roadmap) after the computer wakes from sleep. Restarting the server doesn't always fix it.

## Root Cause

Two components become stale after sleep but don't properly signal errors:

1. **SSE (Server-Sent Events) connections** - The browser's `EventSource` thinks it's connected when it's not, so it never triggers reconnection or data refresh.

2. **Chokidar file watcher** - The Node.js file watcher can become unresponsive after system sleep.

The current SSE error handler (`src/lib/api.ts:74-76`) only logs an error—it doesn't recover:

```typescript
eventSource.onerror = () => {
  console.error('SSE connection error, will attempt reconnect');
};
```

## Immediate Workaround

```bash
# Kill all node processes for this project
pkill -f "claude-kanban-main"

# Restart
cd ~/Documents/Skunk\ Works/claude-kanban-main/kanban-ui && npm start
```

Then hard refresh the browser: `Cmd+Shift+R`

## Proposed Fix

Add visibility-based reconnection in `src/lib/api.ts`:

```typescript
export function subscribeToChanges(
  onEvent: (event: { event: string; path: string; timestamp: number }) => void,
  onReconnect?: () => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectAttempts = 0;
  const maxReconnectDelay = 30000;

  function connect() {
    eventSource = new EventSource(`${API_BASE}/tasks/events`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        reconnectAttempts = 0; // Reset on successful message
        onEvent(data);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error, reconnecting...');
      eventSource?.close();

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
      reconnectAttempts++;
      setTimeout(connect, delay);
    };

    eventSource.onopen = () => {
      if (reconnectAttempts > 0 && onReconnect) {
        onReconnect(); // Trigger data refresh after reconnect
      }
    };
  }

  connect();

  // Reconnect when tab becomes visible (after sleep/wake)
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('Tab visible, checking SSE connection...');
      if (eventSource?.readyState === EventSource.CLOSED) {
        connect();
      }
      onReconnect?.(); // Always refresh data when tab becomes visible
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    eventSource?.close();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
```

Then update `src/hooks/useTasks.ts` to pass the refresh callback:

```typescript
useEffect(() => {
  const unsubscribe = api.subscribeToChanges(
    (event) => {
      if (event.event === 'project-switched' || event.event === 'add' ||
          event.event === 'change' || event.event === 'unlink') {
        loadTasks();
      }
    },
    loadTasks // onReconnect callback - refresh data
  );
  return unsubscribe;
}, [loadTasks]);
```

## Files to Modify

1. `kanban-ui/src/lib/api.ts` - Update `subscribeToChanges` function
2. `kanban-ui/src/hooks/useTasks.ts` - Pass refresh callback
3. Consider similar changes for `useProjects.ts` if it has SSE subscriptions

## Optional Enhancement

Add a heartbeat mechanism to detect stale connections proactively:

- Server sends a ping every 30 seconds
- Client expects ping within 45 seconds
- If no ping received, force reconnect
