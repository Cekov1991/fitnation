import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain ESM script, no declaration file; vitest runs it as-is.
import { compare, countErrors, WORKSPACES } from './typecheck-ratchet.mjs';

describe('typecheck ratchet', () => {
  it('counts one per tsc error line, not per mention', () => {
    const output = [
      "src/a.ts(1,1): error TS6133: 'x' is declared but its value is never read.",
      "src/b.ts(2,2): error TS2339: Property 'env' does not exist on type 'ImportMeta'.",
      'Found 2 errors in 2 files.',
    ].join('\n');
    expect(countErrors(output)).toBe(2);
    expect(countErrors('')).toBe(0);
  });

  it('passes when every workspace is at or under its baseline', () => {
    const result = compare({ web: 45, mobile: 36 }, { web: 45, mobile: 36 });
    expect(result).toEqual({ ok: true, failures: [], improvements: [] });
  });

  it('fails on a single new error', () => {
    const result = compare({ web: 46 }, { web: 45 });
    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(['web: 46 error(s), baseline allows 45']);
  });

  it('fails a workspace with no baseline, so a new workspace cannot slip in unchecked', () => {
    const result = compare({ '@fit-nation/legal': 0 }, {});
    expect(result.ok).toBe(false);
    expect(result.failures[0]).toMatch(/no baseline/);
  });

  it('reports an improvement without failing, so the baseline gets lowered', () => {
    const result = compare({ web: 40 }, { web: 45 });
    expect(result.ok).toBe(true);
    expect(result.improvements).toEqual(['web: 40 error(s), baseline allows 45 — lower it']);
  });

  it('covers all five workspaces', () => {
    expect(WORKSPACES).toEqual(['web', 'mobile', 'landing', '@fit-nation/shared', '@fit-nation/legal']);
  });
});
