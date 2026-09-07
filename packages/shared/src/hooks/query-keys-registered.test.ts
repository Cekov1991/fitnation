import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0018.
 *
 * `invalidateQueries` matches by prefix against the keys `useQuery` calls have
 * registered. Invalidating a key nothing registers is a silent no-op: the call
 * compiles, runs, and refreshes nothing. Two of those survived here —
 * `['custom-plans']` where the list is registered as `['plans']`, and `['user']`
 * for an object that lives outside React Query altogether — because 107
 * hand-built key literals give a typo nowhere to show up.
 *
 * The rule this pins: the first segment of every invalidated key is the first
 * segment of some registered key. First segments are string literals
 * throughout, so a source scan is enough; the dynamic tail is what makes the
 * match a prefix match, and is not checked. 0028's key registry is the
 * structural fix — until it lands, this is the guard.
 */

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

/** Where queries are registered — one file today. */
const REGISTRATIONS = ['packages/shared/src/hooks/useApi.ts'];

/** Every file that invalidates. */
const INVALIDATIONS = [
  'packages/shared/src/hooks/useApi.ts',
  'packages/shared/src/hooks/setLogMutations.ts',
  'apps/web/src/components/SessionDetailPage.tsx',
];

/**
 * First segment of each `queryKey` that follows `opener`, e.g. `'plans'` from
 * `useQuery({ queryKey: ['plans', planId], ... })`. `[^}]*?` keeps the search
 * inside the options object: `queryKey` precedes `queryFn` everywhere, so no
 * closing brace sits between the two.
 */
function firstSegments(source: string, opener: string): string[] {
  const re = new RegExp(`${opener}\\(\\{[^}]*?queryKey:\\s*\\[\\s*'([^']+)'`, 'g');
  return Array.from(source.matchAll(re), m => m[1]);
}

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

describe('every invalidated query key is registered', () => {
  const read = (rel: string) => readFileSync(join(REPO, rel), 'utf8');

  const registered = new Set(REGISTRATIONS.flatMap(rel => firstSegments(read(rel), 'useQuery')));

  it('still has registrations to check', () => {
    // Guards against the scan silently covering nothing and passing forever.
    expect(registered.size).toBeGreaterThanOrEqual(15);
  });

  it.each(INVALIDATIONS)('%s: every invalidation has a literal first segment', rel => {
    const source = read(rel);
    // A first segment the regex cannot read would be skipped, not checked.
    expect(firstSegments(source, 'invalidateQueries').length).toBe(
      occurrences(source, 'invalidateQueries(')
    );
  });

  it.each(INVALIDATIONS)('%s: never invalidates a key nothing registers', rel => {
    const dead = firstSegments(read(rel), 'invalidateQueries').filter(k => !registered.has(k));

    expect(dead).toEqual([]);
  });
});
