import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyUnauthorized, setOnUnauthorized } from './auth';

/**
 * 0031 #7: both apps register the unauthorized handler from a useEffect, so a
 * 401 that lands before the provider mounts used to be dropped — token
 * cleared, nobody told, the user left on a screen that no longer works. A
 * missed notification is now held and delivered to the next handler.
 */
describe('notifyUnauthorized before a handler exists', () => {
  beforeEach(() => setOnUnauthorized(null));

  it('is delivered to the handler registered afterwards, once', async () => {
    await notifyUnauthorized();
    const handler = vi.fn();
    setOnUnauthorized(handler);
    expect(handler).toHaveBeenCalledTimes(1);
    setOnUnauthorized(null);
    setOnUnauthorized(handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('goes straight to a registered handler and leaves nothing pending', async () => {
    const handler = vi.fn();
    setOnUnauthorized(handler);
    await notifyUnauthorized();
    expect(handler).toHaveBeenCalledTimes(1);
    setOnUnauthorized(null);
    const next = vi.fn();
    setOnUnauthorized(next);
    expect(next).not.toHaveBeenCalled();
  });
});
