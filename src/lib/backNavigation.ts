/**
 * Global Back Navigation Manager for Suriyawan SPA
 * 
 * Provides a reliable, stack-based back navigation handler across all portals.
 * Prevents the browser from exhausting history entries and triggering page reloads.
 */

export type BackHandler = () => boolean;

interface RegisteredHandler {
  id: number;
  priority: number;
  handler: BackHandler;
}

let nextId = 1;
const handlers: RegisteredHandler[] = [];

/**
 * Register a back handler.
 * @param handler Function returning `true` if handled, `false` otherwise.
 * @param priority Higher priority handlers execute first (default: 10).
 * @returns Cleanup function to unregister the handler.
 */
export function registerBackHandler(handler: BackHandler, priority = 10): () => void {
  const item: RegisteredHandler = {
    id: nextId++,
    priority,
    handler,
  };
  handlers.push(item);
  // Keep sorted by priority ascending so higher priority items are at the end (LIFO)
  handlers.sort((a, b) => a.priority - b.priority || a.id - b.id);

  return () => {
    const idx = handlers.findIndex(h => h.id === item.id);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}

/**
 * Execute the registered back handlers in LIFO order (highest priority first).
 * @returns `true` if any handler consumed the back action, `false` otherwise.
 */
export function executeBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    try {
      const handled = handlers[i].handler();
      if (handled) {
        return true;
      }
    } catch (err) {
      console.warn('Error in back navigation handler:', err);
    }
  }
  return false;
}
