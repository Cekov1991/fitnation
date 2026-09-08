import { useCallback, useEffect, useReducer, useRef } from 'react';
import { idleRestTimer, restJustCompleted, restTimerReducer, type RestTimerState } from './restTimerReducer';

export interface RestTimerHandle extends RestTimerState {
  formattedTime: string;
  /** Start (or restart) a rest; a null or zero duration is ignored. */
  start: (seconds: number | null | undefined) => void;
  dismiss: () => void;
  addTime: (seconds: number) => void;
  subtractTime: (seconds: number) => void;
}

/**
 * The one owner of the rest timer (0030): its state, its countdown, and what
 * happens when it runs out. The duration is captured at `start`, so switching
 * exercises mid-rest does not change the rest that is running.
 */
export function useRestTimer({ onComplete }: { onComplete?: () => void } = {}): RestTimerHandle {
  const [state, dispatch] = useReducer(restTimerReducer, idleRestTimer);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const previous = useRef(state);

  useEffect(() => {
    if (restJustCompleted(previous.current, state)) onCompleteRef.current?.();
    previous.current = state;
  }, [state]);

  useEffect(() => {
    if (!state.isActive) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [state.isActive]);

  const start = useCallback((seconds: number | null | undefined) => {
    if (seconds && seconds > 0) dispatch({ type: 'start', seconds });
  }, []);
  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);
  const addTime = useCallback((seconds: number) => dispatch({ type: 'add', seconds }), []);
  const subtractTime = useCallback((seconds: number) => dispatch({ type: 'subtract', seconds }), []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { ...state, formattedTime: formatTime(state.timeRemaining), start, dismiss, addTime, subtractTime };
}
