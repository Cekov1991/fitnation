import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAuth, setOnSubscriptionRequired, setOnUnauthorized } from './auth';
import { initApi } from './config';
import { ApiFailure, failureOf, firstFieldError, isApiFailure, normaliseFieldErrors, request } from './http';

const store = new Map<string, string>();
initAuth({ storage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: k => void store.delete(k) } });
initApi({ baseUrl: 'https://api.test' });

const reply = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

describe('request', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setOnUnauthorized(null);
    setOnSubscriptionRequired(null);
  });

  it('returns the parsed body, typed by the caller', async () => {
    fetchMock.mockResolvedValue(reply(200, { data: { id: 7 } }));
    const body = await request<{ data: { id: number } }>('/things/7', { auth: 'none' });
    expect(body.data.id).toBe(7);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/things/7');
  });

  it('sends the bearer token only when asked, and never when there is none', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply(200, {})));
    store.set('authToken', 'tok');
    await request('/a', { auth: 'bearer' });
    await request('/b', { auth: 'none' });
    store.clear();
    await request('/c', { auth: 'bearer' });
    const auth = (i: number) => (fetchMock.mock.calls[i][1].headers as Record<string, string>).Authorization;
    expect(auth(0)).toBe('Bearer tok');
    expect(auth(1)).toBeUndefined();
    expect(auth(2)).toBeUndefined();
  });

  it('resolves undefined for an empty reply', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(request('/gone', { auth: 'none', method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('leaves the content type to FormData', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply(200, {})));
    await request('/upload', { auth: 'none', method: 'POST', body: new FormData() });
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('turns a 422 into a validation failure with array field errors', async () => {
    fetchMock.mockResolvedValue(reply(422, { message: 'The given data was invalid.', errors: { email: ['Required.'], name: 'Too short.' } }));
    const failure = (await request('/x', { auth: 'none' }).catch(e => e)) as ApiFailure;
    expect(isApiFailure(failure)).toBe(true);
    expect(failure).toMatchObject({ kind: 'validation', status: 422, errors: { email: ['Required.'], name: ['Too short.'] } });
    expect(firstFieldError(failure, 'email')).toBe('Required.');
    expect(firstFieldError(failure, 'missing')).toBeUndefined();
  });

  it('a rejected bearer token is a handled unauthorized: token cleared, app told, and the failure says so', async () => {
    fetchMock.mockResolvedValue(reply(401, { message: 'Unauthenticated.' }));
    store.set('authToken', 'stale');
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    const failure = await request('/me', { auth: 'bearer' }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'unauthorized', status: 401, unauthorizedHandled: true });
    expect(store.has('authToken')).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('a 401 on a public request, or with no token, is unauthorized but not handled', async () => {
    fetchMock.mockResolvedValue(reply(401, { message: 'Bad credentials' }));
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    const failure = await request('/login', { auth: 'none', method: 'POST' }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'unauthorized', unauthorizedHandled: false, message: 'Bad credentials' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('a 403 from the subscription gate is its own failure and tells the app to show the paywall', async () => {
    fetchMock.mockResolvedValue(reply(403, { message: 'Subscription required.', code: 'subscription_required' }));
    store.set('authToken', 'tok');
    const onSubscriptionRequired = vi.fn();
    setOnSubscriptionRequired(onSubscriptionRequired);
    const failure = await request('/muscle-groups', { auth: 'bearer' }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'subscription_required', status: 403, message: 'Subscription required.' });
    expect(onSubscriptionRequired).toHaveBeenCalledTimes(1);
    expect(store.has('authToken')).toBe(true);
  });

  it('any other 403 is a plain http failure and does not touch the paywall hook', async () => {
    fetchMock.mockResolvedValue(reply(403, { message: 'This action is unauthorized.' }));
    const onSubscriptionRequired = vi.fn();
    setOnSubscriptionRequired(onSubscriptionRequired);
    expect(await request('/plans/9', { auth: 'bearer' }).catch(e => e)).toMatchObject({ kind: 'http', status: 403 });
    expect(onSubscriptionRequired).not.toHaveBeenCalled();
  });

  it('other statuses are http failures with their status; no answer at all is a network failure', async () => {
    fetchMock.mockResolvedValue(reply(409, { message: 'Onboarding has already been completed' }));
    expect(await request('/o', { auth: 'bearer' }).catch(e => e)).toMatchObject({ kind: 'http', status: 409 });
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await request('/o', { auth: 'bearer' }).catch(e => e)).toMatchObject({ kind: 'network', status: null });
  });

  it('an error status still counts when its body cannot be read', async () => {
    const brokenBody = () => new ReadableStream({ start: c => c.error(new TypeError('connection reset')) });
    fetchMock.mockImplementation(() => Promise.resolve(new Response(brokenBody(), { status: 401 })));
    store.set('authToken', 'stale');
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    expect(await request('/me', { auth: 'bearer' }).catch(e => e)).toMatchObject({ kind: 'unauthorized', unauthorizedHandled: true });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  /** A fetch that never answers on its own; it rejects like the platform's when its signal aborts. */
  const hangingFetch = () =>
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })
    );

  describe('timeout', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('gives up after 15 s with a timeout failure', async () => {
      hangingFetch();
      const pending = request('/user', { auth: 'bearer' }).catch(e => e);
      await vi.advanceTimersByTimeAsync(14_999);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toMatchObject({ kind: 'timeout', status: null });
    });

    it('counts reading the body against the limit too', async () => {
      fetchMock.mockImplementation((_url: string, init: RequestInit) => {
        const body = new ReadableStream({
          start(c) {
            init.signal?.addEventListener('abort', () => c.error(new DOMException('Aborted', 'AbortError')));
          },
        });
        return Promise.resolve(new Response(body, { status: 200 }));
      });
      const pending = request('/user', { auth: 'bearer' }).catch(e => e);
      await vi.advanceTimersByTimeAsync(15_000);
      expect(await pending).toMatchObject({ kind: 'timeout' });
    });

    it('takes a per-request override, for calls that legitimately run long', async () => {
      hangingFetch();
      const pending = request('/exercises/1', { auth: 'bearer', timeoutMs: 60_000 }).catch(e => e);
      await vi.advanceTimersByTimeAsync(59_999);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toMatchObject({ kind: 'timeout' });
    });

    it('gives an upload longer than an ordinary call', async () => {
      hangingFetch();
      const pending = request('/profile', { auth: 'bearer', method: 'POST', body: new FormData() }).catch(e => e);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(await pending).toMatchObject({ kind: 'timeout' });
    });

    it("a caller's own abort is a network failure, not a timeout", async () => {
      hangingFetch();
      const controller = new AbortController();
      const pending = request('/user', { auth: 'bearer', signal: controller.signal }).catch(e => e);
      await vi.advanceTimersByTimeAsync(0);
      controller.abort();
      expect(await pending).toMatchObject({ kind: 'network' });
    });

    it('an answer in time clears the timer', async () => {
      fetchMock.mockResolvedValue(reply(200, { ok: true }));
      await expect(request('/user', { auth: 'bearer' })).resolves.toEqual({ ok: true });
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

describe('failureOf', () => {
  it('passes an ApiFailure through and wraps anything else', () => {
    const f = new ApiFailure('http', 'x', { status: 500 });
    expect(failureOf(f)).toBe(f);
    expect(failureOf(new TypeError('Failed to fetch')).kind).toBe('network');
    expect(failureOf(new Error('boom'))).toMatchObject({ kind: 'http', status: null, message: 'boom' });
    expect(failureOf('nope').message).toBe('nope');
  });
});

describe('normaliseFieldErrors', () => {
  it('wraps scalars, keeps arrays, drops garbage', () => {
    expect(normaliseFieldErrors({ a: 'x', b: ['y', 'z'], c: 3, d: null })).toEqual({ a: ['x'], b: ['y', 'z'] });
    expect(normaliseFieldErrors(undefined)).toEqual({});
    expect(normaliseFieldErrors('nope')).toEqual({});
  });
});
