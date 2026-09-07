import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The mutation-to-invalidation map for the Workout Session cluster (0028).
 *
 * This is where the keys drifted (0018): a session write has to refresh the
 * right mix of the session detail, today's workout, the programs that own it
 * and the exercise histories it changed, and nothing made a wrong choice
 * visible. The table below is that choice, written down once. A mutation that
 * starts invalidating more or less than listed fails here, so the change is a
 * decision in a diff rather than an accident in a cache.
 *
 * `sessions.all()` covers detail, today and every calendar range by prefix, so
 * a mutation that lists it does not also list those — that redundancy was
 * removed when the registry landed.
 */

const HOOKS = join(dirname(fileURLToPath(import.meta.url)));
const SOURCES = ['useApi.ts', 'setLogMutations.ts', 'sessionExerciseMutations.ts'];

const EXPECTED: Record<string, string[]> = {
  // useApi.ts — hooks that delegate to an options object list nothing of their own
  useStartSession: ['sessions.all'], // seeds sessions.detail via setQueryData, not by invalidating
  useGenerateDraftSession: ['sessions.all'],
  useRegenerateDraftSession: ['sessions.all'],
  useConfirmDraftSession: ['sessions.detail', 'sessions.today'],
  useCompleteSession: ['sessions.all', 'programs.all', 'exercises.all', 'fitnessMetrics.all'],
  useCancelSession: ['sessions.all', 'programs.all'],
  useLogSet: [],
  useUpdateSet: [],
  useDeleteSet: [],
  useAddSessionExercise: ['sessions.detail'],
  useUpdateSessionExercise: [],
  useSwapSessionExercise: ['sessions.detail'],
  useRemoveSessionExercise: [],
  useReorderSessionExercises: ['sessions.detail'],
  // setLogMutations.ts
  logSetMutationOptions: ['sessions.detail', 'exercises.histories'],
  updateSetMutationOptions: ['sessions.detail', 'exercises.histories', 'exercises.all'],
  deleteSetMutationOptions: ['sessions.detail', 'exercises.histories', 'exercises.all'],
  // sessionExerciseMutations.ts
  updateSessionExerciseMutationOptions: ['sessions.detail'],
  removeSessionExerciseMutationOptions: ['sessions.detail'],
};

interface Fn {
  name: string;
  exported: boolean;
  body: string;
}

/** Every top-level function and its body, up to the next top-level function. */
function topLevelFunctions(source: string): Fn[] {
  const re = /^(export )?function (\w+)\(/gm;
  const starts = Array.from(source.matchAll(re), m => ({ name: m[2], exported: !!m[1], index: m.index! }));
  return starts.map((s, i) => ({ name: s.name, exported: s.exported, body: source.slice(s.index, starts[i + 1]?.index ?? source.length) }));
}

const INVALIDATION = /invalidateQueries\(\{\s*queryKey:\s*queryKeys\.(\w+)\.(\w+)\(/g;

/** The keys `fn` invalidates, including through a module-private helper it calls. */
function invalidations(fn: Fn, helpers: Fn[]): string[] {
  const own = Array.from(fn.body.matchAll(INVALIDATION), m => `${m[1]}.${m[2]}`);
  const viaHelpers = helpers
    .filter(h => h.name !== fn.name && new RegExp(`\\b${h.name}\\(`).test(fn.body))
    .flatMap(h => invalidations(h, []));
  return [...own, ...viaHelpers];
}

describe('the workout session cluster invalidates exactly what the table says', () => {
  const all = SOURCES.flatMap(file => topLevelFunctions(readFileSync(join(HOOKS, file), 'utf8')));
  const helpers = all.filter(fn => !fn.exported);
  const byName = new Map(all.filter(fn => fn.exported).map(fn => [fn.name, fn]));

  it.each(Object.entries(EXPECTED))('%s', (name, expected) => {
    const fn = byName.get(name);
    expect(fn, `${name} is not exported any more — update the table`).toBeDefined();
    expect(invalidations(fn!, helpers).sort()).toEqual([...expected].sort());
  });

  it('lists every session mutation there is', () => {
    const sessionMutations = Array.from(byName.keys()).filter(
      name =>
        /Session|Set\b|SetMutationOptions$/.test(name) &&
        !/^use(Session|Sessions|Calendar|TodayWorkout)$/.test(name) &&
        !name.startsWith('is') &&
        !name.startsWith('next') &&
        !name.startsWith('persisted')
    );
    const missing = sessionMutations.filter(name => !(name in EXPECTED));
    expect(missing).toEqual([]);
  });
});
