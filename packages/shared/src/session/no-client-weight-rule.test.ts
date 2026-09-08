import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0015.
 *
 * Whether an exercise takes a logged weight is the server's to say
 * (`equipment_type.supports_added_weight`); the clients read the flag through
 * `allowsWeightLogging`. Five client copies of the rule existed before, and they
 * disagreed about TRX. A new one — any equipment code compared by hand in app
 * source — fails here.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const APP_ROOTS = [join(REPO_ROOT, 'apps', 'web', 'src'), join(REPO_ROOT, 'apps', 'mobile', 'src')];
const EQUIPMENT_RULE = /['"](BODYWEIGHT|TRX|BAND)['"]/;

function sourceFiles(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(sourceFiles(full));
    else if (/\.tsx?$/.test(full) && !/\.test\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

describe('no client decides whether an exercise takes a weight', () => {
  const files = APP_ROOTS.flatMap(sourceFiles);

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('no app source compares an equipment code by hand', () => {
    const offenders = files.filter(f => EQUIPMENT_RULE.test(readFileSync(f, 'utf8'))).map(f => relative(REPO_ROOT, f));
    expect(offenders).toEqual([]);
  });
});
