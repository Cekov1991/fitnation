import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The web counterpart of mobile's guard for spec 0002, added with the web toast
 * (0031 #1) to close the error-surfacing half of 0014.
 *
 * Every mutation in the live-session hook used to swallow its error into
 * `console.error`, and the only user-facing failure messaging was two bare
 * `alert()` calls. The rule pinned here: every `catch` in the hook tells the
 * user something, and nothing in it calls `alert`. A catch that deliberately
 * recovers in silence opts out with a `user-feedback:` comment saying how the
 * user finds out instead.
 *
 * A source scan, because the hook is not reachable from the node-environment
 * test setup, and the regression being guarded (a new silent catch) is textual.
 */

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'useWorkoutSessionState.ts');

const SURFACES_TO_USER = /\bshowToast\(/;
const DELIBERATE_SILENCE = /user-feedback:/;

/** The user-facing half of each catch. Wording follows mobile's 0002 table. */
const REQUIRED_MESSAGES = [
  "Couldn't save that set. Check your connection and try again.",
  "Couldn't update the set.",
  "Couldn't change the number of sets.",
  "Couldn't add that exercise.",
  "Couldn't swap that exercise. Nothing was changed.",
  "Couldn't remove that exercise.",
  "Couldn't finish the workout. Your sets are saved — try again.",
  "Couldn't cancel the workout.",
  'Remove the exercise instead of the last set.',
  'The workout needs at least one exercise.',
];

/** Bodies of every `catch` clause, brace-counted. See the mobile guard for why. */
function catchBodies(source: string): string[] {
  const bodies: string[] = [];
  const re = /\}\s*catch\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const open = source.indexOf('{', match.index + match[0].length);
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

describe('workout session mutation failures reach the user (web)', () => {
  const source = readFileSync(HOOK, 'utf8');

  it('still has catch blocks to check', () => {
    expect(catchBodies(source).length).toBeGreaterThanOrEqual(9);
  });

  it('never fails a mutation in silence', () => {
    const silent = catchBodies(source).filter(
      body => !SURFACES_TO_USER.test(body) && !DELIBERATE_SILENCE.test(body)
    );
    expect(silent).toEqual([]);
  });

  it('uses the spec wording for each failure', () => {
    const missing = REQUIRED_MESSAGES.filter(message => !source.includes(message));
    expect(missing).toEqual([]);
  });

  it('has no alert() left', () => {
    expect(source).not.toMatch(/\balert\(/);
  });
});
