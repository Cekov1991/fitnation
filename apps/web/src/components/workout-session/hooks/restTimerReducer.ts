/**
 * The rest timer's state and transitions, as a pure reducer (0030). It used
 * to have three owners — a boolean and a duration in the session hook, the
 * countdown in useRestTimer, and a third copy of the total in RestTimer for
 * the progress ring, kept in sync by two effects. One state, one owner.
 */
export interface RestTimerState {
  isActive: boolean;
  /** The ring's denominator: what the rest started at, grown by any added time. */
  totalSeconds: number;
  timeRemaining: number;
}

export const idleRestTimer: RestTimerState = { isActive: false, totalSeconds: 0, timeRemaining: 0 };

export type RestTimerAction =
  | { type: 'start'; seconds: number }
  | { type: 'tick' }
  | { type: 'add'; seconds: number }
  | { type: 'subtract'; seconds: number }
  | { type: 'dismiss' };

export function restTimerReducer(state: RestTimerState, action: RestTimerAction): RestTimerState {
  switch (action.type) {
    case 'start':
      return action.seconds > 0 ? { isActive: true, totalSeconds: action.seconds, timeRemaining: action.seconds } : idleRestTimer;
    case 'tick': {
      if (!state.isActive) return state;
      const timeRemaining = Math.max(0, state.timeRemaining - 1);
      return { ...state, timeRemaining, isActive: timeRemaining > 0 };
    }
    case 'add': {
      if (!state.isActive) return state;
      const timeRemaining = state.timeRemaining + action.seconds;
      return { ...state, timeRemaining, totalSeconds: Math.max(state.totalSeconds, timeRemaining) };
    }
    case 'subtract': {
      if (!state.isActive) return state;
      const timeRemaining = Math.max(0, state.timeRemaining - action.seconds);
      return { ...state, timeRemaining, isActive: timeRemaining > 0 };
    }
    case 'dismiss':
      return idleRestTimer;
  }
}

/** True when the rest ran out — as opposed to being dismissed. */
export function restJustCompleted(before: RestTimerState, after: RestTimerState): boolean {
  return before.isActive && !after.isActive && after.totalSeconds > 0 && after.timeRemaining === 0;
}
