import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAuth, setOnUnauthorized } from './auth';
import { initApi } from './config';
import { publicGet, type ApiFailure } from './http';
import { publicStationsApi } from './api';

/**
 * QR Stations (ADR-0005): the public pages are opened by anonymous phones
 * scanning printed stickers. The contract pinned here is that this path is
 * truly public — no token header even when one is stored, and a 401 (or any
 * failure) never triggers the sign-out flow a bearer call would — and that
 * the backend's answers for stale stickers (404 unknown, 410 deleted) come
 * back with their status for the graceful fallback page.
 */

const store = new Map<string, string>();
initAuth({ storage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: k => void store.delete(k) } });
initApi({ baseUrl: 'https://api.test' });

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('publicGet', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setOnUnauthorized(null);
  });

  it('never sends the stored token', async () => {
    fetchMock.mockResolvedValue(reply(200, { data: {} }));
    store.set('authToken', 'tok');

    await publicGet('/public/stations/abc123');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/public/stations/abc123');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('a 401 neither clears the stored token nor tells the app to sign out', async () => {
    fetchMock.mockResolvedValue(reply(401, { message: 'Unauthenticated.' }));
    store.set('authToken', 'tok');
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);

    const failure = (await publicGet('/public/stations/abc123').catch(e => e)) as ApiFailure;

    expect(failure).toMatchObject({ kind: 'unauthorized', unauthorizedHandled: false });
    expect(store.get('authToken')).toBe('tok');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("an unknown Short code surfaces the backend's 404 with its message", async () => {
    fetchMock.mockResolvedValue(reply(404, { status: 'not_found', message: 'Station not found.' }));

    const failure = (await publicGet('/public/stations/nope').catch(e => e)) as ApiFailure;

    expect(failure).toMatchObject({ kind: 'http', status: 404, message: 'Station not found.' });
  });

  it("a deleted Station surfaces the backend's 410 with its message", async () => {
    fetchMock.mockResolvedValue(reply(410, { status: 'gone', message: 'This station is no longer available.' }));

    const failure = (await publicGet('/public/stations/olds').catch(e => e)) as ApiFailure;

    expect(failure).toMatchObject({ kind: 'http', status: 410, message: 'This station is no longer available.' });
  });
});

describe('publicStationsApi', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    store.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('GETs the Station by Short code, URL-encoded, without auth', async () => {
    const station = {
      data: { name: 'Cable Crossover', short_code: 'ab/12', partner: { name: 'Iron Works', slug: 'iron-works' }, exercises: [] },
    };
    fetchMock.mockResolvedValue(reply(200, station));
    store.set('authToken', 'tok');

    const out = await publicStationsApi.getStation('ab/12');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/public/stations/ab%2F12');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(out.data.partner.slug).toBe('iron-works');
  });

  it("GETs one exercise's detail in the Station's context", async () => {
    const detail = {
      data: { id: 7, name: 'Incline Press', instructions: ['Sit back.'], common_mistakes: null },
      station: { name: 'Bench', short_code: 'abc123', partner: { name: 'Iron Works', slug: 'iron-works' } },
    };
    fetchMock.mockResolvedValue(reply(200, detail));

    const out = await publicStationsApi.getStationExercise('abc123', 7);

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe('https://api.test/public/stations/abc123/exercises/7');
    expect(out.data.instructions).toEqual(['Sit back.']);
    expect(out.station.short_code).toBe('abc123');
  });
});
