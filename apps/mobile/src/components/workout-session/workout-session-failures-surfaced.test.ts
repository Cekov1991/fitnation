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
 * The rule this pins is the spec's acceptance line — no `catch` in these three
 * files logs without also showing the user something. It is a source scan
 * rather than a render test because none of this is reachable from the current
 * node-environment test setup, and the failure mode being guarded (someone adds
 * a thirteenth silent catch) is textual anyway.
 */

const MOBILE_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SOURCES = [
  'screens/placeholders/WorkoutSessionScreen.tsx',
  'components/workout-session/ExercisePage.tsx',
  'screens/placeholders/WorkoutPreviewScreen.tsx',
];

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
 * Bodies of every `catch` in `source`. Brace-counted rather than parsed: these
 * bodies are a handful of lines of calls and string literals, none of which
 * carry a brace, and a mis-parse shows up as a failing test rather than a
 * silent pass.
 */
function catchBodies(source: string): string[] {
  const bodies: string[] = [];
  const re = /\bcatch\b/g;
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
    expect(catchBodies(read(rel)).length).toBeGreaterThanOrEqual(4);
  });

  it.each(SOURCES)('%s never logs a failure without showing one', rel => {
    const silent = catchBodies(read(rel)).filter(
      body => body.includes('console.error') && !body.includes('showToast')
    );

    expect(silent).toEqual([]);
  });

  it.each(SOURCES)('%s uses the spec wording for each failure', rel => {
    const source = read(rel);
    const missing = REQUIRED_MESSAGES[rel].filter(message => !source.includes(message));

    expect(missing).toEqual([]);
  });
});
