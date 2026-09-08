#!/usr/bin/env node
// The typecheck ratchet (spec 0022, option a).
//
// `pnpm typecheck` is red on main and has been for a while — nothing ran it.
// Rather than block CI until every pre-existing error is fixed, each workspace
// is held to the error count recorded in typecheck-baseline.json: a count
// above its baseline fails, a count below it prints a nudge to lower the
// baseline. `--update` rewrites the baseline from the current counts.
//
// Counts `error TS` lines from `tsc --noEmit`, run per workspace so that
// packages/shared and packages/legal are checked directly, at their own
// strictness, instead of transitively at whichever app's happens to apply.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = join(ROOT, 'typecheck-baseline.json');

export const WORKSPACES = ['web', 'mobile', 'landing', '@fit-nation/shared', '@fit-nation/legal'];

export function countErrors(tscOutput) {
  return (tscOutput.match(/error TS\d+:/g) ?? []).length;
}

/**
 * Pure comparison so the rule can be tested without running tsc: every
 * workspace needs a baseline, none may exceed it, and dropping below it is
 * reported so the baseline gets lowered rather than quietly wasted.
 */
export function compare(counts, baseline) {
  const failures = [];
  const improvements = [];
  for (const [workspace, count] of Object.entries(counts)) {
    const allowed = baseline[workspace];
    if (allowed === undefined) {
      failures.push(`${workspace}: ${count} error(s) and no baseline — run pnpm typecheck:baseline`);
    } else if (count > allowed) {
      failures.push(`${workspace}: ${count} error(s), baseline allows ${allowed}`);
    } else if (count < allowed) {
      improvements.push(`${workspace}: ${count} error(s), baseline allows ${allowed} — lower it`);
    }
  }
  return { ok: failures.length === 0, failures, improvements };
}

function typecheck(workspace) {
  const result = spawnSync('pnpm', ['--filter', workspace, 'typecheck'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return countErrors(`${result.stdout ?? ''}${result.stderr ?? ''}`);
}

function main() {
  const counts = {};
  for (const workspace of WORKSPACES) {
    counts[workspace] = typecheck(workspace);
    console.log(`${workspace}: ${counts[workspace]} error(s)`);
  }

  if (process.argv.includes('--update')) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(counts, null, 2)}\n`);
    console.log(`baseline written to ${BASELINE_PATH}`);
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const { ok, failures, improvements } = compare(counts, baseline);
  for (const line of improvements) console.log(`↓ ${line}`);
  for (const line of failures) console.error(`✗ ${line}`);
  console.log(ok ? 'typecheck ratchet: no new errors' : 'typecheck ratchet: FAILED');
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
