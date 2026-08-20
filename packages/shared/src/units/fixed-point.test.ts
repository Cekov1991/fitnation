import { describe, it, expect } from 'vitest';
import { sanitizeDecimalText, parseDecimalText, BOUNDS } from './index';
import { createProfileSchema } from '../schemas/profile';
import type { UnitSystem } from '../types/api';

/**
 * The fixed-point property.
 *
 * From back-end/CONTEXT.md and ADR-0001: writing 137 lbs and reading back 135
 * is CORRECT — a Training Weight is shown to the nearest 5 lbs. What is always
 * a bug is a value that keeps moving. Save, reload, save again unchanged, and
 * the number must settle.
 *
 * The front-end's share of that property is simple: it must not transform a
 * measured value between reading it and writing it back. So these tests push
 * values through every transformation the front-end actually applies and assert
 * the result is stable.
 *
 * The server's rounding is modelled below so the round trip can be simulated.
 * Modelling it in a test is not the same as doing it in the app — the app must
 * never contain this, and a separate test asserts the constants stay out of src.
 */

// Documented display rounding, per Measurement Kind. Metric passes through.
const roundForDisplay = {
  training_weight: (v: number, s: UnitSystem) => (s === 'imperial' ? Math.round(v / 5) * 5 : v),
  body_weight: (v: number, s: UnitSystem) => (s === 'imperial' ? Math.round(v * 2) / 2 : v),
  height: (v: number, s: UnitSystem) => (s === 'imperial' ? Math.round(v) : v),
};

/** What the mobile weight input does to a value on its way back to the server. */
function throughMobileWeightInput(value: number): number | null {
  return parseDecimalText(sanitizeDecimalText(String(value)));
}

/** What the web number inputs do: the browser hands back a string, we parseFloat it. */
function throughWebNumberInput(value: number): number {
  return parseFloat(String(value));
}

describe('the front-end transforms nothing between read and write', () => {
  const samples = [82.5, 82.55, 183.5, 137, 135, 70, 0.5, 249.9, 66, 661];

  it('the mobile weight input round-trips every value unchanged', () => {
    for (const v of samples) {
      expect(throughMobileWeightInput(v)).toBe(v);
    }
  });

  it('the web number input round-trips every value unchanged', () => {
    for (const v of samples) {
      expect(throughWebNumberInput(v)).toBe(v);
    }
  });

  // This is the defect that was found in the web set cards: the display
  // formatter rounded to 1dp and its output was the value of an editable input,
  // so a metric weight was nudged on every save.
  it('a display formatter must not be used on a writable value', () => {
    const displayRound = (w: number) => Math.round(w * 10) / 10;
    const weight = 82.55;
    expect(displayRound(weight)).not.toBe(weight);
    // ...which is precisely why the input holds String(weight) instead.
    expect(throughWebNumberInput(weight)).toBe(weight);
  });
});

/**
 * Every path a measured value can take from the screen back to the server.
 * The settle test runs through each, so a transformation added to one of them
 * cannot hide behind the other.
 */
const INPUT_PATHS = {
  web: throughWebNumberInput,
  mobile: (v: number) => {
    const parsed = throughMobileWeightInput(v);
    if (parsed === null) throw new Error(`mobile input path lost the value ${v}`);
    return parsed;
  },
} as const;

describe.each<UnitSystem>(['metric', 'imperial'])('save → read → save reaches a fixed point (%s)', system => {
  const kinds = ['training_weight', 'body_weight', 'height'] as const;
  const paths = Object.keys(INPUT_PATHS) as (keyof typeof INPUT_PATHS)[];
  const cases = kinds.flatMap(kind => paths.map(path => ({ kind, path })));

  it.each(cases)('$kind settles after one server round trip via the $path input', ({ kind, path }) => {
    const sendBack = INPUT_PATHS[path];
    const start = kind === 'height'
      ? (system === 'imperial' ? 69.4 : 175.4)
      : (system === 'imperial' ? 137.3 : 82.55);

    // First save: the client sends what the user typed, the server rounds it
    // for display, the client shows that back untouched.
    const firstRead = roundForDisplay[kind](start, system);

    // Second save with no edit: the client sends back exactly what it was given.
    const sentAgain = sendBack(firstRead);
    const secondRead = roundForDisplay[kind](sentAgain, system);

    // The value may move once. It must not move twice.
    expect(secondRead).toBe(firstRead);

    // And a third cycle changes nothing either.
    expect(roundForDisplay[kind](sendBack(secondRead), system)).toBe(firstRead);
  });
});

describe('a rounded value stays valid', () => {
  // The failure this guards against: the server rounds a weight to a value the
  // client then refuses to accept, so the user cannot save their own profile.
  it.each<UnitSystem>(['metric', 'imperial'])('%s body weight at both bounds survives rounding', system => {
    const schema = createProfileSchema(system);
    const w = BOUNDS.weight[system];
    const h = BOUNDS.height[system];

    for (const raw of [w.min, w.max, (w.min + w.max) / 2]) {
      const rounded = roundForDisplay.body_weight(raw, system);
      const result = schema.safeParse({
        name: 'Ada',
        email: 'ada@example.com',
        fitness_goal: 'strength',
        age: 30,
        gender: 'other',
        height: roundForDisplay.height(h.min, system),
        weight: rounded,
        training_experience: 'intermediate',
        training_days_per_week: 4,
        workout_duration_minutes: 60,
      });
      expect(result.success).toBe(true);
    }
  });
});
