import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

/**
 * Compile-time half of the registry's acceptance: a misspelled or wrong-shaped
 * key is a tsc error. Vitest does not typecheck, so this file's job is done by
 * `pnpm typecheck` — each `@ts-expect-error` below is itself an assertion that
 * the line fails to compile, and it turns into an error if that ever stops
 * being true. The runtime `it` only keeps vitest from complaining about an
 * empty file.
 */

// Never called — these lines exist to be typechecked, not run.
export function wrongShapesDoNotCompile() {
  // @ts-expect-error — no such domain
  queryKeys.sesions;
  // @ts-expect-error — no such key
  queryKeys.sessions.detials(1);
  // @ts-expect-error — a session id is a number
  queryKeys.sessions.detail('3');
  // @ts-expect-error — a calendar range is two date strings
  queryKeys.sessions.calendar('2026-08-25');
  // @ts-expect-error — the body region is one of three literals
  queryKeys.taxonomy.muscleGroups('arms');
}

describe('query key shapes', () => {
  it('are checked by the compiler, not at runtime', () => {
    expect(queryKeys.sessions.detail(3)).toEqual(['sessions', 3]);
  });
});
