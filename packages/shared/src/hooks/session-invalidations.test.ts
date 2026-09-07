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
 * visible. The table below is that choice, written down once. A hook that
 * starts invalidating more or less than listed fails here, so the change is a
 * decision in a diff rather than an accident in a cache.
 *
 * `sessions.all()` covers detail, today and every calendar range by prefix, so
 * a hook that lists it does not also list those — that redundancy was removed
 * when the registry landed.
 */

const HOOKS = join(dirname(fileURLToPath(import.meta.url)));

const EXPECTED: Record<string, string[]> = {
  // useApi.ts
  useStartSession: ['sessions.all'], // seeds sessions.detail via setQueryData, not by invalidating
  useGenerateDraftSession: ['sessions.all'],
  useRegenerateDraftSession: ['sessions.all'],
  useConfirmDraftSession: ['sessions.detail', 'sessions.today'],
  useCompleteSession: ['sessions.all', 'programs.all', 'exercises.all', 'fitnessMetrics.all'],
  useCancelSession: ['sessions.all', 'programs.all'],
  useDeleteSet: ['sessions.detail', 'exercises.histories'],
  useLogSet: [], // delegates to logSetMutationOptions
  useUpdateSet: [], // delegates to updateSetMutationOptions
  useAddSessionExercise: ['sessions.detail'],
  useUpdateSessionExercise: ['sessions.detail'],
  useSwapSessionExercise: ['sessions.detail'],
  useRemoveSessionExercise: ['sessions.detail'],
  useReorderSessionExercises: ['sessions.detail'],
  // setLogMutations.ts
  logSetMutationOptions: ['sessions.detail', 'exercises.histories'],
  updateSetMutationOptions: ['sessions.detail', 'exercises.histories', 'exercises.all'],
};

/** Each `export function name(...)` and its body, up to the next export. */
function exportedFunctions(source: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /^export function (\w+)\(/gm;
  const starts = Array.from(source.matchAll(re), m => ({ name: m[1], index: m.index! }));
  starts.forEach((s, i) => {
    out.set(s.name, source.slice(s.index, starts[i + 1]?.index ?? source.length));
  });
  return out;
}

function invalidations(body: string): string[] {
  const re = /invalidateQueries\(\{\s*queryKey:\s*queryKeys\.(\w+)\.(\w+)\(/g;
  return Array.from(body.matchAll(re), m => `${m[1]}.${m[2]}`);
}

describe('the workout session cluster invalidates exactly what the table says', () => {
  const functions = new Map([
    ...exportedFunctions(readFileSync(join(HOOKS, 'useApi.ts'), 'utf8')),
    ...exportedFunctions(readFileSync(join(HOOKS, 'setLogMutations.ts'), 'utf8')),
  ]);

  it.each(Object.entries(EXPECTED))('%s', (name, expected) => {
    const body = functions.get(name);
    expect(body, `${name} is not exported any more — update the table`).toBeDefined();
    expect(invalidations(body!).sort()).toEqual([...expected].sort());
  });

  it('lists every session mutation there is', () => {
    const sessionMutations = Array.from(functions.keys()).filter(
      name => /Session|Set\b|SetMutationOptions/.test(name) && !/^use(Session|Sessions|Calendar|TodayWorkout)$/.test(name) && !name.startsWith('is') && !name.startsWith('next')
    );
    const missing = sessionMutations.filter(name => !(name in EXPECTED));
    expect(missing).toEqual([]);
  });
});
