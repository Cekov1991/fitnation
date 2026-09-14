import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for the exercise-row standard.
 *
 * Seven screens each drew their own "thumbnail + name + meta" row and drifted
 * apart: 52/56/64px pictures, 14/16/17px names, three different empty-state
 * placeholders. The fix is one component, `ExerciseRow`, and this test is what
 * keeps the eighth copy from appearing.
 *
 * The rule: outside `ExerciseRow.tsx`, no file renders an <Image> whose source
 * is an exercise thumbnail — a `uri` ending in `.image` or `.imageUrl`. Cover
 * images (`.cover_image`), muscle-group diagrams, partner logos and the live
 * session's tab strip have other field names and are not exercise rows.
 *
 * The two detail screens are allowed: their picture is a full-width hero, not
 * a row. Anything else that needs an exercise thumbnail renders <ExerciseRow>.
 *
 * It is a source scan rather than a render test because no `.tsx` is
 * reachable from the node-environment test setup, and the failure being
 * guarded (someone pastes the markup again) is textual anyway.
 */

const MOBILE_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ALLOWED = new Set([
  'components/exercises/ExerciseRow.tsx',
  'screens/placeholders/ExerciseDetailScreen.tsx',
  'screens/placeholders/WorkoutSessionExerciseDetailScreen.tsx',
]);

/** An <Image> tag's `source={{ uri: <expr> }}`, captured expression. */
const IMAGE_URI = /<Image\b[^>]*?source=\{\{\s*uri:\s*([^}]+?)\s*\}\}/g;
/** The expression names an exercise thumbnail. */
const EXERCISE_THUMB = /\.(image|imageUrl)$/;

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...tsxFiles(path));
    else if (entry.endsWith('.tsx')) out.push(path);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

describe('exercise-row standard', () => {
  it('renders every exercise thumbnail through ExerciseRow', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(MOBILE_SRC)) {
      const rel = relative(MOBILE_SRC, file);
      if (ALLOWED.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(IMAGE_URI)) {
        if (EXERCISE_THUMB.test(match[1].trim())) {
          offenders.push(`${rel}:${lineOf(source, match.index ?? 0)} — ${match[1].trim()}`);
        }
      }
    }
    expect(
      offenders,
      `Exercise thumbnails are drawn only by <ExerciseRow> (components/exercises/ExerciseRow.tsx). Replace these:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('uses the Dumbbell placeholder, never the emoji', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(MOBILE_SRC)) {
      const source = readFileSync(file, 'utf8');
      const index = source.indexOf('💪');
      if (index !== -1) offenders.push(`${relative(MOBILE_SRC, file)}:${lineOf(source, index)}`);
    }
    expect(offenders, 'ExerciseRow already draws the empty-thumbnail state').toEqual([]);
  });
});
