import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryKeys } from '../queryKeys';

/**
 * The structural guard for spec 0018, rewritten for the registry (0028).
 *
 * `invalidateQueries` matches by prefix against keys `useQuery` calls have
 * registered; invalidating a key nothing registers is a silent no-op. Before
 * the registry that happened twice. Now every key is a `queryKeys.<domain>.<name>()`
 * call, so this guard reads those calls, builds each key through the real
 * registry with placeholder arguments, and checks that every invalidated key
 * is a prefix of some registered one — the exact rule React Query applies.
 *
 * It also pins the registry as the only source of keys: an inline array
 * literal anywhere in the front-end source fails here.
 */

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

/** Where queries are registered — one file today. */
const REGISTRATIONS = ['packages/shared/src/hooks/useApi.ts'];

/** Every file that invalidates or otherwise addresses the cache. */
const KEY_USERS = [
  'packages/shared/src/hooks/useApi.ts',
  'packages/shared/src/hooks/setLogMutations.ts',
  'apps/web/src/components/SessionDetailPage.tsx',
  'apps/web/src/components/workout-session/hooks/useWorkoutSessionState.ts',
  'apps/web/src/components/dashboard/ProgramControls.tsx',
  'apps/web/src/components/dashboard/ProgramDashboard.tsx',
  'apps/web/src/route-wrappers/WorkoutSessionPageWrapper.tsx',
];

const read = (rel: string) => readFileSync(join(REPO, rel), 'utf8');

type KeyRef = readonly [domain: string, name: string];

/** `queryKeys.<domain>.<name>(` calls that follow `opener` inside its options object. */
function keyRefs(source: string, opener: string): KeyRef[] {
  const re = new RegExp(`${opener}\\(\\{[^}]*?queryKey:\\s*queryKeys\\.(\\w+)\\.(\\w+)\\(`, 'g');
  return Array.from(source.matchAll(re), m => [m[1], m[2]] as const);
}

const ARG = Symbol('any argument');

/** The key a registry function builds, with every argument left open. */
function keyOf([domain, name]: KeyRef): readonly unknown[] {
  const fn = (queryKeys as Record<string, Record<string, (...args: unknown[]) => readonly unknown[]>>)[domain]?.[name];
  if (!fn) throw new Error(`queryKeys.${domain}.${name} does not exist`);
  return fn(...Array.from({ length: fn.length }, () => ARG));
}

/** React Query's rule, with an open argument matching anything. */
function covers(prefix: readonly unknown[], key: readonly unknown[]): boolean {
  return prefix.length <= key.length && prefix.every((seg, i) => seg === ARG || key[i] === ARG || seg === key[i]);
}

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

describe('every invalidated query key is registered', () => {
  const registered = REGISTRATIONS.flatMap(rel => keyRefs(read(rel), 'useQuery')).map(keyOf);

  it('still has registrations to check', () => {
    // Guards against the scan silently covering nothing and passing forever.
    expect(registered.length).toBeGreaterThanOrEqual(15);
  });

  it.each(KEY_USERS)('%s: every invalidation goes through the registry', rel => {
    const source = read(rel);
    expect(keyRefs(source, 'invalidateQueries').length).toBe(occurrences(source, 'invalidateQueries('));
  });

  it.each(KEY_USERS)('%s: never invalidates a key nothing registers', rel => {
    const dead = keyRefs(read(rel), 'invalidateQueries')
      .filter(ref => !registered.some(key => covers(keyOf(ref), key)))
      .map(([d, n]) => `queryKeys.${d}.${n}`);

    expect(dead).toEqual([]);
  });

  it.each(KEY_USERS)('%s: builds no key by hand', rel => {
    expect(read(rel)).not.toMatch(/queryKey:\s*\[/);
  });
});
