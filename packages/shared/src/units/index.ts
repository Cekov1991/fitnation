import type { UnitSystem } from '../types/api';

/**
 * Everything that follows from a user's Unit System lives here.
 *
 * The rule this module exists to enforce: exactly one place decides what a
 * Unit System implies. Before it, eighteen components each read
 * `profile.profile.unit_system` and re-derived the label, the input step and
 * the validation bounds for themselves, and those derivations had already
 * drifted apart.
 *
 * Nothing here converts a measurement. The back-end converts at the HTTP
 * boundary (see back-end/docs/adr/0001-convert-units-at-the-http-boundary.md);
 * the front-end sends whatever unit the user is currently in and displays what
 * comes back.
 */

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in';

/**
 * What a Measured Field holds. The kind — not the screen — decides the
 * canonical storage unit, the imperial display step, and the input step.
 * See the Measurement Kind entry in back-end/CONTEXT.md.
 */
export type MeasurementKind = 'training_weight' | 'body_weight' | 'height';

export function weightUnitLabel(unitSystem?: UnitSystem | null): WeightUnit {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

export function heightUnitLabel(unitSystem?: UnitSystem | null): HeightUnit {
  return unitSystem === 'imperial' ? 'in' : 'cm';
}

interface Bound<TUnit extends string> {
  min: number;
  max: number;
  unit: TUnit;
}

/**
 * Client-side validation bounds, expressed in the unit the user types in.
 *
 * INVARIANT: every bound here, once converted to canonical units, must fall
 * strictly inside the server's limits, so the client never accepts a value the
 * server will reject. The server validates *after* converting
 * (ProfileUpdateRequest::prepareForValidation runs before rules()), so its
 * limits are canonical and wide: height 50–300 cm, weight 1–500 kg. Ours are
 * deliberately narrower because they are human-plausible rather than merely
 * storable.
 *
 * Checked: 39 in = 99 cm and 98 in = 249 cm, both inside 50–300.
 *          66 lbs = 29.9 kg and 661 lbs = 299.8 kg, both inside 1–500.
 *
 * The imperial figures are the metric ones pre-converted and stored as data.
 * They are NOT computed at runtime — computing them would put conversion math
 * on the client, which ADR-0001 forbids. If either side's numbers change, the
 * invariant above must be re-checked by hand.
 */
export const BOUNDS: {
  height: Record<UnitSystem, Bound<HeightUnit>>;
  weight: Record<UnitSystem, Bound<WeightUnit>>;
} = {
  height: {
    metric: { min: 100, max: 250, unit: 'cm' },
    imperial: { min: 39, max: 98, unit: 'in' },
  },
  weight: {
    metric: { min: 30, max: 300, unit: 'kg' },
    imperial: { min: 66, max: 661, unit: 'lbs' },
  },
};

/**
 * The `step` for a numeric input holding a Measured Field.
 *
 * Metric passes through the server unrounded, so a metric input must permit
 * decimals — a step of 1 would silently deny half-kilogram precision that the
 * server is perfectly willing to store.
 *
 * Imperial Body Weight is shown back to the nearest 0.5 lb, so its step
 * matches what the user will see.
 *
 * Imperial Training Weight is shown back to the nearest 5 lbs, but the step is
 * deliberately 0.5 and NOT 5. Forcing a 5 lb step would be the front-end
 * asserting the server's rounding rule, which is exactly the coupling ADR-0001
 * exists to prevent. The server rounds; the input only needs to avoid implying
 * precision that will be discarded.
 */
export function inputStep(kind: MeasurementKind, unitSystem: UnitSystem): number {
  if (kind === 'height') return 1;
  return unitSystem === 'imperial' ? 0.5 : 0.1;
}

/** The Unit System choice, rendered from one list so the two screens agree. */
export const UNIT_OPTIONS: ReadonlyArray<{
  value: UnitSystem;
  label: string;
  hint: string;
}> = [
  { value: 'metric', label: 'Metric', hint: 'kg · cm' },
  { value: 'imperial', label: 'Imperial', hint: 'lbs · in' },
];

/**
 * Normalise in-progress decimal text from a `decimal-pad` keyboard.
 *
 * On a de/fr/nl keyboard the decimal key emits ',' and `parseFloat('154,5')`
 * silently truncates to 154, so the comma is mapped to a dot. Everything other
 * than digits and dots is dropped, and only the first dot is kept.
 *
 * The returned text is deliberately allowed to be mid-typed (e.g. '154.'), so
 * the caller must keep it as a string until the value is committed.
 */
export function sanitizeDecimalText(raw: string): string {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const [head, ...rest] = normalized.split('.');
  return rest.length ? `${head}.${rest.join('')}` : head;
}

/** Parse sanitised decimal text, returning null for empty/garbage rather than NaN. */
export function parseDecimalText(text: string): number | null {
  const n = Number.parseFloat(text);
  return Number.isFinite(n) ? n : null;
}
