import type { Outcome } from './outcome';

/**
 * Start a library Program: clone it into the user's programs, then activate
 * the clone. If the activate fails, the clone is deleted again so no inactive
 * orphan sits in the user's list; if the clone returns no id, nothing is
 * reported as done.
 */
export interface StartLibraryProgramDeps {
  cloneProgram: (programId: number) => Promise<{ id: number } | null | undefined>;
  activateProgram: (programId: number) => Promise<unknown>;
  /** Compensation for a failed activate. Optional: without it the orphan is reported, not removed. */
  deleteProgram?: (programId: number) => Promise<unknown>;
}

export type StartLibraryProgramOutcome = Outcome<'clone' | 'activate', { clonedId: number }>;

export async function startLibraryProgram(deps: StartLibraryProgramDeps, input: { programId: number }): Promise<StartLibraryProgramOutcome> {
  let clonedId: number;
  try {
    const clone = await deps.cloneProgram(input.programId);
    if (clone?.id == null) {
      return { ok: false, failed: 'clone', error: new Error('The clone returned no program id.'), compensated: true };
    }
    clonedId = clone.id;
  } catch (error) {
    return { ok: false, failed: 'clone', error, compensated: true };
  }

  try {
    await deps.activateProgram(clonedId);
  } catch (error) {
    let compensated = false;
    if (deps.deleteProgram) {
      try {
        await deps.deleteProgram(clonedId);
        compensated = true;
      } catch {
        // The orphan stays; the outcome names it.
      }
    }
    return { ok: false, failed: 'activate', error, compensated, clonedId };
  }

  return { ok: true, clonedId };
}
