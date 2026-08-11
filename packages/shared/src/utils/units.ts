import type { UnitSystem } from '../types/api';

export function weightUnitLabel(unitSystem?: UnitSystem | null): 'kg' | 'lbs' {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

export function heightUnitLabel(unitSystem?: UnitSystem | null): 'cm' | 'in' {
  return unitSystem === 'imperial' ? 'in' : 'cm';
}
