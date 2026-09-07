import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initAuth, PARTNER_SLUG_KEY } from '@fit-nation/shared';
import type { UserResource } from '@fit-nation/shared';
import { persistPartnerSlug } from './partnerSlug';

/**
 * Spec 0019. Web wrote the Partner slug under `'partner-slug'` in sixteen
 * places while `packages/shared` exported `PARTNER_SLUG_KEY = 'partnerSlug'`.
 * The only reader is the inline boot script in `index.html`, which cannot
 * import the constant — so the literal there is pinned to it here, and the
 * one-time migration off the old key is checked to be in place.
 */

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LEGACY_KEY = 'partner-slug';

const store = new Map<string, string>();
initAuth({
  storage: {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: key => void store.delete(key),
  },
});

const user = (partner: unknown) => ({ id: 1, partner }) as unknown as UserResource;
const partnerUser = user({ name: 'Partner', slug: 'acme-gym', visual_identity: null });
const plainUser = user(null);

describe('persistPartnerSlug', () => {
  beforeEach(() => store.clear());

  it('writes the slug under the shared key for a Partner user', async () => {
    await persistPartnerSlug(partnerUser);
    expect(store.get(PARTNER_SLUG_KEY)).toBe('acme-gym');
  });

  it('removes it for a plain user', async () => {
    store.set(PARTNER_SLUG_KEY, 'acme-gym');
    await persistPartnerSlug(plainUser);
    expect(store.has(PARTNER_SLUG_KEY)).toBe(false);
  });

  it('removes it on logout', async () => {
    store.set(PARTNER_SLUG_KEY, 'acme-gym');
    await persistPartnerSlug(null);
    expect(store.has(PARTNER_SLUG_KEY)).toBe(false);
  });
});

describe('the index.html boot script', () => {
  const html = readFileSync(join(WEB, 'index.html'), 'utf8');

  it('reads the slug under the shared key', () => {
    expect(html).toContain(`localStorage.getItem('${PARTNER_SLUG_KEY}')`);
  });

  it('migrates the legacy key once: read, copy forward, remove', () => {
    expect(html).toContain(`localStorage.getItem('${LEGACY_KEY}')`);
    expect(html).toContain(`localStorage.setItem('${PARTNER_SLUG_KEY}'`);
    expect(html).toContain(`localStorage.removeItem('${LEGACY_KEY}')`);
  });
});

describe('the legacy key is gone from src/', () => {
  const sources = readdirSync(join(WEB, 'src'), { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && /\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name))
    .map(e => join(e.parentPath, e.name));

  it('still scans something', () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it('no source file names it', () => {
    const offenders = sources.filter(f => readFileSync(f, 'utf8').includes(LEGACY_KEY));
    expect(offenders).toEqual([]);
  });
});
