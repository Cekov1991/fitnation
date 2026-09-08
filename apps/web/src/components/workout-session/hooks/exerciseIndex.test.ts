import { describe, expect, it } from 'vitest';
import { indexAfterExercisesChange, initialExerciseIndex } from './exerciseIndex';

const names = (...n: string[]) => n.map(name => ({ name }));

describe('initialExerciseIndex', () => {
  it('lands on the named exercise, case-insensitively, else the first', () => {
    expect(initialExerciseIndex(names('Squat', 'Bench Press'), 'bench press ')).toBe(1);
    expect(initialExerciseIndex(names('Squat', 'Bench Press'), 'Deadlift')).toBe(0);
    expect(initialExerciseIndex(names('Squat'), null)).toBe(0);
    expect(initialExerciseIndex([], 'Squat')).toBe(0);
  });
});

describe('indexAfterExercisesChange', () => {
  it('jumps to a just-added exercise only when one was expected', () => {
    expect(indexAfterExercisesChange({ current: 0, previousLength: 2, nextLength: 3, expectingAddition: true })).toBe(2);
    expect(indexAfterExercisesChange({ current: 0, previousLength: 2, nextLength: 3, expectingAddition: false })).toBe(0);
  });

  it('clamps after a removal at the end, and stays put otherwise', () => {
    expect(indexAfterExercisesChange({ current: 2, previousLength: 3, nextLength: 2, expectingAddition: false })).toBe(1);
    expect(indexAfterExercisesChange({ current: 0, previousLength: 3, nextLength: 2, expectingAddition: false })).toBe(0);
  });

  it('is zero for an empty list and on the first load', () => {
    expect(indexAfterExercisesChange({ current: 3, previousLength: 3, nextLength: 0, expectingAddition: false })).toBe(0);
    expect(indexAfterExercisesChange({ current: 0, previousLength: 0, nextLength: 4, expectingAddition: false })).toBe(0);
  });
});
