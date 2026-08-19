import { describe, it, expect } from 'vitest';
import { createProfileSchema } from './profile';
import { BOUNDS } from '../units';
import type { UnitSystem } from '../types/api';

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  fitness_goal: 'strength' as const,
  age: 30,
  gender: 'other' as const,
  height: 175,
  weight: 82,
  training_experience: 'intermediate' as const,
  training_days_per_week: 4,
  workout_duration_minutes: 60,
};

const parseWith = (system: UnitSystem, overrides: Record<string, unknown>) =>
  createProfileSchema(system).safeParse({ ...valid, ...overrides });

const errorFor = (result: ReturnType<typeof parseWith>, field: string) =>
  result.success ? undefined : result.error.issues.find(i => i.path[0] === field)?.message;

describe('createProfileSchema — the bug it was written for', () => {
  // Before the fix the schema applied the server's canonical limits (weight
  // 1–500 kg) to whatever number the user typed. An imperial user was told 550
  // lbs was invalid — it is 249 kg, comfortably fine — while 1 lb passed the
  // client and was rejected by the server. Onboarding never had the bug, so the
  // same value passed onboarding and then failed on the profile screen.
  it('accepts a heavy but legitimate imperial body weight', () => {
    expect(parseWith('imperial', { height: 69, weight: 550 }).success).toBe(true);
  });

  it('rejects a weight that is only plausible in the other unit', () => {
    // 1 lb would have slipped through the old metric-limits check.
    expect(parseWith('imperial', { height: 69, weight: 1 }).success).toBe(false);
    // 300 in would too — that is 762 cm.
    expect(parseWith('imperial', { height: 300, weight: 154 }).success).toBe(false);
  });

  it('does not reject a metric weight for being under the imperial minimum', () => {
    // 66 lbs is the imperial floor; a 40 kg metric user must not be measured
    // against it.
    expect(parseWith('metric', { weight: 40 }).success).toBe(true);
  });
});

describe.each<UnitSystem>(['metric', 'imperial'])('createProfileSchema — %s bounds', system => {
  const h = BOUNDS.height[system];
  const w = BOUNDS.weight[system];

  it('accepts the exact minimum and maximum', () => {
    expect(parseWith(system, { height: h.min, weight: w.min }).success).toBe(true);
    expect(parseWith(system, { height: h.max, weight: w.max }).success).toBe(true);
  });

  it('rejects just outside the range', () => {
    expect(parseWith(system, { height: h.min - 1 }).success).toBe(false);
    expect(parseWith(system, { height: h.max + 1 }).success).toBe(false);
    expect(parseWith(system, { weight: w.min - 1 }).success).toBe(false);
    expect(parseWith(system, { weight: w.max + 1 }).success).toBe(false);
  });

  // A message naming the wrong unit is how the original bug would have looked
  // to a user, so the unit is asserted rather than just the failure.
  it('names the unit the user is typing in', () => {
    expect(errorFor(parseWith(system, { weight: w.max + 1 }), 'weight')).toContain(w.unit);
    expect(errorFor(parseWith(system, { height: h.max + 1 }), 'height')).toContain(h.unit);
  });

  it('allows height and weight to be absent', () => {
    expect(parseWith(system, { height: null, weight: null }).success).toBe(true);
  });
});

describe('createProfileSchema — numeric coercion', () => {
  // The API returns decimals as strings ("82.50"), so the resolver has to take
  // both. Losing this is how a valid saved weight starts failing validation.
  it('accepts the string form the API returns', () => {
    const result = parseWith('metric', { weight: '82.50', height: '175' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(82.5);
      expect(result.data.height).toBe(175);
    }
  });

  it('treats an emptied field as absent rather than zero', () => {
    const result = parseWith('metric', { weight: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.weight).toBeNull();
  });

  it('applies the bounds to the coerced number, not the string', () => {
    expect(parseWith('metric', { weight: '999' }).success).toBe(false);
  });
});
