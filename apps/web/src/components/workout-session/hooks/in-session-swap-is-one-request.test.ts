import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0014.
 *
 * Swapping an exercise mid-session used to be remove → add → refetch → reorder,
 * four writes with no rollback: a failure after the remove lost the exercise
 * and its logged sets outright. The swap endpoint changes `exercise_id` on the
 * existing row and nothing else, so the fix is a single request — and the rule
 * pinned here is exactly that: the swap branch issues one mutation, the swap.
 *
 * A source scan, like mobile's guard for 0002, because the hook is not
 * reachable from the node-environment test setup, and the regression being
 * guarded (someone reintroduces a second write) is textual anyway.
 */

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'useWorkoutSessionState.ts');

function swapBranch(source: string): string {
  const start = source.indexOf("exercisePickerMode === 'swap'");
  const end = source.indexOf('const handleRemoveExercise', start);
  if (start === -1 || end === -1) throw new Error('swap branch not found');
  return source.slice(start, end);
}

describe('the in-session exercise swap', () => {
  const source = readFileSync(HOOK, 'utf8');
  const branch = swapBranch(source);

  it('issues exactly one request, and it is the swap', () => {
    const calls = branch.match(/\b\w+\.mutateAsync\(/g) ?? [];
    expect(calls).toEqual(['swapSessionExercise.mutateAsync(']);
  });

  it('never went back to the remove/add/refetch/reorder sequence', () => {
    expect(source).not.toMatch(/reorderSessionExercises|refetchQueries/);
    expect(branch).not.toMatch(/removeSessionExercise|addSessionExercise/);
  });
});
