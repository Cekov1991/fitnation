import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The structural guard for spec 0025: every API method declares what it
 * returns. Nine of seventy-nine did; the rest handed `any` to every hook.
 */
const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'api.ts'), 'utf8');

/** `name: async (...params...) => {` — joined across lines up to the arrow. */
function methodSignatures(src: string): { name: string; signature: string }[] {
  const out: { name: string; signature: string }[] = [];
  const re = /^\s+(\w+): async \(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const arrow = src.indexOf('=>', m.index);
    out.push({ name: m[1], signature: src.slice(m.index, arrow) });
  }
  return out;
}

describe('the API layer is typed', () => {
  const methods = methodSignatures(source);

  it('still finds the methods', () => {
    expect(methods.length).toBeGreaterThan(70);
  });

  it('every method declares a Promise return type', () => {
    const untyped = methods.filter(m => !/\): Promise</.test(m.signature)).map(m => m.name);
    expect(untyped).toEqual([]);
  });

  it('no method returns any', () => {
    expect(source).not.toMatch(/Promise<any>/);
    expect(source).not.toMatch(/: any\b/);
  });
});
