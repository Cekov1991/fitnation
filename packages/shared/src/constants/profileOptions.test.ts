import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FITNESS_GOAL_OPTIONS, TRAINING_DAYS_OPTIONS, TRAINING_EXPERIENCE_OPTIONS, WORKOUT_DURATION_OPTIONS, durationOptionFor, labelFor } from './profileOptions';

describe('profile option tables', () => {
  it('cover every enum value exactly once', () => {
    expect(FITNESS_GOAL_OPTIONS.map(o => o.value).sort()).toEqual(['fat_loss', 'general_fitness', 'muscle_gain', 'strength']);
    expect(TRAINING_EXPERIENCE_OPTIONS.map(o => o.value)).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(TRAINING_DAYS_OPTIONS.map(o => o.value)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('durations ascend and send the higher end of each range', () => {
    const values = WORKOUT_DURATION_OPTIONS.map(o => o.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(durationOptionFor(40)?.value).toBe(45);
    expect(durationOptionFor(120)?.value).toBe(120);
    expect(durationOptionFor(500)?.value).toBe(120);
    expect(durationOptionFor(null)).toBeUndefined();
  });

  it('labels a stored value, and falls back to the value itself', () => {
    expect(labelFor(FITNESS_GOAL_OPTIONS, 'muscle_gain')).toBe('Muscle Gain');
    expect(labelFor(TRAINING_DAYS_OPTIONS, 1)).toBe('1 day');
    expect(labelFor(TRAINING_EXPERIENCE_OPTIONS, undefined)).toBe('');
  });
});

/** The eight local copies are gone; a new one fails here. */
describe('no app keeps its own option table', () => {
  const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
  const ROOTS = [join(REPO, 'apps', 'web', 'src'), join(REPO, 'apps', 'mobile', 'src')];
  const LOCAL_TABLE = /'20-30 min'|label: 'Fat Loss'|label: 'Muscle Gain'|>Beginner \(0-1 years\)</;
  function files(dir: string): string[] {
    let out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out = out.concat(files(full));
      else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full);
    }
    return out;
  }
  it('finds none', () => {
    const offenders = ROOTS.flatMap(files).filter(f => LOCAL_TABLE.test(readFileSync(f, 'utf8'))).map(f => relative(REPO, f));
    expect(offenders).toEqual([]);
  });
});
