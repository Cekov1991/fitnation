import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAuth } from './auth';
import { initApi } from './config';
import { authApi, devicesApi } from './api';

const store = new Map<string, string>();
initAuth({ storage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: k => void store.delete(k) } });
initApi({ baseUrl: 'https://api.test' });

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('devicesApi.register', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  // The server upserts the Device bound to the calling bearer token and answers
  // 401 without one. The typed-HTTP refactor (0025) sent this call through the
  // unauthenticated helper, so no phone registered for push until it was caught
  // on a device in the RevenueCat go-live test. The auth mode is pinned here.
  it('PUTs /devices with the bearer token', async () => {
    fetchMock.mockResolvedValue(ok({ data: { id: 1, platform: 'android' } }));
    store.set('authToken', 'tok');

    await devicesApi.register({ push_token: 'ExponentPushToken[x]', platform: 'android' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/devices');
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });
});

describe('authApi.syncSubscription', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  // Subscription Sync (spec 026): the backend re-reads RevenueCat for the
  // calling user and answers the same payload as GET /user.
  it('POSTs /subscription/sync with the bearer token and returns the user', async () => {
    fetchMock.mockResolvedValue(ok({ user: { id: 42, entitlements: ['app_access'] } }));
    store.set('authToken', 'tok');

    const out = await authApi.syncSubscription();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/subscription/sync');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(out.user.entitlements).toEqual(['app_access']);
  });
});
