import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToasts, dismissToast, showToast, subscribeToasts, type Toast } from './toast';

describe('toast store', () => {
  let seen: Toast[][];
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    clearToasts();
    seen = [];
    unsubscribe = subscribeToasts(t => seen.push(t));
  });
  afterEach(() => {
    unsubscribe();
    vi.useRealTimers();
  });

  const latest = () => seen[seen.length - 1];

  it('shows a toast and tells subscribers', () => {
    const id = showToast('Saved', 'success');
    expect(latest()).toEqual([{ id, message: 'Saved', kind: 'success' }]);
  });

  it('defaults to info and dismisses itself after the ttl', () => {
    showToast('Heads up', undefined, 1000);
    expect(latest()[0].kind).toBe('info');

    vi.advanceTimersByTime(999);
    expect(latest()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(latest()).toEqual([]);
  });

  it('a manual dismiss clears the timer, so nothing fires afterwards', () => {
    const id = showToast('Gone', 'error', 1000);
    dismissToast(id);
    expect(latest()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);

    const emits = seen.length;
    vi.advanceTimersByTime(5000);
    expect(seen.length).toBe(emits);
  });

  it('dismissing an id that is not showing is a no-op', () => {
    const emits = seen.length;
    dismissToast(9999);
    expect(seen.length).toBe(emits);
  });

  it('stacks in order and never repeats an id', () => {
    const ids = [showToast('a'), showToast('b'), showToast('c')];
    expect(new Set(ids).size).toBe(3);
    expect(latest().map(t => t.message)).toEqual(['a', 'b', 'c']);
  });

  it('stops notifying a listener once it unsubscribes', () => {
    unsubscribe();
    const emits = seen.length;
    showToast('unheard');
    expect(seen.length).toBe(emits);
    unsubscribe = () => {};
  });
});
