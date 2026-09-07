import { useEffect, useState } from 'react';

export type ToastKind = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

// A module-level store rather than context, so a hook or a plain async function
// can raise a toast without threading a setter through — the session hook's
// catch blocks are the first callers (0014, 0031 #1). Mirrors
// apps/mobile/src/lib/toast.ts, with the auto-dismiss timer tracked so a manual
// dismiss clears it instead of leaving it to fire on a toast that is gone.
let toasts: Toast[] = [];
let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<(toasts: Toast[]) => void>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function showToast(message: string, kind: ToastKind = 'info', ttlMs = 4000): number {
  const id = nextId++;
  toasts = [...toasts, { id, message, kind }];
  emit();
  timers.set(id, setTimeout(() => dismissToast(id), ttlMs));
  return id;
}

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
  if (!toasts.some(t => t.id === id)) return;
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  const [list, setList] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setList);
    setList(toasts); // anything shown between the first render and subscribing
    return () => {
      listeners.delete(setList);
    };
  }, []);
  return list;
}

/** Subscribe outside React. Returns the unsubscribe. */
export function subscribeToasts(listener: (toasts: Toast[]) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Drop every toast and its timer. For tests. */
export function clearToasts(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  toasts = [];
  emit();
}
