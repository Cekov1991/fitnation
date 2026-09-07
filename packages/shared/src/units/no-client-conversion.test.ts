import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard.
 *
 * ADR-0001: the back-end converts at the HTTP boundary and the front-end holds
 * no conversion math at all. That is easy to state and easy to erode — someone
 * adds "just one" kg-to-lbs helper for a chart label, and now two places decide
 * the same fact and they drift.
 *
 * This test fails if a conversion factor or a conversion-shaped function name
 * appears anywhere in front-end source. It is the only thing standing between
 * that rule and good intentions.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

const SEARCH_ROOTS = [
  join(REPO_ROOT, 'apps', 'web', 'src'),
  join(REPO_ROOT, 'apps', 'mobile', 'src'),
  join(REPO_ROOT, 'packages', 'shared', 'src'),
  join(REPO_ROOT, 'apps', 'landing_page', 'src'),
];

// Tests are allowed to model the server; source is not.
const isTestFile = (path: string) => /\.test\.ts$/.test(path);

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /2\.2046/, why: 'kg → lbs factor' },
  { pattern: /2\.205(?![0-9])/, why: 'kg → lbs factor (rounded)' },
  { pattern: /0\.4536/, why: 'lbs → kg factor' },
  { pattern: /\b2\.54\b/, why: 'in → cm factor' },
  { pattern: /\bto(Kg|Lbs|Cm|Inches)\b/, why: 'conversion helper' },
  { pattern: /\bconvert(Weight|Height|Units?)\b/, why: 'conversion helper' },
  { pattern: /0\.4535/, why: 'lbs → kg factor (long form)' },
  { pattern: /\b(lbs|pounds?|kgs?|kilos?|kilograms?)To(Kgs?|Kilos?|Kilograms?|Lbs|Pounds?)\b/i, why: 'conversion helper (spelled out)' },
];

/**
 * Display formatting has one home too (0027). Five `formatWeight`s and six
 * `formatDate`s is how the module above got its reason to exist; a new local
 * copy is the same drift starting over. The two Reanimated worklets on mobile
 * (`formatTime` in RestTimer, `formatElapsed` in SessionClock) are the named
 * exception — a worklet cannot call a JS-thread function — and mirror the
 * shared `formatRestCountdown` / `formatClock`.
 */
const LOCAL_FORMATTER = /\b(?:function|const)\s+(format(?:Weight|Volume(?:Full)?|Duration|Date(?:ForDisplay)?|DayHeading|Progress|Clock|Change))\b/;
const UNITS_DIR = join(REPO_ROOT, 'packages', 'shared', 'src', 'units');

function sourceFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out = out.concat(sourceFiles(full));
    } else if (/\.tsx?$/.test(full) && !isTestFile(full)) {
      out.push(full);
    }
  }
  return out;
}

describe('no client-side unit conversion', () => {
  const files = SEARCH_ROOTS.flatMap(sourceFiles);

  it('finds source files to check', () => {
    // Guards against the search silently covering nothing and passing forever.
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(FORBIDDEN)('no source file contains a $why', ({ pattern }) => {
    const offenders = files
      .filter(f => pattern.test(readFileSync(f, 'utf8')))
      .map(f => relative(REPO_ROOT, f));

    expect(offenders).toEqual([]);
  });

  it('no source file outside the units module defines its own display formatter', () => {
    const offenders = files
      .filter(f => !f.startsWith(UNITS_DIR))
      .filter(f => LOCAL_FORMATTER.test(readFileSync(f, 'utf8')))
      .map(f => `${relative(REPO_ROOT, f)}: ${readFileSync(f, 'utf8').match(LOCAL_FORMATTER)![1]}`);

    expect(offenders).toEqual([]);
  });
});
