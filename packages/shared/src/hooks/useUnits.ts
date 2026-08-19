import type { UnitSystem } from '../types/api';
import { weightUnitLabel, heightUnitLabel, type WeightUnit, type HeightUnit } from '../units';
import { useProfile } from './useApi';

/**
 * Resolve the current user's Unit System once, so a component asks for the
 * unit it needs instead of walking the profile and re-deriving it.
 *
 * Defaults to metric when the profile has not loaded, matching the back-end,
 * where every user has a Unit System and metric is the default.
 */
export function useUnitSystem(): UnitSystem {
  const { data: profile } = useProfile();
  return profile?.profile?.unit_system ?? 'metric';
}

export function useWeightUnit(): WeightUnit {
  return weightUnitLabel(useUnitSystem());
}

export function useHeightUnit(): HeightUnit {
  return heightUnitLabel(useUnitSystem());
}
