import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0002.
 *
 * Every mutation in the live-session and preview flows used to swallow its
 * error into `console.error`. On a device with no console attached that is
 * indistinguishable from success: the spinner stops and nothing changes.
 *
 * The rule this pins is the spec's acceptance line, one notch stronger than it
 * is written: every `catch` in these three files tells the user something.
 * Keying off `console.error` instead — "no catch logs without also showing" —
 * would let a catch doing neither through, which is the worse of the two, and
 * would let anyone green the test by deleting the log rather than adding the
 * toast.
 *
 * A catch that deliberately recovers in silence opts out with a
 * `user-feedback:` comment saying how the user finds out instead. That keeps
 * the exemption in the catch itself, where the next person reads it.
 *
 * It is a source scan rather than a render test because none of this is
 * reachable from the current node-environment test setup, and the failure mode
 * being guarded (someone adds a fourteenth silent catch) is textual anyway.
 */

const MOBILE_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SOURCES = [
  'screens/placeholders/WorkoutSessionScreen.tsx',
  'components/workout-session/ExercisePage.tsx',
  'screens/placeholders/WorkoutPreviewScreen.tsx',
];

/**
 * How a catch is allowed to reach the user: a toast, or the preview edit
 * modal's inline error — inline because that modal stays open on failure to
 * keep the typed targets, and a toast under a native Modal is invisible.
 */
const SURFACES_TO_USER = /\bshowToast\(|\bsetEditError\(/;

/** Opt-out for a catch that recovers visibly on its own. */
const DELIBERATE_SILENCE = /user-feedback:/;

/** The user-facing half of each catch, per the spec's message table. */
const REQUIRED_MESSAGES: Record<string, string[]> = {
  'screens/placeholders/WorkoutSessionScreen.tsx': [
    "Couldn't remove that exercise.",
    "Couldn't finish the workout. Your sets are saved — try again.",
    "Couldn't cancel the workout.",
  ],
  'components/workout-session/ExercisePage.tsx': [
    "Couldn't save that set. Check your connection and try again.",
    "Couldn't update the set.",
    "Couldn't change the number of sets.",
  ],
  'screens/placeholders/WorkoutPreviewScreen.tsx': [
    "Couldn't start the workout.",
    "Couldn't generate a new workout.",
    "Couldn't cancel the workout.",
    "Couldn't remove that exercise.",
    "Couldn't update the exercise.",
  ],
};

/**
 * Bodies of every `catch` clause in `source`. Anchored to the closing brace of
 * the `try` so a `.catch(` chain or the word in a comment is not mistaken for
 * one — those would hand back whatever `{` came next, which in a .tsx file is
 * usually a style object. Brace-counted rather than parsed: these bodies are a
 * handful of lines of calls and string literals, none of which carry a brace,
 * and a mis-parse shows up as a failing test rather than a silent pass.
 */
function catchBodies(source: string): string[] {
  const bodies: string[] = [];
  const re = /\}\s*catch\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const open = source.indexOf('{', match.index);
    if (open === -1) continue;
    let depth = 0;
    for (let i = open; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') {
        depth--;
        if (depth === 0) {
          bodies.push(source.slice(open + 1, i));
          break;
        }
      }
    }
  }
  return bodies;
}

describe('workout session mutation failures reach the user', () => {
  const read = (rel: string) => readFileSync(join(MOBILE_SRC, rel), 'utf8');

  it.each(SOURCES)('%s still has catch blocks to check', rel => {
    // Guards against the scan silently covering nothing and passing forever.
    expect(catchBodies(read(rel)).length).toBeGreaterThanOrEqual(3);
  });

  it.each(SOURCES)('%s never fails a mutation in silence', rel => {
    const silent = catchBodies(read(rel)).filter(
      body => !SURFACES_TO_USER.test(body) && !DELIBERATE_SILENCE.test(body)
    );

    expect(silent).toEqual([]);
  });

  it.each(SOURCES)('%s uses the spec wording for each failure', rel => {
    const source = read(rel);
    const missing = REQUIRED_MESSAGES[rel].filter(message => !source.includes(message));

    expect(missing).toEqual([]);
  });
});
