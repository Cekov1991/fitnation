import { describe, expect, it } from 'vitest';
import { idleRestTimer, restJustCompleted, restTimerReducer, type RestTimerAction, type RestTimerState } from './restTimerReducer';

const run = (actions: RestTimerAction[], from: RestTimerState = idleRestTimer) => actions.reduce(restTimerReducer, from);

describe('restTimerReducer', () => {
  it('starts with one duration that is also the ring total', () => {
    expect(run([{ type: 'start', seconds: 90 }])).toEqual({ isActive: true, totalSeconds: 90, timeRemaining: 90 });
    expect(run([{ type: 'start', seconds: 0 }])).toEqual(idleRestTimer);
  });

  it('counts down and completes at zero', () => {
    const state = run([{ type: 'start', seconds: 2 }, { type: 'tick' }]);
    expect(state).toMatchObject({ isActive: true, timeRemaining: 1 });
    const done = restTimerReducer(state, { type: 'tick' });
    expect(done).toMatchObject({ isActive: false, timeRemaining: 0, totalSeconds: 2 });
    expect(restJustCompleted(state, done)).toBe(true);
  });

  it('adding time grows the ring total; subtracting to zero completes', () => {
    const grown = run([{ type: 'start', seconds: 30 }, { type: 'add', seconds: 15 }]);
    expect(grown).toEqual({ isActive: true, totalSeconds: 45, timeRemaining: 45 });
    const cut = run([{ type: 'subtract', seconds: 60 }], grown);
    expect(cut).toMatchObject({ isActive: false, timeRemaining: 0 });
    expect(restJustCompleted(grown, cut)).toBe(true);
  });

  it('dismissing is not completing', () => {
    const running = run([{ type: 'start', seconds: 30 }]);
    const dismissed = restTimerReducer(running, { type: 'dismiss' });
    expect(dismissed).toEqual(idleRestTimer);
    expect(restJustCompleted(running, dismissed)).toBe(false);
  });

  it('ignores ticks and adjustments while idle', () => {
    expect(run([{ type: 'tick' }, { type: 'add', seconds: 15 }, { type: 'subtract', seconds: 15 }])).toEqual(idleRestTimer);
  });

  it('a new start while running replaces the rest — one duration, never two', () => {
    expect(run([{ type: 'start', seconds: 90 }, { type: 'tick' }, { type: 'start', seconds: 60 }])).toEqual({ isActive: true, totalSeconds: 60, timeRemaining: 60 });
  });
});
