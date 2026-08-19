import { describe, it, expect } from 'vitest';
import {
  BOUNDS,
  inputStep,
  weightUnitLabel,
  heightUnitLabel,
  sanitizeDecimalText,
  parseDecimalText,
  UNIT_OPTIONS,
} from './index';

/**
 * The back-end's conversion factors, duplicated here ON PURPOSE.
 *
 * These constants must never appear in src — ADR-0001 puts all conversion on
 * the server. But a test needs to model the server in order to check that our
 * bounds line up with it, and a test that models the server is not the same
 * thing as an app that converts. If these ever drift from the back-end, this
 * file should fail, which is the entire point.
 */
const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

const toKgFromLbs = (lbs: number) => lbs / LB_PER_KG;
const toCmFromIn = (inches: number) => inches * CM_PER_IN;

/**
 * ProfileUpdateRequest converts to canonical units in prepareForValidation()
 * and only then applies these rules. So they are always in kg/cm, whatever the
 * user typed.
 */
const SERVER_LIMITS = {
  height: { min: 50, max: 300 }, // cm
  weight: { min: 1, max: 500 }, // kg
};

describe('BOUNDS', () => {
  // This is the invariant the profile-schema bug violated. It was not that the
  // numbers were wrong, but that they were applied to a value in the wrong
  // unit — so the check below is what any future edit has to keep true.
  it('every metric bound sits inside the server limits', () => {
    expect(BOUNDS.height.metric.min).toBeGreaterThanOrEqual(SERVER_LIMITS.height.min);
    expect(BOUNDS.height.metric.max).toBeLessThanOrEqual(SERVER_LIMITS.height.max);
    expect(BOUNDS.weight.metric.min).toBeGreaterThanOrEqual(SERVER_LIMITS.weight.min);
    expect(BOUNDS.weight.metric.max).toBeLessThanOrEqual(SERVER_LIMITS.weight.max);
  });

  it('every imperial bound, once converted, sits inside the server limits', () => {
    expect(toCmFromIn(BOUNDS.height.imperial.min)).toBeGreaterThanOrEqual(SERVER_LIMITS.height.min);
    expect(toCmFromIn(BOUNDS.height.imperial.max)).toBeLessThanOrEqual(SERVER_LIMITS.height.max);
    expect(toKgFromLbs(BOUNDS.weight.imperial.min)).toBeGreaterThanOrEqual(SERVER_LIMITS.weight.min);
    expect(toKgFromLbs(BOUNDS.weight.imperial.max)).toBeLessThanOrEqual(SERVER_LIMITS.weight.max);
  });

  // Metric and imperial should admit the same real-world people. If they drift,
  // a user switching units gets told their own saved height is invalid.
  it('the two systems describe the same range of real measurements', () => {
    expect(toCmFromIn(BOUNDS.height.imperial.min)).toBeCloseTo(BOUNDS.height.metric.min, -1);
    expect(toCmFromIn(BOUNDS.height.imperial.max)).toBeCloseTo(BOUNDS.height.metric.max, -1);
    expect(toKgFromLbs(BOUNDS.weight.imperial.min)).toBeCloseTo(BOUNDS.weight.metric.min, -1);
    expect(toKgFromLbs(BOUNDS.weight.imperial.max)).toBeCloseTo(BOUNDS.weight.metric.max, -1);
  });

  it('labels each bound with the unit it is expressed in', () => {
    expect(BOUNDS.height.metric.unit).toBe('cm');
    expect(BOUNDS.height.imperial.unit).toBe('in');
    expect(BOUNDS.weight.metric.unit).toBe('kg');
    expect(BOUNDS.weight.imperial.unit).toBe('lbs');
  });
});

