import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exercise } from '../types';
import { indexAfterExercisesChange, initialExerciseIndex } from './exerciseIndex';

export interface ExerciseIndexHandle {
  index: number;
  select: (index: number) => void;
  /** Move after a short pause, so the completed set is seen first. Cancelled on unmount. */
  advanceSoon: (to: number, delayMs?: number) => void;
  /** Tell the index an add is in flight, so the next longer list is "the new exercise". */
  expectAddition: (expecting: boolean) => void;
}

/**
 * The one owner of "which exercise is on screen" (0030). Applies the
 * navigation-state index once the exercises have loaded, follows the list when
 * an exercise is added or removed, and owns the delayed auto-advance — whose
 * timeout used to leak a state write on unmount.
 */
export function useExerciseIndex(exercises: Exercise[], initialExerciseName?: string | null): ExerciseIndexHandle {
  const [index, setIndex] = useState(() => initialExerciseIndex(exercises, initialExerciseName));
  const previousLength = useRef(exercises.length);
  const expectingAddition = useRef(false);
  const appliedInitial = useRef(false);
  const advanceTimeout = useRef<number | null>(null);

  // Returning from a detail page, the exercises load after mount; land on the named one once.
  useEffect(() => {
    if (initialExerciseName && exercises.length > 0 && !appliedInitial.current) {
      setIndex(initialExerciseIndex(exercises, initialExerciseName));
      appliedInitial.current = true;
    }
  }, [exercises, initialExerciseName]);

  useEffect(() => {
    const nextLength = exercises.length;
    setIndex(current =>
      indexAfterExercisesChange({
        current,
        previousLength: previousLength.current,
        nextLength,
        expectingAddition: expectingAddition.current,
      })
    );
    if (nextLength > previousLength.current) expectingAddition.current = false;
    previousLength.current = nextLength;
  }, [exercises.length]);

  const select = useCallback((to: number) => setIndex(to), []);
  const expectAddition = useCallback((expecting: boolean) => {
    expectingAddition.current = expecting;
  }, []);
  const advanceSoon = useCallback((to: number, delayMs = 500) => {
    if (advanceTimeout.current !== null) window.clearTimeout(advanceTimeout.current);
    advanceTimeout.current = window.setTimeout(() => {
      advanceTimeout.current = null;
      setIndex(to);
    }, delayMs);
  }, []);
  useEffect(
    () => () => {
      if (advanceTimeout.current !== null) window.clearTimeout(advanceTimeout.current);
    },
    []
  );

  return { index, select, advanceSoon, expectAddition };
}
