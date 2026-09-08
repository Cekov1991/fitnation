import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ADR 0001: navigation guards own authentication; queries do not gate on it.
 * The gate this replaces was a no-op on mobile and a silent self-disable
 * before initAuth() everywhere — see docs/adr/0001 and app spec 0016.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..');

describe('queries do not gate on authentication', () => {
  it('useApi.ts has no isAuthenticated gate', () => {
    expect(readFileSync(join(HERE, 'useApi.ts'), 'utf8')).not.toMatch(/isAuthenticated/);
  });

  it('the decision is recorded', () => {
    expect(existsSync(join(REPO, 'docs', 'adr', '0001-navigation-guards-own-authentication.md'))).toBe(true);
  });
});