describe('inputStep', () => {
  it('lets metric weights carry decimals, because the server stores them unrounded', () => {
    expect(inputStep('body_weight', 'metric')).toBeLessThan(1);
    expect(inputStep('training_weight', 'metric')).toBeLessThan(1);
  });

  it('matches the half-pound the server shows an imperial body weight to', () => {
    expect(inputStep('body_weight', 'imperial')).toBe(0.5);
  });

  // Imperial training weight is DISPLAYED to the nearest 5 lbs, but the input
  // must not force that: hardcoding the server's rounding rule on the client is
  // exactly what ADR-0001 forbids.
  it('does not hardcode the 5 lb training-weight rounding rule', () => {
    expect(inputStep('training_weight', 'imperial')).not.toBe(5);
    expect(inputStep('training_weight', 'imperial')).toBeLessThan(1);
  });

  it('keeps height whole in both systems', () => {
    expect(inputStep('height', 'metric')).toBe(1);
    expect(inputStep('height', 'imperial')).toBe(1);
  });
});

describe('unit labels', () => {
  it('maps each system to its units', () => {
    expect(weightUnitLabel('metric')).toBe('kg');
    expect(weightUnitLabel('imperial')).toBe('lbs');
    expect(heightUnitLabel('metric')).toBe('cm');
    expect(heightUnitLabel('imperial')).toBe('in');
  });

  // Components call these before the profile has loaded.
  it('falls back to metric when the system is missing', () => {
    expect(weightUnitLabel(undefined)).toBe('kg');
    expect(weightUnitLabel(null)).toBe('kg');
    expect(heightUnitLabel(undefined)).toBe('cm');
    expect(heightUnitLabel(null)).toBe('cm');
  });
});

describe('UNIT_OPTIONS', () => {
  it('offers exactly the two systems, once each', () => {
    expect(UNIT_OPTIONS.map(o => o.value)).toEqual(['metric', 'imperial']);
  });

  it('gives every option something to render', () => {
    for (const option of UNIT_OPTIONS) {
      expect(option.label).not.toBe('');
      expect(option.hint).not.toBe('');
    }
  });
});

describe('sanitizeDecimalText', () => {
  // The bug this exists for: on a de/fr/nl keyboard the decimal key emits ','
  // and parseFloat('154,5') returns 154 — a silent truncation, not a NaN that
  // any validation would catch.
  it('reads a comma as a decimal point', () => {
    expect(sanitizeDecimalText('154,5')).toBe('154.5');
  });

  it('never silently truncates a comma decimal', () => {
    expect(parseDecimalText(sanitizeDecimalText('154,5'))).toBe(154.5);
    expect(parseDecimalText(sanitizeDecimalText('154,5'))).not.toBe(154);
  });

  it('keeps text that is still being typed', () => {
    expect(sanitizeDecimalText('154.')).toBe('154.');
    expect(sanitizeDecimalText('')).toBe('');
  });

  it('keeps only the first decimal point', () => {
    expect(sanitizeDecimalText('1.2.3')).toBe('1.23');
    expect(sanitizeDecimalText('1,2,3')).toBe('1.23');
  });

  it('drops anything that is not a digit or a point', () => {
    expect(sanitizeDecimalText('82.5kg')).toBe('82.5');
    expect(sanitizeDecimalText('-12')).toBe('12');
    expect(sanitizeDecimalText('abc')).toBe('');
  });

  it('is idempotent, so re-sanitising on every keystroke is safe', () => {
    for (const input of ['154,5', '1.2.3', '82.5kg', '154.', '', 'abc']) {
      const once = sanitizeDecimalText(input);
      expect(sanitizeDecimalText(once)).toBe(once);
    }
  });
});

describe('parseDecimalText', () => {
  it('returns null rather than NaN for anything unparseable', () => {
    expect(parseDecimalText('')).toBeNull();
    expect(parseDecimalText('abc')).toBeNull();
    expect(parseDecimalText('.')).toBeNull();
  });

  it('parses a mid-typed decimal', () => {
    expect(parseDecimalText('154.')).toBe(154);
  });

  it('preserves the precision the server keeps', () => {
    expect(parseDecimalText('82.55')).toBe(82.55);
    expect(parseDecimalText('183.5')).toBe(183.5);
  });
});
