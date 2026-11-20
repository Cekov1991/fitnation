import { describe, expect, it } from 'vitest';
import { equipmentToStore, sameEquipmentSelection, selectableEquipment } from './equipmentSelection';

const list = [{ code: 'barbell' }, { code: 'dumbbell' }, { code: 'cable' }];

describe('selectableEquipment', () => {
  it('keeps stored codes present in the list, in stored order', () => {
    expect(selectableEquipment(['cable', 'barbell'], list)).toEqual(['cable', 'barbell']);
  });
  it('drops codes missing from the list', () => {
    expect(selectableEquipment(['barbell', 'trx'], list)).toEqual(['barbell']);
  });
  it('gives an empty selection for null, undefined and []', () => {
    expect(selectableEquipment(null, list)).toEqual([]);
    expect(selectableEquipment(undefined, list)).toEqual([]);
    expect(selectableEquipment([], list)).toEqual([]);
  });
  it('gives an empty selection while the list is still loading', () => {
    expect(selectableEquipment(['barbell'], [])).toEqual([]);
  });
});

describe('equipmentToStore', () => {
  it('maps empty to null and keeps a non-empty selection', () => {
    expect(equipmentToStore([])).toBeNull();
    expect(equipmentToStore(['barbell'])).toEqual(['barbell']);
  });
});

describe('sameEquipmentSelection', () => {
  it('ignores order and treats null as empty', () => {
    expect(sameEquipmentSelection(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameEquipmentSelection(null, [])).toBe(true);
    expect(sameEquipmentSelection(undefined, null)).toBe(true);
    expect(sameEquipmentSelection(['a'], null)).toBe(false);
    expect(sameEquipmentSelection(['a'], ['a', 'b'])).toBe(false);
  });
});
